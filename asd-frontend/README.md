# dr.THYNK – ASD Screening & Consultation Platform

Frontend for AI-assisted autism spectrum disorder (ASD) screening using fMRI data and retrieval-augmented clinician chat.

## Setup

1. Copy the environment template and set the backend API URL:
```bash
cp .env.example .env
# edit .env if backend runs on a different host/port
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The app will open at `http://localhost:3000`

## Features

### Patient Management
- Create patient profiles with demographics and behavioral notes
- Activate a patient to run screening through the "Detection Lab" 
- Local + backend sync for persistent patient data

### Detection Lab
- Upload 4D fMRI files (.nii, .nii.gz)
- Run SSAE-based ASD screening: returns prediction, confidence, severity, and report
- View generated HTML report and connectivity heatmaps
- Persist results to patient history

### Convo with Doctor (NEW)
- Live RAG-powered assistant acting as a pediatric neurologist
- Ask clinical questions about the patient's screening
- Assistant cites evidence from patient data, CSVs, and past reports
- Persistent chat history per patient
- Requires backend `GROQ_API_KEY` to enable chat

### System Architecture
- **Frontend**: React + Tailwind CSS, client-side + backend sync
- **Backend**: FastAPI with SSAE/SVM models, SQLite patient registry, Groq-powered chat
- **RAG**: TF-IDF + cosine similarity over indexed patient summaries and reports
- **Storage**: Patient profiles and chat stored in backend database; frontend caches locally

## Environment

Create `.env` in the project root:
```
REACT_APP_API_BASE=http://127.0.0.1:8000
```

## Development

### `npm start`
Runs dev server with hot-reload. Opens `http://localhost:3000`.

### `npm run build`
Builds optimized production bundle to `build/` folder.

### `npm test`
Runs test suite (if configured).

## Notes

- Patient data syncs bidirectionally: frontend pulls from backend on load; new screenings are posted back
- Chat requires the backend to have `GROQ_API_KEY` configured; if missing, chat is disabled gracefully
- All patient data is considered sensitive; ensure proper auth/HTTPS in production

