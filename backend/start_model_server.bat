@echo off
echo.
echo =============================================
echo   BeWell - Model Server (Whisper @ port 6000)
echo =============================================
echo.
echo  This keeps the Whisper model in memory.
echo  Leave this window open. Backend can restart
echo  freely without reloading the model.
echo.

cd /d "%~dp0"

:: Activate venv if it exists
if exist "..\venv\Scripts\activate.bat" (
    call ..\venv\Scripts\activate.bat
) else if exist "..\..\venv\Scripts\activate.bat" (
    call ..\..\venv\Scripts\activate.bat
)

echo Starting model server...
python model_server\server.py

pause
