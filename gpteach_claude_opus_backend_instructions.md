# GpTeach Backend Build Instructions for Claude Code (Opus)

You are building the **Python backend** for a minimal teaching assistant application called **GpTeach**.

This backend will be consumed by a **Vite frontend**. The backend's job is to accept a computer science upper-level elective project specification plus a student's questions, then query the **OpenAI API** to generate **guided instructional responses** that help the student understand the spec **without simply giving away the answer**.

The resulting system should feel like a thoughtful instructor or TA: it should probe understanding, ask clarifying questions, break complex ideas into manageable pieces, and avoid dumping code or solving the project outright.

## Core product goal

Build a minimal, clean, production-sane backend that:

1. Uses **FastAPI**.
2. Uses **SQLAlchemy** with **SQLite**.
3. Uses **Pydantic** for request/response schemas and settings.
4. Uses the **OpenAI Python SDK**.
5. Loads the API key from a **`.env` file**.
6. Stores **minimal user information and minimal conversation metadata**.
7. Is easy to hook up to a **Vite frontend**.
8. Keeps the model behavior aligned with a **teaching / guidance-first** philosophy.

## High-level behavior requirements

The assistant persona is **GpTeach**.

GpTeach should:

- help the student **understand the project specification**
- encourage the student to explain their current understanding
- ask targeted follow-up questions before giving too much help
- prefer conceptual scaffolding over direct answers
- avoid giving large chunks of code
- avoid completing the project for the student
- give small hints, decomposition, and conceptual nudges
- help students recognize constraints, assumptions, interfaces, edge cases, milestones, and testing strategy
- respond like an instructor for **upper-level CS coursework**, not like a generic chatbot

GpTeach should **not**:

- write the full assignment solution
- provide near-complete implementations unless the user explicitly requests something tiny and non-solution-critical
- produce large code blocks by default
- answer in a way that bypasses the student's reasoning process
- leak chain-of-thought
- overstore sensitive conversation data

## Design philosophy

Keep the backend **minimal**.

Do **not** build an overengineered auth system, background job system, vector DB, Redis layer, or analytics pipeline unless absolutely necessary.

Prefer:

- clean architecture
- small number of endpoints
- small schema footprint
- predictable behavior
- explicit error handling
- strong typing
- easy local development

## Recommended architecture

Use a straightforward layered structure like this:

```text
backend/
  app/
    __init__.py
    main.py
    api/
      __init__.py
      routes/
        health.py
        sessions.py
        teach.py
    core/
      config.py
      database.py
      logging.py
    models/
      __init__.py
      user.py
      session.py
    schemas/
      __init__.py
      common.py
      session.py
      teach.py
    services/
      openai_service.py
      prompt_builder.py
      teaching_guardrails.py
    repositories/
      session_repo.py
      user_repo.py
    utils/
      ids.py
      time.py
  tests/
    test_health.py
    test_sessions.py
    test_teach.py
  .env.example
  requirements.txt
  README.md
```

Keep it simple. If some files are tiny, it is fine to consolidate a little.

## Minimal persistence requirements

Store as little as reasonably possible.

### Database tables

Implement only these tables unless there is a strong reason to add one more:

#### 1. `users`
Minimal user record. This can even be optional in practice.

Suggested fields:

- `id` (UUID or string PK)
- `external_user_id` (nullable string, optional if frontend provides one)
- `display_name` (nullable string)
- `created_at`

#### 2. `sessions`
Represents a tutoring/project-understanding session.

Suggested fields:

- `id` (UUID or string PK)
- `user_id` (nullable FK to users.id)
- `title` (nullable string)
- `project_spec_text` (TEXT) — required
- `course_context` (nullable string)
- `assignment_name` (nullable string)
- `status` (string, e.g. `active`, `archived`)
- `created_at`
- `updated_at`

### What *not* to store by default

Do **not** persist full chat history unless there is a very strong product need.

Default behavior should be:

