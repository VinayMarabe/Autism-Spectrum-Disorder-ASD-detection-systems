"""
Quick test of backend setup - verify all components load
"""

import sys
from pathlib import Path

print("Testing SSAE Backend Components...\n")

# Test 1: Check model files exist
print("📁 Checking model files...")
model_dir = Path(__file__).parent / "models"
required_files = [
    "ssae_encoder.keras",
    "svm_classifier.pkl",
    "scaler.pkl",
    "rfe_support_mask.npy",
    "X_fc_rfe.npy",
    "y_labels.npy"
]

for f in required_files:
    fpath = model_dir / f
    if fpath.exists():
        size = fpath.stat().st_size / 1024 / 1024
        print(f"  ✓ {f} ({size:.2f} MB)")
    else:
        print(f"  ✗ {f} NOT FOUND")
        sys.exit(1)

print("\n✅ All model files present!")
print("\nTo start the server, run:")
print("  python main.py")
print("\nOr with uvicorn:")
print("  uvicorn main:app --host 127.0.0.1 --port 8001 --reload")
