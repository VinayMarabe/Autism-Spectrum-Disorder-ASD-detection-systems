"""
FastAPI Backend for ASD Detection with SSAE Model
Endpoint: POST /asd_analysis
Accepts 4D fMRI → Returns ASD prediction with confidence & severity
"""

from fastapi import Depends, FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import tempfile
import numpy as np
import joblib
from pathlib import Path
import traceback
import os
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend
import matplotlib.pyplot as plt
import seaborn as sns

# Try to load preprocessing models; fail gracefully if TensorFlow unavailable
try:
    from preprocessing.fmri_processor import fMRIProcessor, get_atlas_path
    from preprocessing.ssae_inference import SSAEInference
    from preprocessing.severity_calibrator import SeverityCalibrator
    PREPROCESSING_AVAILABLE = True
except (ImportError, ModuleNotFoundError) as e:
    print(f"⚠️  Preprocessing models unavailable: {e}")
    PREPROCESSING_AVAILABLE = False

from config import get_settings
from database import Base, SessionLocal, engine
from schemas import ChatHistoryMessage, ChatRequest, ChatResponse, PatientResponse, PatientUpsert, ScreeningPayload
from services import patient_service
from services.chat_service import ChatService
from services.rag_service import RAGService

# Initialize FastAPI app
settings = get_settings()

app = FastAPI(
    title="ASD Detection Backend (SSAE)",
    description="fMRI → Connectivity → SSAE Classification",
    version="1.0.0"
)

# Add CORS middleware to allow requests from frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.frontend_origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create reports directory and mount static files
REPORTS_DIR = Path(__file__).parent / "reports_v2"
REPORTS_DIR.mkdir(exist_ok=True)
app.mount("/reports_v2", StaticFiles(directory=str(REPORTS_DIR)), name="reports_v2")

# Create heatmaps directory and mount static files
HEATMAPS_DIR = Path(__file__).parent / "heatmaps"
HEATMAPS_DIR.mkdir(exist_ok=True)
app.mount("/heatmaps", StaticFiles(directory=str(HEATMAPS_DIR)), name="heatmaps")

# Global model instances (loaded at startup)
processor = None
ssae = None
calibrator = None

# Database + RAG/LLM services
Base.metadata.create_all(bind=engine)
rag_service = RAGService()
try:
    rag_service.warm()
except Exception as rag_err:
    print(f"⚠️  RAG initialization issue: {rag_err}")
chat_service: ChatService | None = None
try:
    chat_service = ChatService(rag_service)
except Exception as chat_err:
    print(f"⚠️  Chat service disabled: {chat_err}")

print("🚀 Initializing ASD Detection Backend...\n")


