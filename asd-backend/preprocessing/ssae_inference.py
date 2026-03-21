"""
SSAE Model Inference: Encoder + SVM Classification
Loads trained encoder and SVM classifier for ASD prediction
"""

import numpy as np
import tensorflow as tf
import joblib
from pathlib import Path


class SSAEInference:
    """SSAE encoder + SVM inference wrapper"""
    
    def __init__(self, encoder_path, svm_path, scaler_path):
        """
        Load SSAE encoder and SVM classifier
        
        Args:
            encoder_path: Path to encoder.keras
            svm_path: Path to svm_classifier.pkl
            scaler_path: Path to scaler.pkl
        """
        print("\n🔧 Loading SSAE model components...")
        
        # Load encoder
        print(f"  → Loading encoder: {Path(encoder_path).name}")
        self.encoder = tf.keras.models.load_model(encoder_path)
        print(f"    Encoder input shape: {self.encoder.input_shape}")
        print(f"    Latent dimension: {self.encoder.output_shape}")
        
        # Load SVM classifier
        print(f"  → Loading SVM: {Path(svm_path).name}")
        self.svm = joblib.load(svm_path)
        print(f"    SVM kernel: {self.svm.kernel}")
        print(f"    SVM classes: {self.svm.classes_}")
        
        # Load scaler
        print(f"  → Loading scaler: {Path(scaler_path).name}")
        self.scaler = joblib.load(scaler_path)
        print(f"    Scaler mean shape: {self.scaler.mean_.shape}")
        
        print("✓ SSAE model loaded successfully\n")
    
    def predict(self, features, return_decision_function=True):
        """
        Predict ASD class from connectivity features
        
        Args:
            features: (95,) connectivity feature vector
            return_decision_function: Whether to return raw SVM decision score
            
        Returns:
            pred_label: 0 (Control) or 1 (ASD)
            pred_proba: Sigmoid-calibrated probability [0, 1]
            decision_score: Raw SVM decision function (for calibration)
            latent: (32,) latent representation from encoder
        """
        # Reshape for model
        features_reshaped = features.reshape(1, -1)
        
        # Extract latent representation
        latent = self.encoder.predict(features_reshaped, verbose=0)[0]
        
        # Get SVM prediction and decision score
        pred_label = self.svm.predict(latent.reshape(1, -1))[0]
        decision_score = self.svm.decision_function(latent.reshape(1, -1))[0]
        
        # Calibrate decision score to probability using sigmoid
        # Assuming decision scores are approximately normally distributed
        pred_proba = self._sigmoid_calibration(decision_score)
        
        return {
            'pred_label': int(pred_label),
            'pred_proba': float(pred_proba),
            'decision_score': float(decision_score),
            'latent': latent
        }
    
    def _sigmoid_calibration(self, decision_score, scale=1.0):
        """
        Calibrate raw decision score to probability [0, 1]
        Uses standard logistic sigmoid: P(Y=1) = 1 / (1 + exp(-decision_score * scale))
        
        Scale parameter allows tuning calibration curve
        """
        prob = 1.0 / (1.0 + np.exp(-decision_score * scale))
        return np.clip(prob, 0.0, 1.0)
    
    def batch_predict(self, features_batch):
        """
        Predict on batch of samples
        
        Args:
            features_batch: (N, 95) array of feature vectors
            
        Returns:
            predictions: List of dicts with pred_label, pred_proba, decision_score
        """
        predictions = []
        for features in features_batch:
            pred = self.predict(features)
            predictions.append(pred)
        return predictions
