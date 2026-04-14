# Medical Appointment Assistant (LangGraph)

A **Node.js** + **Fastify** API that exposes a conversational flow to **book** and **cancel** medical appointments. The core is a **LangGraph** workflow with nodes for intent detection, action execution, and reply generation. Models are reached through **OpenRouter**; graph state is validated with **Zod**.

Appointments and the clinical roster are stored in **SQLite** (`node:sqlite`) with an initial seed when the database is first created, so the service survives restarts—unlike a purely in-memory demo.

## Requirements

- Node.js **24+**
- An [OpenRouter](https://openrouter.ai/) API key

## Setup

```bash
cp .env.example .env
# Set OPENROUTER_API_KEY and optionally APPOINTMENTS_DB_PATH (default: data/clinic.sqlite)
```

## Usage

```bash
npm install
npm run dev
```

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Service status and uptime |
| `GET` | `/v1/clinicians` | Clinician list (SQLite seed) |
| `POST` | `/v1/assistant/message` | Body: `{ "text": "your message (min. 10 chars)" }`. Response: `{ ok, data }` with the final graph state |

Example:

```bash
curl -s http://localhost:3000/health
curl -s http://localhost:3000/v1/clinicians
curl -s -X POST -H "Content-Type: application/json" \
  -d '{"text":"I want to book with Dr. Renato Veiga tomorrow at 10am, I am Ana Costa, check-up."}' \
  http://localhost:3000/v1/assistant/message
```

## Graph architecture

```
START → identifyIntent → [schedule | cancel | message] → message → END
```

- **identifyIntent**: classifies intent and extracts fields (clinicians loaded from the database).
- **schedule** / **cancel**: apply rules via `AppointmentService` (SQLite).
- **message**: generates the user-facing reply with the LLM.

## Tests

E2E tests hit the real API and model; a valid `OPENROUTER_API_KEY` is required:

```bash
npm run test:e2e
```

## LangGraph CLI

```bash
npm run langgraph:serve
```

Requires `langgraph.json` and variables in `.env`.

## License

MIT