def initialize_models():
    """Load all models at startup"""
    global processor, ssae, calibrator
    
    if not PREPROCESSING_AVAILABLE:
        print("⏭️  Skipping preprocessing model load (TensorFlow unavailable)")
        print("   Chat API will work; MRI screening endpoint (/asd_analysis) will be unavailable\n")
        return
    
    model_dir = Path(__file__).parent / "models"
    
    # Load fMRI processor with atlas
    print("📁 Setting up fMRI processor...")
    atlas_path = get_atlas_path()
    if not atlas_path:
        raise RuntimeError("Could not load Harvard-Oxford atlas")
    
    scaler = joblib.load(model_dir / "scaler.pkl")
    processor = fMRIProcessor(
        atlas_path=atlas_path,
        rfe_mask_path=str(model_dir / "rfe_support_mask.npy"),
        scaler_obj=scaler
    )
    
    # Load SSAE model
    print("\n🤖 Loading SSAE model...")
    ssae = SSAEInference(
        encoder_path=str(model_dir / "ssae_encoder.keras"),
        svm_path=str(model_dir / "svm_classifier.pkl"),
        scaler_path=str(model_dir / "scaler.pkl")
    )
    
    # Load severity calibrator
    print("\n📊 Loading severity calibrator...")
    try:
        calibrator_config = joblib.load(model_dir / "calibrator_config.pkl")
        calibrator = SeverityCalibrator(
            decision_scores=np.zeros(100),  # Dummy for initialization
            labels=np.zeros(100),
            percentile_low=calibrator_config.get('percentile_low', 33),
            percentile_high=calibrator_config.get('percentile_high', 67)
        )
        calibrator.threshold_low = calibrator_config['threshold_low']
        calibrator.threshold_high = calibrator_config['threshold_high']
        print(f"✓ Calibrator loaded: {model_dir / 'calibrator_config.pkl'}")
    except FileNotFoundError:
        print("⚠️  Calibrator config not found. Using default thresholds (0, 0.5)")
        calibrator = SeverityCalibrator(
            decision_scores=np.linspace(-2, 2, 100),
            labels=np.concatenate([np.zeros(50), np.ones(50)])
        )
    
    print("\n✅ All models initialized successfully!\n")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def generate_connectivity_heatmap(fc_matrix, filepath, patient_name="Patient", pred_label=0, asd_prob=0.0):
    """
    Generate and save a connectivity heatmap from the functional connectivity matrix
    
    Args:
        fc_matrix: (n_rois, n_rois) correlation matrix
        filepath: Path to save the heatmap image
        patient_name: Patient name for title
        pred_label: 0=Control, 1=ASD
        asd_prob: ASD probability for annotation
    """
    try:
        fig, ax = plt.subplots(figsize=(10, 8))
        
        # Create heatmap with diverging colormap
        mask = np.triu(np.ones_like(fc_matrix, dtype=bool), k=1)  # Show lower triangle
        
        sns.heatmap(
            fc_matrix,
            mask=mask,
            cmap='RdBu_r',
            center=0,
            vmin=-1,
            vmax=1,
            square=True,
            linewidths=0,
            cbar_kws={'label': 'Correlation', 'shrink': 0.8},
            ax=ax
        )
        
        # Add title and labels
        result_text = "ASD" if pred_label == 1 else "Control"
        ax.set_title(
            f"Functional Connectivity Matrix\\n{patient_name} | Prediction: {result_text} ({asd_prob*100:.1f}%)",
            fontsize=12,
            fontweight='bold',
            pad=15
        )
        ax.set_xlabel("Brain Region", fontsize=10)
        ax.set_ylabel("Brain Region", fontsize=10)
        
        # Remove tick labels for cleaner appearance (too many ROIs)
        ax.set_xticks([])
        ax.set_yticks([])
        
        # Add annotation box
        textstr = f'ROIs: {fc_matrix.shape[0]}\\nConnections: {fc_matrix.shape[0]*(fc_matrix.shape[0]-1)//2}'
        props = dict(boxstyle='round', facecolor='white', alpha=0.8)
        ax.text(0.02, 0.98, textstr, transform=ax.transAxes, fontsize=9,
                verticalalignment='top', bbox=props)
        
        plt.tight_layout()
        plt.savefig(filepath, dpi=150, bbox_inches='tight', facecolor='white')
        plt.close(fig)
        
        print(f"  ✓ Heatmap saved: {filepath}")
        return True
    except Exception as e:
        print(f"  ⚠️ Heatmap generation failed: {e}")
        return False


def serialize_patient(patient) -> PatientResponse:
    latest = None
    if patient.screenings:
        last = sorted(patient.screenings, key=lambda x: x.created_at)[-1]
        latest = {
            "predicted_class": last.predicted_class,
            "prob_asd": last.prob_asd,
            "severity_bucket": last.severity_bucket,
            "created_at": last.created_at,
        }
    return PatientResponse(
        id=patient.id,
        name=patient.name,
        age=patient.age,
        gender=patient.gender,
        notes=patient.notes,
        metadata=patient.metadata_json,
        created_at=patient.created_at,
        updated_at=patient.updated_at,
        latest_screening=latest,
    )


# Initialize models on startup
try:
    initialize_models()
except Exception as e:
    print(f"❌ Error during initialization: {e}")
    print(traceback.format_exc())


@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "model": "SSAE + SVM",
        "ready": processor is not None and ssae is not None,
        "accuracy": 0.95,  # Model test accuracy ~94-96%
        "device": "cpu"
    }


@app.get("/patients", response_model=list[PatientResponse])
def list_patients_endpoint(db=Depends(get_db)):
    patients = patient_service.list_patients(db)
    return [serialize_patient(p) for p in patients]


@app.post("/patients", response_model=PatientResponse)
def upsert_patient_endpoint(payload: PatientUpsert, db=Depends(get_db)):
    patient = patient_service.upsert_patient(
        db,
        patient_id=payload.id,
        name=payload.name,
        age=payload.age,
        gender=payload.gender,
        notes=payload.notes,
        metadata=payload.metadata,
    )
    return serialize_patient(patient)