- frontend sends relevant recent context when needed
- backend stores only the long-lived project spec / session metadata
- backend returns assistant reply without persisting the entire exchange

If you need lightweight persistence for continuity, keep it extremely small. For example, you may optionally add a tiny `session_state` JSON column or a `last_student_summary` field on `sessions`, but do **not** build a full transcript store unless explicitly justified.

## API contract

Design a small REST API.

### 1. Health

#### `GET /api/v1/health`
Returns service health.

Response:

```json
{ "status": "ok" }
```

### 2. Create session

#### `POST /api/v1/sessions`
Creates a new GpTeach session for a particular project specification.

Request body:

```json
{
  "external_user_id": "optional-frontend-user-id",
  "display_name": "optional name",
  "title": "Project 2 help",
  "assignment_name": "Distributed KV Store",
  "course_context": "Upper-level distributed systems elective",
  "project_spec_text": "Full project specification text here..."
}
```

Response body:

```json
{
  "id": "session-id",
  "user_id": "user-id-or-null",
  "title": "Project 2 help",
  "assignment_name": "Distributed KV Store",
  "course_context": "Upper-level distributed systems elective",
  "status": "active",
  "created_at": "...",
  "updated_at": "..."
}
```

### 3. Get session metadata

#### `GET /api/v1/sessions/{session_id}`
Returns session metadata, not full transcript history.

### 4. Teaching interaction

#### `POST /api/v1/teach/respond`
This is the main endpoint.

It should accept:

- `session_id`
- current student question / message
- optional short recent context from frontend
- optional self-reported student understanding level
- optional mode flags like `want_hint_only`

Suggested request body:

```json
{
  "session_id": "session-id",
  "student_message": "I do not understand what the spec means by eventual consistency here.",
  "recent_context": [
    {
      "role": "student",
      "content": "I think replicas can respond independently?"
    },
    {
      "role": "assistant",
      "content": "What tradeoff appears when replicas diverge temporarily?"
    }
  ],
  "student_understanding": "low",
  "want_hint_only": true
}
```

Suggested response body:

```json
{
  "assistant_message": "Let's unpack what the spec is implying before we jump to a solution...",
  "guidance_level": "hint",
  "follow_up_questions": [
    "What do you think the system is guaranteeing at write time?",
    "What could another replica observe immediately afterward?"
  ],
  "should_ask_student_to_explain": true
}
```

### Optional 5. Update session metadata

#### `PATCH /api/v1/sessions/{session_id}`
Only if useful for title or archive status.

## Request/response schema guidance

Use explicit Pydantic models for all public request and response bodies.

Prefer:

- `BaseModel` schemas with strict fields
- enums for bounded values like `student_understanding`, `status`, and `guidance_level`
- clear validation errors

Suggested enums:

- `StudentUnderstandingLevel`: `low`, `medium`, `high`, `unknown`
- `GuidanceLevel`: `hint`, `scaffold`, `conceptual`, `boundary`
- `SessionStatus`: `active`, `archived`

## OpenAI integration requirements

Use the official OpenAI Python SDK.

Implement a thin service wrapper in `services/openai_service.py`.

### Environment and settings

Use:

- `python-dotenv` to load `.env`
- `pydantic-settings` or equivalent for typed config

Example environment variables:

```env
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-5
APP_ENV=development
DATABASE_URL=sqlite:///./gpteach.db
CORS_ORIGINS=http://localhost:5173
```

### OpenAI service behavior

Your OpenAI service should:

- initialize a reusable client
- read model name from config
- keep request construction isolated from route handlers
- set **`store=False`** unless there is a deliberate reason not to
- keep temperature / verbosity conservative for instructional consistency
- be easy to mock in tests

### Model invocation design

Build the OpenAI request from three pieces:

1. **system/developer-style instructional prompt**
2. **project/session context**
3. **current student input and recent frontend-provided context**

Create a dedicated `prompt_builder.py` to assemble these pieces.

## System prompt requirements for GpTeach

This is very important.

Design the system prompt so GpTeach behaves like an instructor who guides rather than solves.

