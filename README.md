# 🧠 BeWell — Mental Health Support Platform

> **AI-powered mental health support platform** built for the AWS Hackathon.  
> Empathetic conversations powered by Amazon Nova Lite via AWS Bedrock.

---

## 🏗️ Architecture

```
src/
├── main.py                    # FastAPI application entry point
├── config/
│   ├── settings.py            # Environment & app configuration
│   └── database.py            # SQLAlchemy database setup
├── api/
│   ├── dependencies.py        # Auth middleware (JWT verification)
│   └── common/
│       ├── auth.py            # Auth endpoints (signup, login)
│       └── chat.py            # Chat endpoints (patient-facing)
├── services/
│   ├── ai_service.py          # AWS Bedrock / Nova Lite integration
│   ├── auth_service.py        # Authentication business logic
│   └── chat_service.py        # Chat business logic
├── models/
│   ├── user.py                # User model (Snowflake IDs)
│   └── conversation.py        # Conversation & Message models
└── utils/
    ├── auth.py                # JWT & password hashing utilities
    └── snowflake.py           # Snowflake ID generator
```

### Design Patterns
- **Service Layer** — Business logic separated from API routes
- **Dependency Injection** — FastAPI `Depends()` for auth & DB
- **Singleton** — AI Service & Settings instantiated once
- **Sliding Window** — Last 10 messages + auto-summarization for context

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- AWS Account with Bedrock access (Nova Lite model enabled)
- PostgreSQL (or SQLite for development)

### Setup

```bash
# 1. Clone & enter project
git clone <repo-url>
cd bewell

# 2. Create virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure environment
copy .env.example .env       # Windows
# cp .env.example .env       # macOS/Linux

# 5. Create database tables
cd src
python create_tables.py

# 6. Run server
python main.py
```

Server starts at `http://localhost:8000`

### Environment Variables

Create a `.env` file in the project root:

```env
# AWS Bedrock
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1

# Database
DATABASE_URL=sqlite:///./bewell.db

# JWT Authentication
JWT_SECRET=your-super-secret-key-change-in-production

# Snowflake ID Generator
WORKER_ID=1

# Environment
ENVIRONMENT=development
```

---

## 📡 API Endpoints

### Auth (`/api/v1/auth`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/local/signup` | Register new patient |
| `POST` | `/auth/local/login` | Login & get JWT token |
| `GET` | `/auth/me` | Get current user info |

### Patient Chat (`/api/v1/patient/chat`)

> 🔒 All endpoints require `Authorization: Bearer <token>` header

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/patient/chat/start` | Start new conversation |
| `POST` | `/patient/chat/{id}/message` | Send message to AI |
| `GET` | `/patient/chat/{id}/history` | Get conversation history |
| `GET` | `/patient/chat/conversations` | List all conversations |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Service status |
| `GET` | `/api/v1/health` | Health check |

### API Docs

- **Swagger UI**: `http://localhost:8000/api/v1/docs`
- **ReDoc**: `http://localhost:8000/api/v1/redoc`

---

## 🤖 AI Features

| Feature | Implementation |
|---------|---------------|
| **Model** | Amazon Nova Lite (`amazon.nova-lite-v1:0`) via AWS Bedrock |
| **Context Window** | Sliding window — last 10 messages per conversation |
| **Auto-Summarization** | Every 10 messages, AI generates a summary to extend context |
| **Emotion Detection** | Keyword-based analysis (stress, anxiety, sadness, anger) |
| **Crisis Detection** | Flags suicidal ideation / self-harm keywords for escalation |
| **Fallback** | Predefined empathetic responses when AI is unavailable |

---

## 🗄️ Database Schema

| Table | Key Columns | Notes |
|-------|-------------|-------|
| `users` | `id` (BigInt/Snowflake), `email`, `password_hash`, `role` | Supports patient & professional roles |
| `conversations` | `id`, `patient_id` (FK→users), `summary`, `status` | Auto-summarized by AI |
| `messages` | `id`, `conversation_id` (FK→conversations), `content`, `emotion_score` (JSON) | Indexed FKs for performance |

---

## 🔐 Security

- **Password Hashing**: bcrypt via passlib
- **JWT Tokens**: HS256, 24-hour expiration
- **Role-Based Access**: `require_patient` / `require_professional` middleware
- **Input Validation**: Pydantic models on all endpoints
- **CORS**: Configurable origins (restrict in production)

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | FastAPI |
| **Database** | SQLAlchemy 2.0 (SQLite dev / PostgreSQL prod) |
| **AI** | AWS Bedrock — Amazon Nova Lite |
| **Auth** | PyJWT + bcrypt |
| **Server** | Uvicorn (ASGI) |
| **IDs** | Snowflake (distributed-safe) |

---

## 📝 License

Built for the **AWS Hackathon 2026**. All rights reserved.