@app.get("/patients/{patient_id}", response_model=PatientResponse)
def get_patient_endpoint(patient_id: str, db=Depends(get_db)):
    patient = patient_service.get_patient(db, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return serialize_patient(patient)


@app.get("/patients/{patient_id}/chat", response_model=list[ChatHistoryMessage])
def get_patient_chat(patient_id: str, db=Depends(get_db)):
    history = patient_service.get_chat_history(db, patient_id, limit=30)
    return [
        ChatHistoryMessage(
            role=item.role,
            content=item.content,
            created_at=item.created_at,
            sources=item.sources,
        )
        for item in reversed(history)
    ]


@app.post("/patients/{patient_id}/chat", response_model=ChatResponse)
def send_chat_message(patient_id: str, payload: ChatRequest, db=Depends(get_db)):
    if chat_service is None:
        raise HTTPException(status_code=503, detail="Chat service not configured (missing LLM key)")
    patient = patient_service.get_patient(db, patient_id)
    if patient is None:
        if not payload.patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        patient = patient_service.upsert_patient(
            db,
            patient_id=payload.patient.id or patient_id,
            name=payload.patient.name,
            age=payload.patient.age,
            gender=payload.patient.gender,
            notes=payload.patient.notes,
            metadata=payload.patient.metadata,
        )
    response = chat_service.answer(db, patient=patient, question=payload.message)
    return response


@app.post("/patients/{patient_id}/screenings", response_model=PatientResponse)
def add_screening(patient_id: str, payload: ScreeningPayload, db=Depends(get_db)):
    patient = patient_service.get_patient(db, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    patient_service.record_screening(
        db,
        patient_id=patient_id,
        predicted_class=payload.predicted_class,
        prob_asd=payload.prob_asd,
        severity_bucket=payload.severity_bucket,
        payload=payload.metadata,
    )
    summary_text = (
        f"Latest screening for {patient.name}: class {payload.predicted_class}, "
        f"probability {payload.prob_asd}, severity {payload.severity_bucket}."
    )
    rag_service.add_document(
        patient_id=patient_id,
        source="screening",
        text=summary_text,
        metadata={"type": "screening", **(payload.metadata or {})},
    )
    db.refresh(patient)
    return serialize_patient(patient)


@app.post("/asd_analysis")
async def asd_analysis(
    mri: UploadFile = File(...),
    patient_id: str = Form("UNKNOWN"),
    patient_name: str = Form("Unknown"),
    patient_age: int = Form(None),
    symptoms: str = Form("")
):
    """
    Analyze fMRI for ASD detection
    
    Args:
        mri: 4D fMRI file (.nii or .nii.gz)
        patient_id: Patient identifier
        patient_name: Patient name
        patient_age: Patient age (optional)
        symptoms: Behavioral notes (optional)
    
    Returns:
        JSON with pred_label, asd_prob, severity_bucket, explanation, etc.
    """
    
    if not PREPROCESSING_AVAILABLE:
        raise HTTPException(status_code=503, detail="MRI screening unavailable (TensorFlow not installed); chat API is available")
    
    if processor is None or ssae is None or calibrator is None:
        raise HTTPException(status_code=503, detail="Models not initialized")
    
    try:
        # Save uploaded file to temporary location
        # Detect if file is gzipped based on content
        content = await mri.read()
        is_gzipped = content[:2] == b'\x1f\x8b'  # Gzip magic number
        suffix = ".nii.gz" if is_gzipped else ".nii"
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(content)
            tmp_path = tmp.name
        
        print(f"\n📥 Processing request for {patient_name} (ID: {patient_id})")
        
        # Process fMRI
        features, fc_matrix, timeseries = processor.process(tmp_path)
        
        # Make prediction
        print(f"\n🧠 Running SSAE inference...")
        pred_result = ssae.predict(features)
        
        # Calibrate to severity
        decision_score = pred_result['decision_score']
        asd_prob = calibrator.score_to_probability(decision_score)
        severity = calibrator.probability_to_severity(asd_prob)
        
        print(f"  ✓ Prediction: {'ASD' if pred_result['pred_label'] == 1 else 'Control'}")
        print(f"  ✓ Confidence: {asd_prob:.2%}")
        print(f"  ✓ Severity: {severity.upper()}")
        
        # Generate explanation
        explanation = generate_explanation(
            pred_label=pred_result['pred_label'],
            asd_prob=asd_prob,
            severity=severity,
            patient_age=patient_age,
            symptoms=symptoms
        )
        
        # Generate and save HTML report
        report_filename = f"{patient_id}_{patient_name}_report.html"
        report_path = REPORTS_DIR / report_filename
        generate_report_html(
            filepath=report_path,
            patient_id=patient_id,
            patient_name=patient_name,
            patient_age=patient_age,
            pred_label=pred_result['pred_label'],
            asd_prob=asd_prob,
            severity=severity,
            explanation=explanation,
            symptoms=symptoms
        )
        
        # Generate and save connectivity heatmap
        heatmap_filename = f"{patient_id}_{patient_name}_heatmap.png"
        heatmap_path = HEATMAPS_DIR / heatmap_filename
        heatmap_generated = generate_connectivity_heatmap(
            fc_matrix=fc_matrix,
            filepath=heatmap_path,
            patient_name=patient_name,
            pred_label=pred_result['pred_label'],
            asd_prob=asd_prob
        )
        heatmap_url = f"/heatmaps/{heatmap_filename}" if heatmap_generated else None
        
        # Prepare response matching frontend contract
        response = {
            "pred_label": pred_result['pred_label'],  # 0=Control, 1=ASD
            "asd_prob": float(asd_prob),  # Probability 0-1
            "severity_bucket": severity,  # low, medium, high
            "explanation": explanation,
            "report_url": f"/reports_v2/{report_filename}",
            "gradcam_url": heatmap_url,  # Connectivity heatmap
            "cam_images": {"main": heatmap_url},
            "metadata": {
                "patient_id": patient_id,
                "patient_name": patient_name,
                "patient_age": patient_age,
                "decision_score": float(decision_score),
                "model": "SSAE + SVM",
                "latent_dim": int(pred_result['latent'].shape[0])
            }
        }

        try:
            with SessionLocal() as db:
                patient = patient_service.upsert_patient(
                    db,
                    patient_id=patient_id if patient_id != "UNKNOWN" else None,
                    name=patient_name or "Unknown",
                    age=patient_age,
                    gender=None,
                    notes=symptoms,
                    metadata=None,
                )
                patient_service.record_screening(
                    db,
                    patient_id=patient.id,
                    predicted_class=response["pred_label"],
                    prob_asd=response["asd_prob"],
                    severity_bucket=severity,
                    payload=response,
                )
                rag_service.add_document(
                    patient_id=patient.id,
                    source="screening",
                    text=f"Screening summary for {patient.name}: prediction {response['pred_label']}, ASD probability {response['asd_prob']:.2f}, severity {severity}. Notes: {symptoms}",
                    metadata={"type": "screening", "report": response.get("report_url")},
                )
        except Exception as persist_err:
            print(f"⚠️  Persistence warning: {persist_err}")
        
        return JSONResponse(response)
    
    except Exception as e:
        print(f"\n❌ Error processing request: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
    
    finally:
        # Clean up temp file
        try:
            Path(tmp_path).unlink()
        except:
            pass


def generate_explanation(pred_label, asd_prob, severity, patient_age=None, symptoms=""):
    """
    Generate plain-language explanation of prediction
    """
    
    result_text = "ASD" if pred_label == 1 else "Control (Typically Developing)"
    severity_text = {"low": "MILD", "medium": "MODERATE", "high": "HIGH"}[severity]
    
    explanation = f"""
Based on the fMRI connectivity analysis using the SSAE (Stacked Sparse AutoEncoder) model:

**PREDICTION**: {result_text}
**CONFIDENCE**: {asd_prob*100:.1f}%
**SEVERITY LEVEL**: {severity_text}

This analysis examined functional connectivity patterns across 110 brain regions. 
The model identified {'characteristic patterns consistent with ASD diagnosis' if pred_label == 1 else 'connectivity patterns within typical developmental range'}.

Note: This is a computer-aided analysis tool. Clinical diagnosis requires evaluation by a qualified healthcare professional.
    """.strip()
    
    return explanation


def generate_report_html(filepath, patient_id, patient_name, patient_age, pred_label, asd_prob, severity, explanation, symptoms=""):
    """
    Generate and save HTML report for screening result
    """
    from datetime import datetime
    
    result_text = "ASD" if pred_label == 1 else "Control (Typically Developing)"
    severity_text = {"low": "MILD", "medium": "MODERATE", "high": "HIGH"}[severity]
    severity_color = {"low": "#22c55e", "medium": "#f59e0b", "high": "#ef4444"}[severity]
    confidence_pct = asd_prob * 100
    
    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ASD Screening Report - {patient_name}</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #334155; line-height: 1.6; padding: 2rem; }}
        .container {{ max-width: 800px; margin: 0 auto; background: white; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); overflow: hidden; }}
        .header {{ background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); color: white; padding: 2rem; text-align: center; }}
        .header h1 {{ font-size: 1.75rem; margin-bottom: 0.5rem; }}
        .header p {{ opacity: 0.9; }}
        .content {{ padding: 2rem; }}
        .section {{ margin-bottom: 2rem; }}
        .section-title {{ font-size: 1rem; font-weight: 600; color: #64748b; margin-bottom: 1rem; text-transform: uppercase; letter-spacing: 0.05em; }}
        .patient-info {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; }}
        .info-card {{ background: #f1f5f9; padding: 1rem; border-radius: 8px; }}
        .info-label {{ font-size: 0.75rem; color: #64748b; margin-bottom: 0.25rem; }}
        .info-value {{ font-size: 1.125rem; font-weight: 600; color: #1e293b; }}
        .result-card {{ background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 12px; padding: 1.5rem; text-align: center; }}
        .result-label {{ font-size: 0.875rem; color: #64748b; margin-bottom: 0.5rem; }}
        .result-value {{ font-size: 2rem; font-weight: 700; color: #1e293b; }}
        .severity-badge {{ display: inline-block; background: {severity_color}; color: white; padding: 0.5rem 1rem; border-radius: 9999px; font-weight: 600; font-size: 0.875rem; margin-top: 0.5rem; }}
        .confidence-bar {{ background: #e2e8f0; border-radius: 9999px; height: 12px; margin-top: 1rem; overflow: hidden; }}
        .confidence-fill {{ background: linear-gradient(90deg, #0ea5e9, #06b6d4); height: 100%; border-radius: 9999px; transition: width 0.3s; width: {confidence_pct}%; }}
        .explanation {{ background: #f1f5f9; padding: 1.5rem; border-radius: 8px; white-space: pre-line; }}
        .footer {{ background: #f8fafc; padding: 1.5rem 2rem; border-top: 1px solid #e2e8f0; text-align: center; font-size: 0.75rem; color: #94a3b8; }}
        .disclaimer {{ background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 1rem; margin-top: 1.5rem; font-size: 0.875rem; color: #92400e; }}
        @media print {{ body {{ padding: 0; }} .container {{ box-shadow: none; }} }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>ASD Screening Report</h1>
            <p>dr.THYNK - AI-Assisted Screening System</p>
        </div>
        <div class="content">
            <div class="section">
                <div class="section-title">Patient Information</div>
                <div class="patient-info">
                    <div class="info-card">
                        <div class="info-label">Patient ID</div>
                        <div class="info-value">{patient_id}</div>
                    </div>
                    <div class="info-card">
                        <div class="info-label">Name</div>
                        <div class="info-value">{patient_name}</div>
                    </div>
                    <div class="info-card">
                        <div class="info-label">Age</div>
                        <div class="info-value">{patient_age if patient_age else 'N/A'}</div>
                    </div>
                    <div class="info-card">
                        <div class="info-label">Report Date</div>
                        <div class="info-value">{datetime.now().strftime('%Y-%m-%d %H:%M')}</div>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">Screening Result</div>
                <div class="result-card">
                    <div class="result-label">Predicted Classification</div>
                    <div class="result-value">{result_text}</div>
                    <div class="severity-badge">{severity_text}</div>
                    <div style="margin-top: 1.5rem;">
                        <div class="result-label">Confidence: {confidence_pct:.1f}%</div>
                        <div class="confidence-bar">
                            <div class="confidence-fill"></div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">Analysis Summary</div>
                <div class="explanation">{explanation}</div>
            </div>
            
            {f'<div class="section"><div class="section-title">Behavioral Notes</div><div class="explanation">{symptoms}</div></div>' if symptoms else ''}
            
            <div class="disclaimer">
                <strong>Disclaimer:</strong> This report is generated by an AI-assisted screening tool and is intended for research and preliminary screening purposes only. It does not constitute a medical diagnosis. Please consult a qualified healthcare professional for clinical evaluation and diagnosis.
            </div>
        </div>
        <div class="footer">
            Generated by dr.THYNK ASD Screening System | Model: SSAE + SVM | Report ID: {patient_id}
        </div>
    </div>
</body>
</html>"""
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(html_content)
    
    print(f"  ✓ Report saved: {filepath}")


@app.get("/download_report/{filename}")
async def download_report(filename: str):
    """Download report as attachment"""
    filepath = REPORTS_DIR / filename
    if not filepath.exists():
        raise HTTPException(status_code=404, detail="Report not found")
    return FileResponse(
        path=str(filepath),
        filename=filename,
        media_type="text/html",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@app.on_event("startup")
async def startup_event():
    """Log startup message"""
    print("\n" + "="*70)
    print("✅ ASD Detection Backend Started")
    print("="*70)
    print("Listening on: http://127.0.0.1:8000")
    print("API Documentation: http://127.0.0.1:8000/docs")
    print("="*70 + "\n")


@app.on_event("shutdown")
async def shutdown_event():
    """Log shutdown message"""
    print("\n✋ Server shutting down...")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="127.0.0.1",
        port=8000,
        log_level="info"
    )