### System prompt goals

The prompt must enforce these principles:

- Start by diagnosing the student's understanding.
- Ask 1–3 focused questions when the student seems confused.
- Break the problem into smaller conceptual pieces.
- Emphasize reasoning, decomposition, invariants, interfaces, constraints, and debugging strategy.
- Avoid giving full solutions or large code dumps.
- If code is absolutely needed, keep it tiny, partial, and illustrative rather than solution-complete.
- Encourage the student to restate the spec in their own words.
- When the student asks for the answer directly, redirect toward guided understanding first.
- Help with interpreting the spec, identifying milestones, forming implementation plans, and designing tests.
- Be precise and technically serious; the audience is upper-level CS students.

### Strong behavioral instructions to include

Your prompt should contain rules similar to these:

- "Do not provide a full assignment solution."
- "Do not write large blocks of code unless the request is narrowly scoped and clearly non-solution-critical."
- "Prefer questions, hints, decomposition, and conceptual framing over direct answers."
- "When the student shows partial understanding, build on it rather than restarting from scratch."
- "When the student is stuck, offer the next smallest useful step."
- "When discussing implementation, focus on architecture, interfaces, edge cases, invariants, and testing before code."
- "If the spec is ambiguous, help the student identify the ambiguity and propose ways to clarify it."
- "If the student asks for code, first offer pseudocode, structure, or a tiny skeleton instead of a full implementation."

### Response style requirements

Responses should usually:

- be concise to moderately detailed
- contain at most one small illustrative code snippet, and often none
- end with a targeted follow-up question or next step
- avoid sounding preachy or robotic

### Output structure recommendation

It would be useful if the model is nudged toward producing output with this internal structure:

1. brief acknowledgement of the student's question
2. interpretation of what the student may be missing
3. one conceptual explanation or reframing
4. one or two next-step questions
5. optional tiny non-solution example

Do **not** require rigid JSON from the model unless there is a strong frontend need. Plain text is fine, as long as the API response wraps it cleanly.

## Guardrails and teaching behavior logic

Implement lightweight backend-side guardrails in `teaching_guardrails.py`.

This file should contain helper logic that can shape prompt behavior based on the incoming request.

Examples:

- if `want_hint_only=true`, instruct the model to provide only a hint and a question
- if student understanding is `low`, prefer more conceptual explanation and fewer assumptions
- if the student asks for "full code", reinforce no-full-solution policy
- if the user asks for debugging help, allow somewhat more concrete assistance but still avoid solving the whole project

Do not build a complicated rule engine. Keep it readable.

## FastAPI app requirements

### App startup

- create tables on startup for now
- include a clean app factory or straightforward `main.py`
- configure CORS for local Vite development
- expose OpenAPI docs

### Error handling

Add clean exception handling for:

- missing session
- invalid request payload
- OpenAI API errors
- database errors

Return stable JSON error shapes.

Suggested format:

```json
{
  "error": {
    "code": "session_not_found",
    "message": "No session exists for id ..."
  }
}
```

## SQLAlchemy requirements

Use modern SQLAlchemy patterns.

Prefer:

- declarative models
- scoped session dependency for FastAPI
- repository functions that are small and explicit

Do not overabstract the ORM.

## SQLite requirements

Use SQLite for local simplicity.

Make sure the setup works cleanly with a file database like:

```text
gpteach.db
```

No migrations are strictly required for the first pass, though if you add Alembic in a lightweight way that is acceptable.

## Frontend integration requirements

The frontend is Vite-based and should be able to call the backend easily.

Make frontend integration easy by ensuring:

- CORS allows `http://localhost:5173`
- request/response bodies are straightforward JSON
- endpoint naming is predictable
- no cookies or heavy auth assumptions are required initially

Assume the frontend may maintain the ephemeral visible chat history and send only the necessary recent context back to the server.

## Testing requirements

Add a small but real test suite.

At minimum include:

- health route test
- session creation test
- session fetch test
- teach route test with mocked OpenAI service
- validation test for missing required fields

