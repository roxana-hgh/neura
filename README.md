# Neura

A full-stack productivity application combining task management, notes, a focus timer, and an AI-powered assistant — built to demonstrate production-grade full-stack engineering across the entire stack, from database design to deployment.

**Live demo:** [https://neura-react.onrender.com](https://neura-react.onrender.com)

> Note: the backend is hosted on Render's free tier and spins down after periods of inactivity. The first request may take 30–60 seconds to respond while the server wakes up.

---

## Overview

Neura is a task and productivity manager that goes beyond a basic to-do list. It combines structured task management (lists, tasks, subtasks), free-form notes with rich text editing, a focus timer for deep work sessions, a calendar view, and a conversational AI assistant that can manage tasks on the user's behalf through natural language.

The project was built to be a complete, realistic full-stack application — with authentication, a relational database, a typed API, and a deployed production environment — rather than a scoped-down demo.

---

## Features

- **Task management** — task lists, tasks, and subtasks with completion tracking
- **Notes** — rich text notes powered by TipTap
- **Focus timer** — Pomodoro-style focus sessions with history tracking
- **Calendar view** — visualize tasks and deadlines over time
- **AI assistant** — a chat interface powered by Google Gemini that can list, create, update, and delete tasks through natural conversation, using function calling against the app's own data
- **Authentication** — secure email/password auth with session-based access control
- **Responsive design** — usable across desktop and mobile viewports

---

## Tech Stack

**Frontend**
| | |
|---|---|
| Framework | React + Vite |
| Language | TypeScript |
| Server state | TanStack Query |
| Client state | Zustand |
| UI components | shadcn/ui + Tailwind CSS |
| Rich text | TipTap |
| Routing | React Router |
| HTTP client | Axios |

**Backend**
| | |
|---|---|
| Runtime | Node.js + Express 5 |
| Language | TypeScript |
| ORM | Prisma 6 |
| Database | PostgreSQL (Neon, serverless) |
| Auth | Better Auth |
| AI | Google Gemini API (function calling) |

**Infrastructure**
| | |
|---|---|
| Backend hosting | Render (Web Service) |
| Frontend hosting | Render (Static Site) |
| Database hosting | Neon (serverless Postgres) |
| CI/CD | Auto-deploy from GitHub on push |

---

## Architecture

Neura is structured as a monorepo with two independently deployable applications sharing a single repository:

```
neura/
├── neura-api/          # Express + Prisma backend
│   ├── src/
│   │   ├── lib/         # Prisma client, Better Auth config
│   │   ├── routes/      # REST endpoints (tasks, notes, focus sessions, assistant)
│   │   └── index.ts     # App entry point
│   └── prisma/
│       └── schema.prisma
│
├── neura-web/           # React + Vite frontend
│   └── src/
│       ├── components/   # UI components (tasks, notes, chat, timer)
│       ├── hooks/        # React Query hooks per domain
│       ├── stores/        # Zustand stores (UI-only state)
│       └── lib/           # Axios instance, auth client
│
└── README.md
```

Each application deploys independently on Render, scoped to its own subdirectory, with auto-deploy triggered only by changes within that subdirectory.

### Data flow

- **Server state** (tasks, notes, sessions) is owned entirely by TanStack Query — no duplication into client state.
- **Client-only state** (filters, UI toggles) lives in Zustand.
- All Prisma mutations verify resource ownership (`userId`) before executing, preventing cross-user data access.

### AI Assistant

The assistant endpoint (`/api/assistant`) runs a Gemini function-calling loop with four tools — `list_tasks`, `create_task`, `update_task`, `delete_task` — each backed by the same ownership-checked Prisma queries used elsewhere in the API. The loop has a bounded number of tool-call rounds to prevent runaway execution.

---

## Key Engineering Decisions

A few problems solved along the way that reflect real production trade-offs:

- **Cross-site authentication** — the frontend and backend are deployed on separate Render subdomains, requiring `SameSite=None; Secure` cookies in production while keeping `SameSite=Lax` for local development (where `Secure` cookies aren't viable over plain HTTP).
- **Prisma on serverless Postgres** — Neon requires separate pooled and direct connection strings: the pooled connection for runtime queries, and a direct connection for running migrations, since Prisma's migration engine isn't compatible with connection pooling.
- **Prompt engineering for the AI assistant** — early versions of the assistant's responses were flat and robotic. Few-shot examples in the system prompt proved significantly more effective than abstract tone instructions at producing natural, consistent responses.
- **Pointer-event drag-to-scroll** — a horizontally scrollable UI component needed drag-to-scroll on desktop without breaking click behavior on its child buttons. The fix: defer `setPointerCapture` until pointer movement exceeds a small threshold, so a plain click never triggers drag capture.
- **Monorepo deployment** — both apps live in one repository for a coherent codebase, but deploy as independent Render services scoped by root directory, so a backend change doesn't trigger an unnecessary frontend rebuild and vice versa.

---

## Running Locally

**Prerequisites:** Node.js 18+, a PostgreSQL database (local or a free [Neon](https://neon.tech) instance)

```bash
git clone https://github.com/<your-username>/neura.git
cd neura
```

### Backend

```bash
cd neura-api
npm install
```

Create `neura-api/.env`:
```dotenv
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
BETTER_AUTH_URL="http://localhost:3000"
BETTER_AUTH_SECRET="<generate with: openssl rand -base64 32>"
CORS_ORIGIN="http://localhost:5173"
GEMINI_API_KEY="<your Gemini API key>"
NODE_ENV="development"
```

```bash
npx prisma generate
npx prisma db push
npm run dev
```

### Frontend

```bash
cd neura-web
npm install
```

Create `neura-web/.env`:
```dotenv
VITE_API_URL=http://localhost:3000
```

```bash
npm run dev
```

The app will be running at `http://localhost:5173`, connected to the API at `http://localhost:3000`.

---

## Roadmap

- [ ] Settings page (profile, timezone, theme, focus timer defaults, data export)
- [ ] Expense tracker module with charting and aggregation
- [ ] Expanded AI assistant capabilities

---

## License

This project is available for portfolio and educational reference. Contact the author for reuse permissions.

---

Built by Roxana Haghgoo — [LinkedIn](https://www.linkedin.com/in/roxana-haghgoo/) · [Email](mailto:haghgoo.roxana@gmail.com)
