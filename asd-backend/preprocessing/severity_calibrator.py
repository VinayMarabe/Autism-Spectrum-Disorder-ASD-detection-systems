"""
Severity Calibration: Map SVM decision scores to probability and severity levels
Uses percentile-based thresholding on validation set decision scores
"""

import numpy as np
import pandas as pd
import joblib
from pathlib import Path
from scipy.special import expit as sigmoid
from sklearn.metrics import roc_curve, auc


class SeverityCalibrator:
    """Calibrate SVM decision scores to severity buckets"""
    
    def __init__(self, decision_scores, labels, percentile_low=33, percentile_high=67):
        """
        Initialize calibrator with validation set scores
        
        Args:
            decision_scores: Raw SVM decision function scores
            labels: Binary labels (0/1)
            percentile_low: Percentile for low/medium threshold (default 33rd)
            percentile_high: Percentile for medium/high threshold (default 67th)
        """
        self.decision_scores = decision_scores
        self.labels = labels
        self.percentile_low = percentile_low
        self.percentile_high = percentile_high
        
        # Calculate percentile thresholds
        self.threshold_low = np.percentile(decision_scores, percentile_low)
        self.threshold_high = np.percentile(decision_scores, percentile_high)
        
        # Calculate ROC curve for reference
        self.fpr, self.tpr, self.roc_thresholds = roc_curve(labels, decision_scores)
        self.roc_auc = auc(self.fpr, self.tpr)
        
        print("\n" + "="*70)
        print("SEVERITY CALIBRATION ANALYSIS")
        print("="*70)
        print(f"Decision score statistics:")
        print(f"  Min: {decision_scores.min():.4f}")
        print(f"  Mean: {decision_scores.mean():.4f}")
        print(f"  Median: {np.median(decision_scores):.4f}")
        print(f"  Max: {decision_scores.max():.4f}")
        print(f"\nPercentile thresholds:")
        print(f"  {percentile_low}th percentile (low/medium): {self.threshold_low:.4f}")
        print(f"  {percentile_high}th percentile (medium/high): {self.threshold_high:.4f}")
        print(f"\nROC-AUC Score: {self.roc_auc:.4f}")
        print("="*70 + "\n")
    
    def sigmoid_calibration(self, decision_score, scale=1.0):
        """
        Apply sigmoid calibration: P(Y=1) = 1 / (1 + exp(-score * scale))
        """
        return float(sigmoid(decision_score * scale))
    
    def score_to_probability(self, decision_score):
        """Convert decision score to calibrated probability [0, 1]"""
        return self.sigmoid_calibration(decision_score)
    
    def probability_to_severity(self, probability):
        """
        Map probability to severity level
        
        Args:
            probability: Float [0, 1]
            
        Returns:
            severity: 'low', 'medium', or 'high'
        """
        if probability < 0.33:
            return 'low'
        elif probability < 0.67:
            return 'medium'
        else:
            return 'high'
    
    def score_to_severity(self, decision_score):
        """
        Direct mapping from decision score to severity
        
        Args:
            decision_score: Raw SVM decision function score
            
        Returns:
            severity: 'low', 'medium', or 'high'
        """
        if decision_score < self.threshold_low:
            return 'low'
        elif decision_score < self.threshold_high:
            return 'medium'
        else:
            return 'high'
    
    def calibrate_batch(self, decision_scores):
        """
        Calibrate batch of decision scores
        
        Args:
            decision_scores: Array of raw SVM decision scores
            
        Returns:
            results: List of dicts with probability and severity
        """
        results = []
        for score in decision_scores:
            prob = self.score_to_probability(score)
            severity = self.probability_to_severity(prob)
            results.append({
                'decision_score': float(score),
                'probability': float(prob),
                'severity': severity
            })
        return results
    
    def save(self, filepath):
        """Save calibrator configuration"""
        config = {
            'threshold_low': float(self.threshold_low),
            'threshold_high': float(self.threshold_high),
            'percentile_low': self.percentile_low,
            'percentile_high': self.percentile_high,
            'roc_auc': float(self.roc_auc)
        }
        joblib.dump(config, filepath)
        print(f"✓ Calibrator saved: {filepath}")
    
    @staticmethod
    def load(filepath):
        """Load calibrator configuration"""
        return joblib.load(filepath)


def generate_calibration_from_validation(encoder, svm, X_val, y_val, scaler):
    """
    Generate calibration object from validation set
    
    Args:
        encoder: SSAE encoder
        svm: Trained SVM classifier
        X_val: Validation connectivity features (N, 95)
        y_val: Validation labels (N,)
        scaler: Fitted StandardScaler
        
    Returns:
        calibrator: SeverityCalibrator object
    """
    print("\n📊 Generating severity calibration from validation set...")
    
    # Extract latent features
    latent_val = encoder.predict(X_val, verbose=0)
    
    # Get decision scores
    decision_scores = svm.decision_function(latent_val)
    
    # Create calibrator
    calibrator = SeverityCalibrator(decision_scores, y_val)
    
    return calibrator
