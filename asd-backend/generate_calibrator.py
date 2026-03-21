"""
Pre-generate severity calibrator from validation set
Run once to create calibrator_config.pkl
"""

import numpy as np
import tensorflow as tf
import joblib
from pathlib import Path

from preprocessing.ssae_inference import SSAEInference
from preprocessing.severity_calibrator import SeverityCalibrator


def generate_calibrator():
    """Generate calibrator from validation set"""
    
    model_dir = Path(__file__).parent / "models"
    
    print("\n🔧 Generating Severity Calibrator from Model Data\n")
    
    # Load training data
    print("Loading model artifacts...")
    X_fc_rfe = np.load(model_dir / "X_fc_rfe.npy")  # (216, 95)
    y_labels = np.load(model_dir / "y_labels.npy")  # (216,)
    
    print(f"  Data shape: {X_fc_rfe.shape}")
    print(f"  Labels distribution: {np.bincount(y_labels)}")
    
    # Load models
    print("\nLoading SSAE components...")
    encoder = tf.keras.models.load_model(model_dir / "ssae_encoder.keras")
    svm = joblib.load(model_dir / "svm_classifier.pkl")
    scaler = joblib.load(model_dir / "scaler.pkl")
    
    # Use training data for calibration (since we don't have separate validation set)
    print("\n📊 Extracting decision scores from training data...")
    latent = encoder.predict(X_fc_rfe, verbose=0)
    decision_scores = svm.decision_function(latent)
    
    print(f"Decision score statistics:")
    print(f"  Min: {decision_scores.min():.4f}")
    print(f"  Max: {decision_scores.max():.4f}")
    print(f"  Mean: {decision_scores.mean():.4f}")
    
    # Create calibrator
    print("\n🎯 Calibrating severity thresholds...")
    calibrator = SeverityCalibrator(
        decision_scores=decision_scores,
        labels=y_labels,
        percentile_low=33,
        percentile_high=67
    )
    
    # Save calibrator config
    config = {
        'threshold_low': float(calibrator.threshold_low),
        'threshold_high': float(calibrator.threshold_high),
        'percentile_low': calibrator.percentile_low,
        'percentile_high': calibrator.percentile_high,
        'roc_auc': float(calibrator.roc_auc)
    }
    
    joblib.dump(config, model_dir / "calibrator_config.pkl")
    print(f"\n✅ Calibrator saved: {model_dir / 'calibrator_config.pkl'}")
    
    # Test calibration
    print("\n🧪 Testing calibration on sample data...")
    sample_scores = decision_scores[:5]
    for i, score in enumerate(sample_scores):
        prob = calibrator.score_to_probability(score)
        severity = calibrator.probability_to_severity(prob)
        true_label = y_labels[i]
        print(f"  Sample {i}: score={score:.4f} → prob={prob:.4f} → severity={severity}")
    
    print("\n✓ Calibrator generation complete!")


if __name__ == "__main__":
    generate_calibrator()
