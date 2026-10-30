<div align="center">

# 🧠 Neura

**A full-stack productivity app that brings tasks, notes, habits, goals, reminders, focus sessions and an AI assistant into one place.**

[**Live Demo**](https://neura-react.onrender.com) · [Report a Bug](https://github.com/roxana-hgh/neura/issues) · [Request a Feature](https://github.com/roxana-hgh/neura/issues)

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?logo=postgresql&logoColor=white)

</div>

> **Note:** the backend runs on Render's free tier and spins down after inactivity. The first request may take 30–60 seconds while the server wakes up.

<!-- screenshots here.
<p align="center">
  <img src="docs/screenshots/dashboard.png" alt="Dashboard" width="800" />
</p>
-->

---

## Table of Contents

- [About](#about)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Key Engineering Decisions](#key-engineering-decisions)
- [API Overview](#api-overview)
- [Data Model](#data-model)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [Deployment](#deployment)
- [Roadmap](#roadmap)
- [License](#license)
- [Author](#author)

---

## About

Neura goes well beyond a basic to-do list. It connects structured task management with long-term goals, recurring reminders, habit tracking, deep-work sessions and a conversational AI assistant that can manage your tasks and habits through natural language.

It was built as a complete, realistic full-stack application, with authentication, a relational database, a typed API, background notifications and a production deployment, rather than a scoped-down demo.

---

## Features

### Planning & execution
- **Tasks**: lists, tasks and subtasks with priorities, due dates and completion tracking.
- **Calendar**: month and week views of tasks by due date, with per-day modals, quick add, overdue indicators and keyboard shortcuts (`←` `→` `T` `M` `W`). The view and week start day are configurable.
- **Goals**: week / month / quarter / 6-month / year / custom periods, one level of sub-goals, and four progress measures (`numeric`, `milestone`, `task`, `manual`). The API computes pace and a "needs review" state. Goals link to tasks, notes and reminders, and keep a history timeline.
- **Reminders**: one-off or recurring (daily / weekly / monthly / yearly, every N, optional end), timezone-aware, with snooze, skip and pause. They can link to a goal, task or note, and goal presets auto-create review reminders.
- **Brainstorm inbox**: capture an idea in one keystroke and convert it to a task or reminder later. Includes daily and weekly reset flows for reviewing the inbox.

### Capture & reflect
- **Notes**: a full-page rich-text editor (TipTap) with autosave, color coding, inline image support, a mobile keyboard-aware toolbar and automatic per-paragraph text direction (RTL/LTR).
- **Habits**: daily logging with streaks, colors, and week / month / year heatmap views.
- **Focus timer**: Pomodoro-style sessions with tags, history, and lifetime and period stats.

### Insight & automation
- **Dashboard**: habit heatmap, weekly overview (focus minutes vs. habit completion), tasks-completed chart, goals in progress, upcoming reminders and an AI-generated daily plan.
- **AI assistant**: a chat interface powered by Groq with tool calling. It can list, create, update and delete tasks and habits, log habit completions, understand `@mentions` of your own items, and answer in the user's language (English and Persian).
- **Notifications**
  - *In-app:* toasts for newly due reminders with Done / Snooze actions, plus a header notification center.
  - *Web Push:* background notifications with action buttons (Done / Snooze), a morning task brief and an evening nudge, all timezone-aware.

### Platform
- Email/password authentication with cookie-based sessions.
- Profile and settings: appearance, week start day, notification preferences.
- Responsive layout for desktop and mobile, with a light/dark theme.

---

## Tech Stack

**Frontend (`neura-web`)**

| | |
|---|---|
| Framework | React 19 (React Compiler) + Vite 7 |
| Language | TypeScript 5.9 (strict) |
| Server state | TanStack Query v5 |
| UI state | Zustand v5 |
| Routing | React Router v7 |
| Forms | react-hook-form + Zod v4 |
| UI | Tailwind CSS v4 + shadcn/ui (Radix) |
| Charts | Recharts (shadcn `chart`) |
| Rich text | TipTap |
| Dates | date-fns |
| HTTP | Axios |
| Auth client | Better Auth |

**Backend (`neura-api`)**

| | |
|---|---|
| Runtime | Node.js + Express 5 |
| Language | TypeScript |
| ORM | Prisma 6 |
| Database | PostgreSQL (Neon, serverless) |
| Auth | Better Auth (email + password, cookie sessions) |
| AI | Groq Chat Completions with tool calling |
| Push | Web Push (VAPID) |

**Infrastructure**

| | |
|---|---|
| Backend hosting | Render (Web Service) |
| Frontend hosting | Render (Static Site) |
| Database | Neon (serverless Postgres) |
| CI/CD | Auto-deploy from GitHub on push |

---

## Architecture

Neura is a monorepo with two independently deployable apps. Both are organized **by feature/module** rather than by file type.

```
neura/
├── package.json        # `npm run dev` runs API + web together
├── neura-api/          # Express + Prisma backend
│   ├── prisma/schema.prisma
│   └── src/
│       ├── index.ts, app.ts
│       ├── config/     # the only place that reads process.env
│       ├── lib/        # Prisma, Better Auth, Groq, Web Push clients
│       ├── middleware/ # auth guard, error handling
│       ├── utils/
│       └── modules/    # routes → controller → service, one folder per resource
│           ├── tasks/  notes/  habits/  focus-sessions/  users/
│           ├── goals/  reminders/  brainstorms/  notifications/
│           └── assistant/  auth/
│
└── neura-web/          # React + Vite frontend
    └── src/
        ├── app/        # App root + router
        ├── layouts/    # App shell: sidebar, header
        ├── features/   # Self-contained feature modules
        │   ├── tasks/  notes/  habits/  focus/  goals/  reminders/
        │   ├── brainstorms/  notifications/  assistant/
        │   ├── settings/  auth/  dashboard/
        ├── components/ # ui (shadcn primitives) + shared
        ├── hooks/  lib/  stores/  types/
        └── ...
```

### Backend layering

| Layer | Responsibility |
|---|---|
| **Routes** | Paths and HTTP methods only |
| **Controller** | Reads the request, validates input, picks the status code |
| **Service** | Business logic and all Prisma queries; framework-agnostic; throws typed `HttpError`s |

Authentication is applied once at mount level (`app.use("/api/<name>", requireAuth, …)`), and every query is scoped to the authenticated user.

### Frontend conventions

- Feature folders own their pages, components, hooks, stores, schemas and types. Cross-feature imports are limited to a few explicit integration points (router, layout, dashboard).
- A single `@/` import alias, with no barrel files, which keeps Fast Refresh reliable and avoids circular imports.
- **Server state** lives entirely in TanStack Query; **Zustand** holds UI-only state (filters, timer, theme).

---

## Key Engineering Decisions

- **Cross-site authentication.** The frontend and backend live on different Render subdomains, so production uses `SameSite=None; Secure` cookies, while local development keeps `SameSite=Lax`.
- **Prisma on serverless Postgres.** Neon needs a pooled connection for runtime queries and a direct connection for migrations, since Prisma's migration engine doesn't work through a pooler.
- **Atomic notification delivery.** The in-process scheduler claims every send before pushing it (`Reminder.firedAt`, per-day digest markers), so a notification is never sent twice, even if the cron endpoint and the scheduler overlap.
- **Timezone-correct recurrence.** Reminders are stored in UTC with the user's IANA timezone, and recurrence keeps wall-clock time across DST changes.
- **Safe service worker.** The push service worker handles only `push` and `notificationclick`. It has no fetch handler and caches nothing, which rules out stale-bundle problems.
- **Signed action tokens.** Push action buttons (Done / Snooze) call a public endpoint with an HMAC-signed token that carries the reminder occurrence, so a stale button does nothing.
- **Resilient AI layer.** The Groq client rotates through a model pool on rate limits, applies cooldowns, and returns `503` with `Retry-After` when every model is busy. The tool loop is bounded, and only data-changing actions are surfaced to the UI.
- **Accurate analytics.** A dedicated `completedAt` timestamp is set on toggle, instead of inferring completion from the due date.
- **Local-date safety.** Dates are formatted with `date-fns` (`yyyy-MM-dd`) rather than `toISOString()`, which shifts local midnight to the previous day in timezones ahead of UTC.
- **Autosaving editor.** Notes save with a debounce, never overlap requests, and flush on unmount, tab hide and `Ctrl+S`. The first save of a new note swaps the URL without remounting the editor.
- **Perceptually consistent theming.** Light and dark themes use OKLCH color tokens with deliberately spaced chart hues.
- **Monorepo, independent deploys.** Each app deploys as its own Render service scoped to its subdirectory, so a backend change doesn't rebuild the frontend.

---

## API Overview

All routes are prefixed with `/api` and require a session, except `/api/auth/*` and the two public notification endpoints.

| Base | Description |
|---|---|
| `/auth/*` | Better Auth: sign-in, sign-up, session, sign-out |
| `/tasks` | Tasks, calendar feed (`GET /calendar`), toggle, subtasks |
| `/tasks/lists` | Task lists |
| `/notes` | Notes CRUD |
| `/habits` | Habits CRUD, overview by view/date, entry toggle |
| `/focus-sessions` | Sessions CRUD and stats |
| `/goals` | Goals and sub-goals, lifecycle (status, extend, archive), progress, notes, tasks, links |
| `/reminders` | Reminders CRUD, counts, link options, complete / skip / snooze / pause / resume / reopen |
| `/brainstorms` | Inbox, keep, process (→ task / reminder), restore |
| `/notifications` | Push subscription, settings, inbox, test. Public: `POST /action`, `POST /dispatch` |
| `/users` | Profile (`/me`) |
| `/assistant` | AI chat and quick-action modes (e.g. `daily_plan`) |

A health check is available at `GET /health`.

---

## Data Model

Core Prisma models: `User`, `TaskList`, `Task`, `SubTask`, `Note`, `Habit`, `HabitEntry`, `FocusSession`, `Goal`, `GoalLog`, `Reminder`, `ReminderLog`, `Brainstorm`, `PushSubscription`, `NotificationSettings`, plus the Better Auth tables (`Session`, `Account`, `Verification`).

- All IDs are `cuid()` strings, and child rows cascade with their user.
- Goals support a single level of sub-goals via `parentId`, and link to tasks and notes.
- Reminders link to at most one goal, task or note.
- A task created from a goal page is hidden from the main Tasks view unless `showInTasks` is enabled.

See [`neura-api/prisma/schema.prisma`](neura-api/prisma/schema.prisma) for the full schema.

---

## Getting Started

### Prerequisites

- Node.js **20.19+**
- A PostgreSQL database (local, or a free [Neon](https://neon.tech) instance)
- A [Groq](https://console.groq.com) API key (for the AI assistant)

### 1. Clone and install

```bash
git clone https://github.com/roxana-hgh/neura.git
cd neura

npm install                 # root (runs both apps with one command)
cd neura-api && npm install
cd ../neura-web && npm install
cd ..
```

### 2. Configure the environment

Create `neura-api/.env` and `neura-web/.env` (see [Environment Variables](#environment-variables)).

### 3. Set up the database

```bash
cd neura-api
npx prisma generate
npx prisma migrate dev
cd ..
```

### 4. Run

```bash
npm run dev
```

- Web: http://localhost:5173
- API: http://localhost:3000

---

## Environment Variables

**`neura-api/.env`**

```dotenv
# Database (Neon: pooled URL for runtime, direct URL for migrations)
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Auth
BETTER_AUTH_URL="http://localhost:3000"
BETTER_AUTH_SECRET="<openssl rand -base64 32>"   # required when NODE_ENV=production
CORS_ORIGIN="http://localhost:5173"

# AI assistant
GROQ_API_KEY="<your Groq API key>"

# Web Push (optional; push is disabled when unset)
# Generate with: npx web-push generate-vapid-keys
VAPID_PUBLIC_KEY=""
VAPID_PRIVATE_KEY=""
VAPID_SUBJECT="mailto:you@example.com"

# Optional: lets an external scheduler call POST /api/notifications/dispatch
CRON_SECRET=""

PORT=3000
NODE_ENV="development"
```

**`neura-web/.env`**

```dotenv
# API origin, without the /api suffix
VITE_API_URL=http://localhost:3000
```

---

## Scripts

| Location | Command | Description |
|---|---|---|
| root | `npm run dev` | Run API and web together |
| `neura-web` | `npm run dev` / `build` / `preview` | Vite dev server, production build, preview |
| `neura-web` | `npm run lint` | ESLint |
| `neura-web` | `npx tsc -p tsconfig.app.json --noEmit` | Type-check (`vite build` doesn't type-check) |
| `neura-api` | `npm run dev` | API with auto-reload |
| `neura-api` | `npm run build` / `npm start` | `prisma generate` + `tsc` + `tsc-alias`, then `node dist/index.js` |
| `neura-api` | `npx tsc --noEmit` | Type-check |
| `neura-api` | `npx prisma migrate dev` | Run database migrations |

---

## Deployment

Both apps are deployed on **Render** and auto-deploy on push, scoped to their own subdirectory:

- **`neura-api`**: Web Service. Build runs `npm run build`, start runs `node dist/index.js`. The build needs `typescript`, `tsc-alias` and all `@types/*` packages in `dependencies`, because Render doesn't install `devDependencies`.
- **`neura-web`**: Static Site (`npm run build`, publish `dist`).
- **Database**: Neon serverless Postgres.

Set `NODE_ENV=production`, `BETTER_AUTH_SECRET`, `CORS_ORIGIN` (the deployed frontend URL) and `BETTER_AUTH_URL` (the deployed API URL) in production. Notifications run on an in-process scheduler; on a free tier that sleeps, point an external cron at `POST /api/notifications/dispatch` with the `x-cron-secret` header to keep them reliable.

---

## Roadmap

- [ ] Expense tracker module with charting and aggregation
- [ ] Settings: data export, account deletion, 2FA, email change
- [ ] Expand AI assistant tools to goals, reminders and notes
- [ ] Route-level code splitting to reduce the initial bundle
- [ ] Automated test suite and CI checks

---

## License

This project is available for portfolio and educational reference. Contact the author for reuse permissions.

---

## Author

Built by **Roxana Haghgoo**
[LinkedIn](https://www.linkedin.com/in/roxana-haghgoo/) · [Email](mailto:haghgoo.roxana@gmail.com)