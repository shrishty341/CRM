# Pharma CRM - HCP Interaction Module

An AI-powered Healthcare CRM module for pharmaceutical field representatives to log interactions with Healthcare Professionals (Doctors).

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + TS)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│  │ Dashboard │  │ AI Chat  │  │  Form    │  │  History   │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────────┘  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Redux Toolkit Store                      │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐           │   │
│  │  │ Chat     │  │Interact. │  │  HCP     │           │   │
│  │  │ Slice    │  │ Slice    │  │  Slice   │           │   │
│  │  └──────────┘  └──────────┘  └──────────┘           │   │
│  └──────────────────────────────────────────────────────┘   │
│              │ Axios HTTP Client                            │
└──────────────┼──────────────────────────────────────────────┘
               │ REST API (JSON)
┌──────────────┼──────────────────────────────────────────────┐
│  Backend (FastAPI + Python)                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              API Routes (/api/v1)                     │   │
│  │  ┌──────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐  │   │
│  │  │ Chat │  │Interact. │  │  HCP     │  │ Health  │  │   │
│  │  └──────┘  └──────────┘  └──────────┘  └─────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Service Layer (Repository Pattern)       │   │
│  │  ┌──────────────────┐  ┌──────────────────────────┐  │   │
│  │  │   HCPService     │  │   InteractionService     │  │   │
│  │  └──────────────────┘  └──────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           LangGraph AI Workflow                       │   │
│  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────────┐  │   │
│  │  │Valid.│ │Ctx   │ │Prompt│ │Groq  │ │Validate  │  │   │
│  │  │Input │ │Build │ │Build │ │LLM   │ │Extract   │  │   │
│  │  └──────┘ └──────┘ └──────┘ └──────┘ └──────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           SQLAlchemy ORM + PostgreSQL                 │   │
│  │  ┌──────────┐  ┌──────────┐                          │   │
│  │  │   HCP    │  │Interact. │                          │   │
│  │  │  Table   │  │  Table   │                          │   │
│  │  └──────────┘  └──────────┘                          │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## ✨ Features

### Core Features
- **AI Chat Assistant**: Describe interactions naturally, AI extracts structured data using LangGraph + Groq LLM
- **Manual Form**: Traditional form-based interaction logging
- **Two-Panel Layout**: Chat on left, form on right (when AI populates data)
- **Auto-Fill**: AI automatically populates form fields from natural language
- **Editable AI Output**: Review and edit AI-extracted data before saving
- **Form Validation**: React Hook Form with validation rules
- **Doctor Search**: Search and autocomplete for existing doctors
- **Interaction History**: Paginated table with expandable details
- **JSON Export**: Export interactions as JSON
- **Toast Notifications**: Success/error feedback via react-toastify

### AI Features
- **LangGraph Workflow**: Stateful graph-based AI pipeline
- **Groq LLM Integration**: Powered by gemma2-9b-it (or llama-3.3-70b-versatile)
- **Smart Extraction**: Extracts doctor name, hospital, specialization, products, samples, sentiment, outcome, follow-up dates
- **Confidence Scoring**: AI provides confidence score for extracted data
- **Retry Logic**: Automatic retry on extraction failure
- **Date Normalization**: Handles relative dates (today, yesterday, next Monday)

### UI/UX Features
- **Responsive Design**: Works on desktop and mobile
- **Material UI**: Professional, modern interface
- **Inter Font**: Clean typography
- **Dark/Light Mode Ready**: Theme infrastructure in place
- **Loading States**: Skeleton loaders and progress indicators
- **Error Handling**: Graceful error display with retry options
- **Suggested Prompts**: Quick-start templates for common scenarios

## 🛠 Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI Framework |
| TypeScript | Type Safety |
| Redux Toolkit | State Management |
| React Router v6 | Routing |
| Material UI v5 | Component Library |
| React Hook Form | Form Management |
| Axios | HTTP Client |
| Vite | Build Tool |
| react-toastify | Notifications |

### Backend
| Technology | Purpose |
|------------|---------|
| Python 3.11+ | Runtime |
| FastAPI | Web Framework |
| SQLAlchemy 2.0 | ORM |
| Pydantic v2 | Data Validation |
| PostgreSQL | Database |
| Alembic | Migrations |
| LangGraph | AI Workflow |
| LangChain | LLM Framework |
| Groq API | LLM Provider |

### AI/ML
| Component | Purpose |
|-----------|---------|
| LangGraph | State graph workflow |
| Groq gemma2-9b-it | Text extraction |
| LangChain | LLM orchestration |
| Custom Prompts | Domain-specific extraction |

## 📁 Project Structure

