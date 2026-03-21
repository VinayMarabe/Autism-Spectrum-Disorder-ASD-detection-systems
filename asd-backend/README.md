# ASD Detection Backend

FastAPI-based backend for ASD detection using SSAE (Stacked Sparse AutoEncoder) model.

## Setup

1. Copy environment template and provide secrets:
```bash
cp .env.example .env
# edit .env to add GROQ_API_KEY, DATABASE_URL, etc.
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Generate severity calibrator (one-time):
```bash
python generate_calibrator.py
```

4. Start the server:
```bash
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

The server will start at `http://127.0.0.1:8001`

## API Endpoints

### Health Check
```
GET /health
```
Returns model status and readiness.

### ASD Analysis
```
POST /asd_analysis
Content-Type: multipart/form-data

Parameters:
- mri: 4D fMRI file (.nii or .nii.gz)
- patient_id: Patient identifier
- patient_name: Patient name
- patient_age: Patient age (optional)
- symptoms: Behavioral notes (optional)

Response:
{
  "pred_label": 0 or 1,
  "asd_prob": 0.0-1.0,
  "severity_bucket": "low" | "medium" | "high",
  "explanation": "Plain text explanation",
  "report_url": "/reports_v2/...",
  "metadata": {...}
}
```

## Patient Registry + Chat (NEW)

The backend now persists patient profiles, screening history, and chat transcripts in SQLite (see `DATABASE_URL`). Core endpoints:

| Method | Path | Description |
|--------|------|-------------|
| GET | `/patients` | List patients with latest screening summary |
| POST | `/patients` | Create or update a patient profile |
| GET | `/patients/{id}` | Fetch a single patient |
| POST | `/patients/{id}/screenings` | Push screening results + feed RAG index |
| GET | `/patients/{id}/chat` | Retrieve prior clinician-assistant messages |
| POST | `/patients/{id}/chat` | Send a question; answers use Groq + RAG |

**Chat Features:**
- Enable by providing `GROQ_API_KEY` in `.env`
- Retrieval-augmented: indexes CSVs + reports defined in `RAG_SOURCES`
- Persists conversation history in database
- Each response includes cited evidence (source + snippet)

## Processing Pipeline

1. **Load fMRI**: Read 4D NIfTI file (time_steps × 91 × 109 × 91)
2. **Extract ROI Timeseries**: Use Harvard-Oxford 110 ROI atlas
3. **Compute Connectivity**: Pearson correlation (110 × 110 matrix)
4. **Feature Selection**: Apply RFE mask (5995 → 95 features)
5. **Extract Latent Features**: SSAE encoder (95 → 32 dimensions)
6. **Classification**: SVM prediction on latent space
7. **Calibration**: Map decision score → probability → severity

## Model Architecture

- **Encoder**: Stacked Sparse AutoEncoder (95 → 80 → 48 → 32)
- **Classifier**: SVM with RBF kernel on latent space
- **Input**: 95D connectivity features
- **Output**: Binary classification (Control/ASD) + confidence

## Feature Details

| Component | Dimensions | Notes |
|-----------|-----------|-------|
| fMRI file | 4D (time × 91 × 109 × 91) | MNI-registered |
| ROI timeseries | (time, 110) | Harvard-Oxford atlas |
| Correlation matrix | (110, 110) | Pearson |
| Full connectivity vector | (5995,) | Upper triangle |
| RFE-selected features | (95,) | Model input |
| Latent representation | (32,) | Encoder output |
| SVM decision score | (scalar) | Raw model output |
| Calibrated probability | [0, 1] | Final prediction |

## Notes

- Input fMRI should be preprocessed (MNI-registered, realigned, slice-timed)
- All fMRI files are assumed to be in MNI152 2mm template space
- Severity calibration uses percentile-based thresholding
- No Grad-CAM available (SSAE is not a CNN)
