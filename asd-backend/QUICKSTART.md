# 🚀 Quick Start Guide - ASD Backend Integration

## What Was Created

A complete FastAPI backend that replaces your existing model with the SSAE (Stacked Sparse AutoEncoder) model for ASD detection from fMRI scans.

### Project Structure

```
asd-backend/
├── main.py                           # FastAPI application
├── requirements.txt                   # Python dependencies
├── start.bat                         # Windows startup script
├── generate_calibrator.py            # Create severity calibration
├── generate_scaler.py                # Extract scaler from training data
├── test_setup.py                     # Verify setup
├── README.md                         # Full documentation
├── models/                           # Model artifacts (copied from SSAE/NewAtlas)
│   ├── ssae_encoder.keras           # 95→32 encoder
│   ├── svm_classifier.pkl           # SVM classifier
│   ├── rfe_support_mask.npy         # Feature selection mask
│   ├── X_fc_rfe.npy                 # Training data
│   ├── y_labels.npy                 # Training labels
│   └── README.md
└── preprocessing/                    # Processing pipeline
    ├── fmri_processor.py            # 4D fMRI → connectivity features
    ├── ssae_inference.py            # Encoder + SVM inference
    └── severity_calibrator.py       # Probability → severity mapping
```

## Installation & Setup

### Option 1: Automated (Windows)
```bash
cd C:\Users\Lenovo\OneDrive\Desktop\asd-backend
start.bat
```

This will:
1. Create Python 3.11 virtual environment
2. Install all dependencies
3. Generate scaler and calibrator
4. Start the server at `http://127.0.0.1:8001`

### Option 2: Manual
```bash
cd C:\Users\Lenovo\OneDrive\Desktop\asd-backend

# Create virtual environment with Python 3.11 (required for TensorFlow)
py -3.11 -m venv venv
venv\Scripts\activate

# Install dependencies
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt

# Generate scaler (if not present)
python generate_scaler.py

# Generate calibrator
python generate_calibrator.py

# Start server
python main.py
```

## How It Works

### 1. Frontend Stays Unchanged ✅
Your React frontend at `c:\Users\Lenovo\OneDrive\Desktop\asd-frontend` continues to work without changes:
- Same API endpoint: `POST /asd_analysis`
- Same request format: multipart/form-data with `mri` file
- Same response format: JSON with `pred_label`, `asd_prob`, `severity_bucket`

### 2. Backend Processing Pipeline

```
4D fMRI Upload (.nii/.nii.gz)
    ↓
Extract ROI Timeseries (Harvard-Oxford 110 atlas)
    ↓
Compute Functional Connectivity (Pearson correlation 110×110)
    ↓
Extract Upper Triangle (5,995 features)
    ↓
Apply RFE Mask (→ 95 selected features)
    ↓
Normalize with StandardScaler
    ↓
SSAE Encoder (95 → 80 → 48 → 32 latent)
    ↓
SVM Classification (latent → decision score)
    ↓
Sigmoid Calibration (decision score → probability)
    ↓
Severity Mapping (probability → low/medium/high)
    ↓
Return JSON response
```

### 3. Model Performance (from training)
- **Test Accuracy**: ~94-96% (from final_ssae_training.ipynb)
- **Latent Dimension**: 32
- **Input Features**: 95 (RFE-selected from 5,995 connectivity features)
- **Output**: Binary (Control=0, ASD=1) + confidence score

## API Reference

### Health Check
```bash
GET http://127.0.0.1:8001/health
```

Response:
```json
{
  "status": "healthy",
  "model": "SSAE + SVM",
  "ready": true
}
```

### ASD Analysis
```bash
POST http://127.0.0.1:8001/asd_analysis
Content-Type: multipart/form-data

Form Fields:
- mri: File (.nii or .nii.gz)
- patient_id: string
- patient_name: string
- patient_age: int (optional)
- symptoms: string (optional)
```

Response:
```json
{
  "pred_label": 0 or 1,
  "asd_prob": 0.87,
  "severity_bucket": "high",
  "explanation": "Based on fMRI analysis...",
  "report_url": "/reports_v2/...",
  "gradcam_url": null,
  "cam_images": {"main": null},
  "metadata": {
    "patient_id": "12345",
    "decision_score": 1.23,
    "model": "SSAE + SVM",
    "latent_dim": 32
  }
}
```

## Testing

### 1. Verify Setup
```bash
python test_setup.py
```

### 2. Test with Sample fMRI
```bash
# Copy a sample from your dataset
copy "C:\Users\Lenovo\OneDrive\Desktop\data\all_nii\Caltech_0051456_func_preproc.nii" test_sample.nii

# Use curl or Postman to test
curl -X POST "http://127.0.0.1:8001/asd_analysis" \
  -F "mri=@test_sample.nii" \
  -F "patient_id=TEST001" \
  -F "patient_name=Test Patient" \
  -F "patient_age=25"
```

### 3. Frontend Integration
1. Start backend: `python main.py`
2. Start frontend: `cd ..\asd-frontend && npm start`
3. Navigate to Detection page
4. Upload fMRI file
5. View results

## Important Notes

⚠️ **fMRI Requirements**:
- Files must be **preprocessed and MNI-registered**
- Standard space: MNI152 2mm
- Format: 4D NIfTI (.nii or .nii.gz)
- Your `all_nii` dataset files should work directly

⚠️ **Python Version**:
- **Must use Python 3.10 or 3.11** (TensorFlow 2.13-2.20 not compatible with 3.12+)
- Default Python 3.14 won't work

⚠️ **No Grad-CAM**:
- SSAE is an autoencoder + SVM (not a CNN)
- No attention maps like before
- Frontend will show severity meter but not heatmaps

⚠️ **Harvard-Oxford Atlas**:
- Downloads automatically on first run (via nilearn)
- Cached to `~/.cache/nilearn_data/`
- ~50 MB download

## Troubleshooting

### Dependencies Won't Install
```bash
# Use Python 3.11 explicitly
py -3.11 -m venv venv
venv\Scripts\activate
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
```

### Scaler Not Found
```bash
python generate_scaler.py
```

### Atlas Download Fails
```python
from nilearn import datasets
atlas = datasets.fetch_atlas_harvard_oxford('cort+subcort')
print(f"Atlas location: {atlas.maps}")
```

### Server Won't Start
1. Check port 8001 is available: `netstat -ano | findstr :8001`
2. Kill conflicting process or change port in `main.py`
3. Check logs for missing files

## Next Steps

1. ✅ Backend is ready
2. Install dependencies: `cd asd-backend && start.bat`
3. Test health endpoint: Visit `http://127.0.0.1:8001/health`
4. Test with sample fMRI from `all_nii` directory
5. Frontend will connect automatically (same API contract)

## Support

- Backend code: `c:\Users\Lenovo\OneDrive\Desktop\asd-backend`
- Model files: `c:\Users\Lenovo\OneDrive\Desktop\data\SSAE\NewAtlas`
- Sample data: `c:\Users\Lenovo\OneDrive\Desktop\data\all_nii`
- Frontend: `c:\Users\Lenovo\OneDrive\Desktop\asd-frontend`

---

**Ready to go!** Run `start.bat` to begin. 🚀