```
CRM(HCP)/
├── backend/
│   ├── alembic/              # Database migrations
│   │   ├── env.py
│   │   └── script.py.mako
│   ├── api/
│   │   └── routes.py         # FastAPI route handlers
│   ├── database/
│   │   └── config.py         # SQLAlchemy engine & session
│   ├── langgraph/
│   │   └── workflow.py       # LangGraph AI workflow
│   ├── models/
│   │   ├── hcp.py            # HCP database model
│   │   └── interaction.py    # Interaction database model
│   ├── prompts/
│   │   └── extraction_prompt.py  # LLM system prompts
│   ├── schemas/
│   │   ├── chat.py           # Chat request/response schemas
│   │   ├── hcp.py            # HCP Pydantic schemas
│   │   └── interaction.py    # Interaction Pydantic schemas
│   ├── services/
│   │   ├── hcp_service.py    # HCP business logic
│   │   └── interaction_service.py  # Interaction business logic
│   ├── .env                  # Environment variables
│   ├── alembic.ini           # Alembic configuration
│   ├── main.py               # FastAPI application entry
│   └── requirements.txt      # Python dependencies
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatPanel.tsx       # AI chat interface
│   │   │   ├── InteractionForm.tsx # Interaction form
│   │   │   └── Layout.tsx          # App layout with sidebar
│   │   ├── hooks/
│   │   │   └── useAppDispatch.ts   # Typed Redux hooks
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx       # Main dashboard
│   │   │   ├── History.tsx         # Interaction history
│   │   │   └── LogInteraction.tsx  # Log interaction page
│   │   ├── redux/
│   │   │   ├── chatSlice.ts        # Chat state management
│   │   │   ├── hcpSlice.ts         # HCP state management
│   │   │   ├── interactionSlice.ts # Interaction state management
│   │   │   └── store.ts            # Redux store configuration
│   │   ├── services/
│   │   │   └── api.ts              # Axios API service
│   │   ├── types/
│   │   │   └── index.ts            # TypeScript type definitions
│   │   ├── App.tsx                 # Root component
│   │   ├── main.tsx                # Entry point
│   │   ├── theme.ts                # MUI theme configuration
│   │   └── vite-env.d.ts           # Vite type declarations
│   ├── .env                        # Frontend environment
│   ├── index.html                  # HTML template
│   ├── package.json                # Node dependencies
│   ├── tsconfig.json               # TypeScript config
│   └── vite.config.ts              # Vite configuration
│
└── README.md
```

## 🚀 Setup Instructions

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 14+
- Groq API Key (free at console.groq.com)

### 1. Database Setup

```bash
# Create PostgreSQL database
psql -U postgres
CREATE DATABASE crm_hcp;
\q
```

### 2. Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
# Edit .env file with your Groq API key
# GROQ_API_KEY=gsk_your_key_here

# Run database migrations
alembic upgrade head

# Start the server
python main.py
# Server runs at http://localhost:8000
# API docs at http://localhost:8000/docs
```

### 3. Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
# App runs at http://localhost:3000
```

## 🔌 API Documentation

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/chat` | Process natural language via AI |
| POST | `/api/v1/interaction` | Save a new interaction |
| GET | `/api/v1/interaction/{id}` | Get interaction by ID |
| GET | `/api/v1/interaction/history` | Get paginated interaction history |
| GET | `/api/v1/hcp` | List/search HCPs |
| GET | `/api/v1/hcp/recent` | Get recent HCPs |
| GET | `/api/v1/hcp/{id}` | Get HCP by ID |
| GET | `/api/v1/hcp/{id}/interactions` | Get HCP's interactions |
| GET | `/api/v1/health` | Health check |

### Sample API Responses

#### POST /api/v1/chat
```json
{
  "success": true,
  "message": "Message processed successfully",
  "extracted_data": {
    "doctor_name": "Dr. Rajesh Sharma",
    "hospital": "Apollo Hospital",
    "specialization": "Cardiologist",
    "meeting_date": "2026-07-09",
    "products_discussed": ["CardioPlus"],
    "samples_given": 5,
    "sentiment": "interested",
    "outcome": "sample_requested",
    "follow_up_date": "2026-07-16",
    "summary": "Met with Dr. Rajesh Sharma at Apollo Hospital to discuss CardioPlus. He showed interest and requested 5 samples. Follow-up scheduled for next week.",
    "confidence_score": 0.92
  },
  "raw_response": "{...}",
  "conversation_id": "conv_1720512673.123456"
}
```

#### POST /api/v1/interaction
```json
{
  "success": true,
  "message": "Interaction saved successfully",
  "data": {
    "id": 1,
    "hcp_id": 1,
    "doctor_name": "Dr. Rajesh Sharma",
    "hospital": "Apollo Hospital",
    "specialization": "Cardiologist",
    "meeting_date": "2026-07-09T00:00:00",
    "interaction_type": "in_person",
    "products_discussed": ["CardioPlus"],
    "samples_given": 5,
    "outcome": "sample_requested",
    "follow_up_date": "2026-07-16T00:00:00",
    "notes": "Met with Dr. Rajesh Sharma at Apollo Hospital...",
    "ai_summary": "Met with Dr. Rajesh Sharma at Apollo Hospital...",
    "created_at": "2026-07-09T12:30:00"
  }
}
```

## 🧪 Testing

### Backend Testing
```bash
cd backend
pytest -v
```

### Manual Testing with curl
```bash
# Test health
curl http://localhost:8000/api/v1/health

