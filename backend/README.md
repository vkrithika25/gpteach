# GpTeach Backend

GpTeach is a guidance-first teaching assistant backend for upper-level CS coursework. It accepts project specifications and student questions, then uses OpenAI to generate instructional responses that help students understand their assignments without giving away solutions.

## Stack

- **FastAPI** — web framework
- **SQLAlchemy** + **SQLite** — persistence
- **Pydantic** — request/response validation
- **OpenAI Python SDK** — AI responses

## Setup

### 1. Create a virtual environment

```bash
python -m venv venv
source venv/bin/activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Create `.env`

```bash
cp .env.example .env
```

Edit `.env` and add your OpenAI API key:

```
OPENAI_API_KEY=sk-...
```

### 4. Run the backend

```bash
uvicorn app.main:app --reload --port 8000
```

The API is available at `http://localhost:8000`. OpenAPI docs are at `http://localhost:8000/docs`.

### 5. Run tests

```bash
pytest
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/health` | Health check |
| `POST` | `/api/v1/sessions` | Create a tutoring session |
| `GET` | `/api/v1/sessions/{id}` | Get session metadata |
| `PATCH` | `/api/v1/sessions/{id}` | Update session title/status |
| `POST` | `/api/v1/teach/respond` | Send a student question, get guided response |

## Teaching Philosophy

GpTeach behaves like a thoughtful instructor:

- Diagnoses the student's understanding before giving help
- Asks targeted follow-up questions
- Breaks problems into smaller conceptual pieces
- Prefers hints, decomposition, and scaffolding over direct answers
- Avoids giving full solutions or large code blocks
- Helps with spec interpretation, milestone planning, and test strategy

The backend does **not** store full chat transcripts. The frontend sends recent context as needed, and the backend stores only session metadata and the project specification.
