@echo off
echo ====================================
echo ASD Backend Startup Script
echo ====================================
echo.

cd /d "%~dp0"

if not exist "venv\Scripts\activate" (
    echo Creating virtual environment...
    py -3.11 -m venv venv
    echo.
)

echo Activating virtual environment...
call venv\Scripts\activate
echo.

echo Installing/upgrading dependencies...
python -m pip install --upgrade pip setuptools wheel -q
python -m pip install -r requirements.txt -q
echo.

echo Copying scaler from final_ssae_training directory...
if exist "..\data\SSAE\NewAtlas\scaler.pkl" (
    copy /Y "..\data\SSAE\NewAtlas\scaler.pkl" "models\scaler.pkl"
) else (
    echo [WARNING] scaler.pkl not found, trying to extract from training notebook...
    python generate_scaler.py
)
echo.

echo Generating severity calibrator...
python generate_calibrator.py
echo.

echo Starting FastAPI server...
echo Access at: http://127.0.0.1:8001
echo API Docs: http://127.0.0.1:8001/docs
echo.
python main.py
