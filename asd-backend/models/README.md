# Backend Models Directory

This directory contains the trained SSAE model artifacts:

- `ssae_encoder.keras` - Stacked Sparse AutoEncoder (95 → 80 → 48 → 32 dimensions)
- `svm_classifier.pkl` - SVM classifier trained on latent space
- `scaler.pkl` - StandardScaler for feature normalization
- `rfe_support_mask.npy` - Boolean mask for RFE feature selection (5995 → 95)
- `X_fc_rfe.npy` - Training data (216 × 95)
- `y_labels.npy` - Training labels (216,)
- `calibrator_config.pkl` - Severity calibration thresholds (generated at startup)

## Model Pipeline

1. **Input**: 4D fMRI scan (.nii/.nii.gz)
2. **ROI Extraction**: Harvard-Oxford 110 ROI atlas
3. **Connectivity**: Pearson correlation (110 × 110)
4. **Feature Selection**: RFE mask (5995 → 95 features)
5. **Scaling**: StandardScaler normalization
6. **Encoding**: SSAE encoder (95 → 32 latent)
7. **Classification**: SVM on latent space
8. **Calibration**: Decision score → Probability → Severity

## Files Copied From Training

```bash
C:\Users\Lenovo\OneDrive\Desktop\data\SSAE\NewAtlas\
├── ssae_encoder.keras
├── svm_classifier.pkl
├── rfe_support_mask.npy
├── X_fc_rfe.npy
└── y_labels.npy
```

Note: `scaler.pkl` needs to be generated using `generate_scaler.py` if not present.
