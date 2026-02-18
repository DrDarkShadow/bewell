# Healthcare Companion Bot

This project is a web-based companion bot for healthcare and wellness, featuring chat, stress tracking, breathing exercises, games, and affirmations.

## Features
- Chat with an AI companion
- Stress score and emotion analysis
- Breathing exercises
- Positive affirmations
- Simple games
- Chat history

## Project Structure
- `frontend/`: React + Vite frontend
- `backend/`: FastAPI backend
- `chat_history.json`: Stores chat sessions

## Setup Instructions

### Backend
1. Create and activate a Python virtual environment:
   ```powershell
   python -m venv .venv
   & .venv\Scripts\Activate.ps1
   ```
2. Install dependencies:
   ```powershell
   pip install -r backend/requirements.txt
   ```
3. Start the backend server:
   ```powershell
   uvicorn backend.main:app --host 0.0.0.0 --port 8001
   ```

### Frontend
1. Navigate to the frontend folder:
   ```powershell
   cd frontend
   ```
2. Install dependencies:
   ```powershell
   npm install
   ```
3. Start the frontend server:
   ```powershell
   npm run dev
   ```
4. Open your browser at [http://localhost:5173/](http://localhost:5173/)

## API Endpoints
- `POST /chat`: Send/receive chat messages
- `POST /stress`: Get stress score
- `GET /api/history`: Retrieve chat history
- `POST /api/history`: Save chat session

## How Chat History Works
- Each chat session is saved automatically after a conversation.
- History is displayed in the frontend under "Chat History".

## License
MIT License

## Authors
- Aanya Sharma

---
For any issues or feature requests, please contact the author or open an issue.