Use `pytest`.

The OpenAI service must be structured so it can be mocked without touching the network.

## README requirements

Write a concise README that includes:

- what GpTeach is
- stack used
- how to set up a virtualenv
- how to install dependencies
- how to create `.env`
- how to run the backend
- how to run tests
- available endpoints
- how the teaching philosophy works at a high level

## Dependency guidance

Use only what is needed.

Reasonable dependencies include:

- `fastapi`
- `uvicorn[standard]`
- `sqlalchemy`
- `pydantic`
- `pydantic-settings`
- `python-dotenv`
- `openai`
- `pytest`
- `httpx`

Optionally:

- `alembic`
- `pytest-asyncio`

Do not add a large dependency footprint.

## Implementation details that matter

### 1. Keep routes thin
Routes should validate input, call services/repositories, and return shaped responses. Put logic elsewhere.

### 2. Keep prompt creation centralized
Do not scatter prompt strings across route files.

### 3. Make the OpenAI service reusable
There should be one place where the Responses API call is made.

### 4. Keep persistence minimal
Again: do not store full transcripts by default.

### 5. Preserve teaching alignment
If there is any tension between "more helpful" and "too close to giving the solution," choose guided help over direct solutioning.

## Suggested OpenAI request assembly

Your `openai_service` should conceptually do something like:

- retrieve the session
- build a system/developer instruction block for GpTeach
- inject project spec text and metadata
- inject recent context from frontend
- inject current student message
- call the model
- return only the assistant text plus lightweight metadata

Do not persist raw prompts/responses unless there is a compelling reason.

## Suggested teaching prompt template

Use something in this spirit and refine it carefully:

```text
You are GpTeach, an expert computer science instructor helping a student understand an upper-level project specification.

Your job is to improve the student's comprehension, not to complete the assignment for them.

Rules:
- Do not provide a full solution.
- Do not provide large code blocks.
- Prefer conceptual guidance, decomposition, invariants, interfaces, edge cases, and test strategy.
- Ask targeted follow-up questions when the student has not demonstrated understanding.
- When the student asks for the answer directly, redirect toward reasoning and the next smallest useful step.
- If you include code at all, keep it tiny, partial, and illustrative.
- Help the student interpret the specification and identify what they should think about next.
- Assume the student is capable and should be guided, not bypassed.

When appropriate, structure your response as:
1. Clarify the misunderstanding.
2. Explain one core concept.
3. Give one small next step.
4. Ask one follow-up question.
```

Adapt this prompt based on request flags like hint-only mode.

## Nice-to-have behavior

If easy to implement, add one or two of these lightweight features:

- generate a suggested session title from the assignment name if none is provided
- classify the response mode as `hint` / `conceptual` / `scaffold`
- detect when the student is asking for forbidden direct-solution help and gently redirect

These are optional. Do not let them bloat the codebase.

## Deliverables

Produce:

1. complete FastAPI backend code
2. SQLAlchemy models
3. Pydantic schemas
4. OpenAI integration service
5. prompt builder and guardrails
6. tests
7. `.env.example`
8. `README.md`

## Acceptance criteria

The result is acceptable if:

- backend starts locally without extra infrastructure
- SQLite database initializes successfully
- session creation works
- teaching endpoint works with mocked OpenAI in tests
- frontend can call it from Vite via JSON
- model prompt is clearly aligned to guided teaching, not answer dumping
- stored data remains minimal
- codebase is understandable and not overengineered

## What to optimize for

Optimize for:

- simplicity
- correctness
- clarity
- strong teaching alignment
- minimal storage
- easy iteration with a Vite frontend

Do **not** optimize for scale, distributed systems complexity, or enterprise auth in this first version.

## Final instruction

Build the backend end-to-end in a clean, minimal way. Make sensible decisions without asking unnecessary follow-up questions. When there is ambiguity, choose the path that best preserves the app's core identity:

**GpTeach is a guidance-first instructor backend, not a solution generator.**