# Test AI chat
curl -X POST http://localhost:8000/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Met with Dr. Sharma at Apollo today. Discussed CardioPlus. He was interested and took 3 samples."}'

# Test save interaction
curl -X POST http://localhost:8000/api/v1/interaction \
  -H "Content-Type: application/json" \
  -d '{
    "doctor_name": "Dr. Test",
    "hospital": "Test Hospital",
    "meeting_date": "2026-07-09T10:00:00",
    "products_discussed": ["CardioPlus"],
    "samples_given": 3,
    "outcome": "positive"
  }'
```

## 🔑 Environment Variables

### Backend (.env)
| Variable | Description | Default |
|----------|-------------|---------|
| DATABASE_URL | PostgreSQL connection string | postgresql://postgres:postgres@localhost:5432/crm_hcp |
| GROQ_API_KEY | Groq API key | (required) |
| GROQ_MODEL | LLM model | gemma2-9b-it |
| CORS_ORIGINS | Allowed CORS origins | http://localhost:3000,http://localhost:5173 |
| LOG_LEVEL | Logging level | INFO |
| DEBUG | Debug mode | false |

### Frontend (.env)
| Variable | Description | Default |
|----------|-------------|---------|
| VITE_API_BASE_URL | Backend API URL | /api/v1 |

## 🧠 LangGraph Workflow

The AI extraction uses a stateful LangGraph workflow:

```
START
  │
  ▼
Validate Input ──→ Invalid → END (with error)
  │ Valid
  ▼
Context Builder (analyzes message for doctor, hospital, dates, etc.)
  │
  ▼
Prompt Builder (constructs LLM prompt with system instructions)
  │
  ▼
Groq LLM Call (gemma2-9b-it with temperature=0.1)
  │
  ▼
JSON Extractor (parses LLM response, handles markdown)
  │
  ▼
Validation Node (normalizes dates, validates enums, ensures types)
  │
  ├── Success → END (return structured data)
  │
  └── Failure → Retry (up to 2 times) → END
```

## 📊 Database Schema

### HCP Table
```sql
CREATE TABLE hcp (
    id SERIAL PRIMARY KEY,
    doctor_name VARCHAR(255) NOT NULL,
    hospital VARCHAR(255) NOT NULL,
    specialization VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_hcp_doctor_name ON hcp(doctor_name);
```

### Interaction Table
```sql
CREATE TABLE interaction (
    id SERIAL PRIMARY KEY,
    hcp_id INTEGER REFERENCES hcp(id) ON DELETE CASCADE,
    meeting_date TIMESTAMP NOT NULL DEFAULT NOW(),
    interaction_type VARCHAR(50) DEFAULT 'in_person',
    products_discussed JSON DEFAULT '[]',
    samples_given INTEGER DEFAULT 0,
    outcome VARCHAR(50),
    follow_up_date TIMESTAMP,
    notes TEXT,
    ai_summary TEXT,
    ai_raw_response JSON,
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_interaction_hcp_id ON interaction(hcp_id);
```

## 🎯 Usage Flow

1. **Dashboard**: View quick stats, recent interactions, and recent doctors
2. **Log Interaction**: Choose between AI Chat or Manual Form mode
3. **AI Chat Mode**: 
   - Type naturally: "Met with Dr. Sharma at Apollo Hospital..."
   - AI extracts structured data using LangGraph + Groq
   - Form auto-populates with extracted data
   - Review and edit fields
   - Click Save
4. **Manual Form Mode**: Fill all fields directly
5. **History**: Browse, search, and export all interactions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📝 License

MIT License - see LICENSE file for details.

## 🙏 Acknowledgments

- LangGraph for stateful AI workflows
- Groq for high-performance LLM inference
- Material UI for the component library
- FastAPI for the async Python backend