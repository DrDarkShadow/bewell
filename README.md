# 🧠 BeWell — Mental Health Support Platform

> **AI-powered mental health support platform** built for the AWS Hackathon.
> Empathetic conversations powered by **Amazon Nova Lite** via **AWS Bedrock**.
> Scalable data layer powered by **Supabase (PostgreSQL)**.

---

## 🏗️ Architecture

```
src/
├── main.py                    # FastAPI application entry point
├── config/
│   ├── settings.py            # Environment & app configuration
│   └── database.py            # SQLAlchemy setup (with Supabase Pooling support)
├── api/
│   ├── dependencies.py        # Auth middleware (JWT verification)
│   └── common/
│       ├── auth.py            # Auth endpoints (signup, login)
│       └── chat.py            # Chat endpoints (optimized for threading)
├── services/
│   ├── ai_service.py          # AWS Bedrock / Nova Lite integration
│   ├── auth_service.py        # Authentication business logic
│   └── chat_service.py        # Chat business logic
├── models/
│   ├── user.py                # User model (Snowflake IDs)
│   └── conversation.py        # Conversation & Message models
├── utils/
│   ├── auth.py                # JWT & password hashing utilities
│   └── snowflake.py           # Snowflake ID generator
└── scripts/
    └── test_bedrock.py        # Script to verify AI connection
```

### Key Design Decisions
- **Hybrid Database**: Uses **Supabase (PostgreSQL)** for structured data, configured with `NullPool` to work perfectly with Supabase's Transaction Pooler (eliminates double-pooling issues).
- **Optimized Concurrency**: API endpoints use standard threading (`def`) instead of `async def` to prevent blocking on synchronous database calls, ensuring high throughput.
- **Service Layer Pattern**: Business logic is completely separated from API routes.
- **Snowflake IDs**: Distributed, unique ID generation for infinite scalability.

### Design Patterns (Original)
- **Dependency Injection**: FastAPI `Depends()` for auth & DB injection.
- **Singleton**: AI Service & Settings instantiated once.
- **Sliding Window**: Context management (last 10 messages) + auto-summarization.

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- AWS Account with Bedrock access (**Amazon Nova Lite** model enabled)
- Supabase Project (PostgreSQL)

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

# 5. Create database tables (Migrate to Cloud)
python src/create_tables.py

# 6. Run server
uvicorn src.main:app --reload
```

Server starts at `http://localhost:8000`

### Environment Variables (`.env`)

```env
# AWS Bedrock (Required for AI features)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
# Default region for Bedrock
AWS_REGION=us-east-1

# Database (Supabase Transaction Pooler - IPv4)
# IMPORTANT: URL-encode special characters in password (e.g., @ -> %40)
DATABASE_URL="postgresql://postgres.user:password@aws-0-region.pooler.supabase.com:6543/postgres"

# JWT Authentication
JWT_SECRET=your-super-secret-key-change-in-production

# Snowflake ID Generator (Unique Worker ID)
WORKER_ID=1

# Environment (development/production)
ENVIRONMENT=development
```

---

## 🧪 Running Tests

We have specific scripts to verify core components:

| Component | Command | Description |
|-----------|---------|-------------|
| **AI (Bedrock)** | `python scripts/test_bedrock.py` | Sends a prompt to Amazon Nova Lite to verify credentials and payload format. |
| **Logic & Crisis** | `python src/test_ai.py` | Tests crisis detection logic and AI response handling without a server. |

---

## 📡 API Endpoints

### Auth (`/api/v1/auth`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/auth/local/signup` | Register new patient |
| `POST` | `/api/v1/auth/local/login` | Login & get JWT token |
| `GET` | `/api/v1/auth/me` | Get current user info |

### Patient Chat (`/api/v1/patient/chat`)

> 🔒 All endpoints require `Authorization: Bearer <token>` header

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/patient/chat/start` | Start new conversation |
| `POST` | `/api/v1/patient/chat/{id}/message` | Send message to AI |
| `GET` | `/api/v1/patient/chat/{id}/history` | Get conversation history |
| `GET` | `/api/v1/patient/chat/conversations` | List all conversations |

### API Docs

- **Swagger UI**: `http://localhost:8000/api/v1/docs`
- **ReDoc**: `http://localhost:8000/api/v1/redoc`

---

## 🤖 AI Features

| Feature | Implementation |
|---------|---------------|
| **Model** | **Amazon Nova Lite** (`amazon.nova-lite-v1:0`) via AWS Bedrock |
| **Context Window** | Sliding window — last 10 messages per conversation. |
| **Auto-Summarization** | Every 10 messages, AI generates a summary to extend context logically. |
| **Emotion Detection** | Hybrid approach: Rule-based (fast) + ML-based intent analysis. |
| **Crisis Detection** | Real-time scanning for self-harm keywords with immediate escalation flags. |
| **Fallback** | Predefined empathetic responses when AI is unavailable. |

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
| **Framework** | FastAPI (Threaded Mode) |
| **Database** | **Supabase** (PostgreSQL) via SQLAlchemy 2.0 |
| **AI** | **AWS Bedrock** (Amazon Nova Lite) |
| **Auth** | PyJWT + bcrypt |
| **Server** | Uvicorn (ASGI) |
| **IDs** | Snowflake (distributed-safe) |

---

## 📝 License

Built for the **AWS Hackathon 2026**. All rights reserved.
