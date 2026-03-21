"""
Extract and save the scaler from training data
Run if scaler.pkl is missing from models directory
"""

import numpy as np
import joblib
from pathlib import Path
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split

print("📊 Extracting scaler from training data...\n")

model_dir = Path(__file__).parent / "models"

# Load training data
X_fc_rfe = np.load(model_dir / "X_fc_rfe.npy")
y_labels = np.load(model_dir / "y_labels.npy")

print(f"Data shape: {X_fc_rfe.shape}")
print(f"Labels: {np.bincount(y_labels)}\n")

# Split data same way as training (70/15/15)
X_temp, X_test, y_temp, y_test = train_test_split(
    X_fc_rfe, y_labels,
    test_size=0.15,
    stratify=y_labels,
    random_state=42
)

X_train, X_val, y_train, y_val = train_test_split(
    X_temp, y_temp,
    test_size=0.18,
    stratify=y_temp,
    random_state=42
)

# Fit scaler on training data
scaler = StandardScaler()
scaler.fit(X_train)

# Save scaler
scaler_path = model_dir / "scaler.pkl"
joblib.dump(scaler, scaler_path)

print(f"✓ Scaler saved: {scaler_path}")
print(f"  Mean shape: {scaler.mean_.shape}")
print(f"  Std shape: {scaler.scale_.shape}")
print(f"  Feature range: [{scaler.mean_.min():.4f}, {scaler.mean_.max():.4f}]")
