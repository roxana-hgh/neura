# Neura

A full-stack productivity application combining task management, notes, habit tracking, a focus timer, dashboard analytics, and an AI-powered assistant — built to demonstrate production-grade full-stack engineering across the entire stack, from database design to deployment.

**Live demo:** [https://neura-react.onrender.com](https://neura-react.onrender.com)

> Note: the backend is hosted on Render's free tier and spins down after periods of inactivity. The first request may take 30–60 seconds to respond while the server wakes up.

---

## Overview

Neura is a task and productivity manager that goes beyond a basic to-do list. It combines structured task management (lists, tasks, subtasks), free-form notes with rich text editing, habit tracking with streaks and visual history, a focus timer for deep work sessions, a calendar view, a dashboard with real analytics, and a conversational AI assistant that can manage tasks and habits on the user's behalf through natural language.

The project was built to be a complete, realistic full-stack application — with authentication, a relational database, a typed API, and a deployed production environment — rather than a scoped-down demo.

---

## Features

- **Task management** — task lists, tasks, and subtasks with completion tracking, priorities, and a calendar view
- **Notes** — rich text notes powered by TipTap, with color coding
- **Habit tracking** — daily habit logging with streaks, color coding, and heatmap / calendar / year views of progress
- **Focus timer** — Pomodoro-style focus sessions with history and stats broken down by category
- **Dashboard** — at-a-glance analytics combining a habit heatmap, a weekly overview chart (focus minutes vs. habit completion rate), and a tasks-completed chart
- **AI assistant** — a chat interface powered by Google Gemini that can list, create, update, and delete tasks and habits through natural conversation, complete with quick actions and a generated daily plan
- **Authentication** — secure email/password auth with session-based access control
- **Settings & profile** — user profile management
- **Responsive design** — usable across desktop and mobile viewports, with a refined light/dark theme system

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
| Charts | Recharts / shadcn charts |
| Rich text | TipTap |
| Routing | React Router |
| HTTP client | Axios |
| Icons | lucide-react |

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
│   │   ├── index.ts     # Entry point (starts the server)
│   │   ├── app.ts       # Express app: middleware + route mounting
│   │   ├── config/      # Environment config
│   │   ├── lib/         # Prisma client, Better Auth, Groq client
│   │   ├── middleware/  # Auth guard, error handling
│   │   ├── utils/       # Shared helpers
│   │   └── modules/     # One module per resource: routes → controller → service
│   │       ├── tasks/  notes/  habits/  focus-sessions/  users/
│   │       ├── assistant/  # Prompts, context, LLM tools
│   │       └── auth/
│   └── prisma/
│       └── schema.prisma
│
├── neura-web/           # React + Vite frontend
│   └── src/
│       ├── app/           # App root + router
│       ├── layouts/       # App shell: layout, header, sidebar menu
│       ├── features/      # One self-contained module per feature
│       │   ├── tasks/     #   components/ hooks/ pages/ schemas/ stores/ types/ utils/
│       │   ├── notes/
│       │   ├── habits/
│       │   ├── focus/
│       │   ├── assistant/
│       │   ├── settings/
│       │   ├── auth/
│       │   └── dashboard/ #   Composes widgets from the other features
│       ├── components/
│       │   ├── ui/        # shadcn/ui primitives
│       │   └── shared/    # Shared app components (AlertDialog, rich-text editor)
│       ├── hooks/         # Shared hooks
│       ├── lib/           # Axios instance, auth client, toast, utils
│       ├── stores/        # Global Zustand stores (theme)
│       └── types/         # Shared types
│
└── README.md
```

Each application deploys independently on Render, scoped to its own subdirectory, with auto-deploy triggered only by changes within that subdirectory.

### Data flow

- **Server state** (tasks, notes, habits, sessions) is owned entirely by TanStack Query — no duplication into client state.
- **Client-only state** (filters, UI toggles) lives in Zustand.
- All Prisma mutations verify resource ownership (`userId`) before executing, preventing cross-user data access.

### Dashboard & analytics

The dashboard surfaces three chart components backed by real query data rather than approximated fields: a habit heatmap card, a weekly overview combo chart (bars for focus minutes, a line for habit completion rate), and a tasks-completed chart. Task completion is tracked via a dedicated `completedAt` timestamp set on toggle, rather than inferred from a due date, to keep the analytics accurate.

### AI Assistant

The assistant endpoint (`/api/assistant`) runs a Gemini function-calling loop with tools spanning both tasks and habits — including `list_tasks`, `create_task`, `update_task`, `delete_task`, and equivalent habit-management tools — each backed by the same ownership-checked Prisma queries used elsewhere in the API. The assistant also supports quick actions and can generate a daily plan card. The loop has a bounded number of tool-call rounds to prevent runaway execution.

---

## Key Engineering Decisions

A few problems solved along the way that reflect real production trade-offs:

- **Cross-site authentication** — the frontend and backend are deployed on separate Render subdomains, requiring `SameSite=None; Secure` cookies in production while keeping `SameSite=Lax` for local development (where `Secure` cookies aren't viable over plain HTTP).
- **Prisma on serverless Postgres** — Neon requires separate pooled and direct connection strings: the pooled connection for runtime queries, and a direct connection for running migrations, since Prisma's migration engine isn't compatible with connection pooling.
- **Prompt engineering for the AI assistant** — early versions of the assistant's responses were flat and robotic. Few-shot examples in the system prompt proved significantly more effective than abstract tone instructions at producing natural, consistent responses.
- **Pointer-event drag-to-scroll** — a horizontally scrollable UI component needed drag-to-scroll on desktop without breaking click behavior on its child buttons. The fix: defer `setPointerCapture` until pointer movement exceeds a small threshold, so a plain click never triggers drag capture.
- **Accurate analytics over approximation** — adding a proper `completedAt` timestamp field (via a schema migration) instead of approximating completion from `dueDate` made the dashboard charts materially more accurate.
- **Perceptually consistent theming** — the light and dark themes are built on OKLCH color tokens, with chart hues spaced deliberately for distinguishability rather than picked arbitrarily.
- **Monorepo deployment** — both apps live in one repository for a coherent codebase, but deploy as independent Render services scoped by root directory, so a backend change doesn't trigger an unnecessary frontend rebuild and vice versa.

---

## Running Locally

**Prerequisites:** Node.js 18+, a PostgreSQL database (local or a free [Neon](https://neon.tech) instance)

```bash
git clone https://github.com/roxana-hgh/neura.git
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

- [ ] Expense tracker module with charting and aggregation
- [ ] Expanded settings (timezone, theme preference, week start day, data export, account deletion, 2FA, email change)
- [ ] Expanded AI assistant capabilities

---

## License

This project is available for portfolio and educational reference. Contact the author for reuse permissions.

---

Built by Roxana Haghgoo — [LinkedIn](https://www.linkedin.com/in/roxana-haghgoo/) · [Email](mailto:haghgoo.roxana@gmail.com)
