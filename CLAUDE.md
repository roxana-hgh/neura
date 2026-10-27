# Neura

Neura is a full-stack productivity app. It has tasks (with lists and subtasks), rich-text notes, habit tracking, a focus timer, a calendar, an analytics dashboard, and an AI assistant that can manage tasks and habits in natural language.

This file is self-contained. It describes the whole project, so it is useful even without access to the repository (for example inside a Claude Project).

---

## Monorepo layout

```
neura/
├── package.json        # root: `npm run dev` runs API + WEB together (concurrently)
├── README.md
├── CLAUDE.md
├── neura-api/          # Backend: Express 5 + Prisma 6 + PostgreSQL + Better Auth + Groq
└── neura-web/          # Frontend: React 19 + Vite 7 + TypeScript + Tailwind 4 + shadcn/ui
```

Each app is installed and deployed on its own (Render, scoped to its subdirectory). There is no shared code package between them; types are duplicated on the frontend.

### Commands

| Where | Command | What it does |
|---|---|---|
| root | `npm run dev` | Runs API (`ts-node-dev`) and WEB (`vite`) together |
| neura-web | `npm run dev` / `build` / `lint` / `preview` | Vite dev server (port 5173), production build, ESLint |
| neura-web | `npx tsc -p tsconfig.app.json --noEmit` | Type-check. `vite build` does **not** type-check |
| neura-api | `npm run dev` | API with auto-reload (port 3000 by default); `ts-node-dev` with `tsconfig-paths` for the `@/` alias |
| neura-api | `npm run build` / `start` | `prisma generate` + `tsc` + `tsc-alias` (rewrites `@/` in `dist/`); fails on type errors. Then `node dist/index.js` |
| neura-api | `npx tsc --noEmit` | Type-check (must be 0 errors) |
| neura-api | `npx prisma migrate dev` / `npx prisma generate` | DB migrations / client generation |

### Environment variables (names only)

- **neura-web/.env**: `VITE_API_URL` is the API origin with no `/api` suffix, e.g. `http://localhost:3000`.
- **neura-api/.env**:
  - `DATABASE_URL`, `DIRECT_URL`: Postgres on Neon
  - `BETTER_AUTH_URL`
  - `BETTER_AUTH_SECRET`: read by Better Auth directly; required when `NODE_ENV=production`, otherwise the server crashes
  - `CORS_ORIGIN`: the deployed frontend URL
  - `GROQ_API_KEY`
  - `PORT`
  - `NODE_ENV`

---

## Frontend (`neura-web`)

### Stack

- **Core:** React 19 (with the React Compiler babel plugin), Vite 7, TypeScript 5.9 in strict mode
- **Server state:** TanStack Query v5
- **UI-only state:** Zustand v5
- **Routing:** React Router v7 (`createBrowserRouter`)
- **Forms:** react-hook-form + zod v4 (`@hookform/resolvers`)
- **UI:** Tailwind CSS v4 + shadcn/ui (new-york style, Radix, lucide icons)
- **Charts:** Recharts via shadcn `chart`
- **Rich text:** TipTap
- **Dates:** date-fns
- **Assistant chat:** react-markdown + remark-gfm
- **Toasts:** sonner
- **HTTP:** Axios
- **Auth client:** Better Auth (`better-auth/react`)

### Architecture: feature-based modules

The code is organized **by feature**, not by file type. Each feature folder is self-contained and owns its pages, components, hooks, stores, schemas, types and utils. The **only integration points** between features are:

- `app/router.tsx`: wires every feature's pages to URLs
- `layouts/`: the app shell (sidebar menu, header)
- `features/dashboard/`: composes widgets from other features

Shared, feature-agnostic code lives in `components/ui`, `components/shared`, `hooks`, `lib`, `stores` and `types`.

### Directory structure (`neura-web/src`)

```
src/
├── main.tsx                       # Entry: mounts <App/>, imports index.css and themeStore (applies theme)
├── index.css                      # Tailwind v4 + theme tokens (light/dark CSS variables)
├── app/
│   ├── App.tsx                    # QueryClientProvider + RouterProvider
│   └── router.tsx                 # All routes (see "Routes" below)
├── layouts/
│   ├── AppLayout.tsx              # SidebarProvider + SidebarNav + Header + <Outlet/> + Toaster
│   ├── Header.tsx                 # Top bar, theme toggle, user menu
│   ├── SidebarNav.tsx             # Main navigation menu (also lists task lists, "add list")
│   └── UserProfileMenu.tsx        # Avatar dropdown, sign out
├── features/
│   ├── auth/
│   │   ├── components/            # LoginForm, SignUpForm, LoginSignUpLayout,
│   │   │                          # ProtectedRoute (requires session), GuestRoute (redirects if logged in)
│   │   └── pages/                 # LoginPage, SignUpPage
│   ├── tasks/
│   │   ├── components/            # AddTask, EditTask, TaskForm, TaskDetail, TaskSearch, NoTasks, TasksSummary,
│   │   │   │                      # DayTasksModal, TasksCompletedChart, TaskViewToggle, Task.styles.css
│   │   │   ├── calendar/          # CalendarHeader, CalendarMonthView, CalendarWeekView,
│   │   │   │                      # CalendarWeekTaskCard, CalendarTaskChip (see "Calendar" below)
│   │   │   ├── lists/             # AddNewList, EditList, ListForm, ListCardItem, NoList
│   │   │   └── task-list/         # TasksList, TaskListItem (`compact` for the dashboard), TaskSections,
│   │   │                          # TaskSectionsSkeleton
│   │   ├── hooks/                 # useTasks (tasks, lists, subtasks queries/mutations), useCalendarTasks
│   │   ├── pages/                 # TasksPage, CalendarPage, AllListsPage, SingleListPage
│   │   ├── schemas/               # task.schema, list.schema (zod)
│   │   ├── stores/                # tasksStore (useTasksStore: lists cache + search/priority filters + view mode),
│   │   │                          # calendarStore (useCalendarStore: month/week view, persisted)
│   │   ├── types/                 # task.ts: Task, SubTask, TaskList, TaskWithListName
│   │   └── utils/                 # calendar, colorMapper, groupTasks, taskProgress, taskSelectors,
│   │                              # taskStats (getDueInfo labels, getTaskStats counts)
│   ├── notes/
│   │   ├── components/            # NoteItem (grid card with preview/thumbnail)
│   │   │   └── editor/            # NoteEditor (paper page, autosave), NoteEditorHeader (back, save status,
│   │   │                          # color, delete), NoteToolbar (top on md+, fixed above the keyboard on mobile)
│   │   ├── hooks/                 # useNotes (list + search, useNote, useDeleteNote), useNoteAutosave,
│   │   │                          # useKeyboardInset (visualViewport keyboard height)
│   │   ├── lib/                   # editorExtensions (TipTap config + text/highlight colors), noteImage (compress + insert)
│   │   ├── pages/                 # AllNotesPage, NoteEditorPage (/note/new and /note/:id)
│   │   ├── stores/                # notesStore (useNotesStore: search state)
│   │   ├── types/                 # note.ts: Note, NoteInput
│   │   └── utils/                 # colorMapper (NOTE_COLORS), textPreview (stripHtml, getNotePreview, formatNoteDate)
│   ├── habits/
│   │   ├── components/            # CreateHabitModal, EditHabitModal, HabitListModal, HabitViewTabs,
│   │   │                          # WeekGrid, MonthCalendar, YearHeatmap, DaySquare, HabitHeatmapCard
│   │   ├── hooks/                 # useHabits (+ create/update/delete, optimistic toggle entry)
│   │   ├── lib/                   # habitDate (unitToDays, habitDueDate)
│   │   ├── pages/                 # HabitsPage
│   │   └── types/                 # habit.ts: Habit, HabitView, HabitsResponse, inputs
│   ├── focus/
│   │   ├── components/
│   │   │   ├── FocusSessionSec.tsx  # Page body: timer + save dialog + history
│   │   │   ├── timer/             # FocusTimer, DurationSelector
│   │   │   └── sessions/          # SessionHistory, SessionCard, SessionFilters, SessionStats,
│   │   │                          # LifetimeSummary, SessionSaveDialog, SessionEditDialog, SessionFormFields
│   │   ├── hooks/                 # useFocusSessions (+ stats)
│   │   ├── pages/                 # FocusTimerPage
│   │   ├── stores/                # focusTimerStore (running timer state)
│   │   ├── types/                 # focusSession.ts
│   │   └── utils/                 # time (formatting helpers)
│   ├── assistant/
│   │   ├── components/            # ChatMessage, MarkdownMessage, ActionBadge, MentionPicker,
│   │   │                          # QuickActions, TypingIndicator
│   │   ├── hooks/                 # useAssistant (chat, modes, @mentions), useDailyPlan (dashboard card)
│   │   ├── lib/                   # mentionItems (MentionItem, filterMentionItems)
│   │   └── pages/                 # AssistantPage (uses tasks + habits hooks for @mentions)
│   ├── settings/
│   │   ├── components/            # SettingsSection (layout), AccountSection, ProfileForm, ProfileAvatar,
│   │   │                          # AppearanceSection (theme), SessionSection (sign out)
│   │   ├── hooks/                 # useProfile (GET/PATCH /users/me)
│   │   ├── pages/                 # SettingsPage
│   │   ├── schemas/               # profile.schema
│   │   └── types/                 # user.ts: User
│   └── dashboard/
│       ├── components/            # WeeklyOverviewChart (focus minutes vs habit completion)
│       └── pages/                 # DashboardPage (tasks, notes, lists, habits heatmap, charts, daily plan)
├── components/
│   ├── ui/                        # shadcn/ui primitives: generated, keep stock (button, dialog, sidebar, chart, …)
│   └── shared/
│       ├── AlertDialog.tsx        # Confirm dialog used for deletes
│       ├── PageHeader.tsx         # Page title block: eyebrow + title + description + actions
│       ├── SectionCard.tsx        # Card with icon/title header and optional "View all" link
│       ├── StatTile.tsx           # Small metric tile (label, value, hint)
│       └── EmptyState.tsx         # Icon + title + description + action (dashed card or `compact`)
├── hooks/use-mobile.ts            # Shared hooks (shadcn alias "@/hooks")
├── lib/
│   ├── api.ts                     # Axios instance: baseURL = VITE_API_URL + "/api", withCredentials
│   ├── auth-client.ts             # Better Auth client: signIn, signUp, signOut, useSession
│   ├── toast.ts                   # Styled wrapper over sonner: toast.success / error / default
│   └── utils.ts                   # cn() (clsx + tailwind-merge)
├── stores/themeStore.ts           # Global light/dark theme (Zustand)
└── types/color.ts                 # `colors` union shared by task lists and notes
```

### Routes (`app/router.tsx`)

Everything under `/` is wrapped in `ProtectedRoute` + `AppLayout`:

| Path | Page |
|---|---|
| `/` | `DashboardPage` |
| `/tasks` | `TasksPage` |
| `/calendar` | `CalendarPage` |
| `/lists` | `AllListsPage` |
| `/list/:id` | `SingleListPage` |
| `/notes` | `AllNotesPage` |
| `/note/:id` | `NoteEditorPage` (`/note/new` for a new note) |
| `/notes/add`, `/note/:id/edit` | Legacy URLs, redirect / render `NoteEditorPage` |
| `/habits` | `HabitsPage` |
| `/focus` | `FocusTimerPage` |
| `/assistant` | `AssistantPage` |
| `/settings` | `SettingsPage` |

`/login` and `/signup` are wrapped in `GuestRoute`.

### Conventions (follow these when adding or changing code)

**Imports**
- Always use the `@/` alias, which maps to `src/`. Relative imports (`./`, `../`) are not used anywhere, including inside the same folder.
  Example: `import { useTasks } from "@/features/tasks/hooks/useTasks"`.
- The alias is defined in `vite.config.ts`, `tsconfig.json` and `tsconfig.app.json` (`paths`).
- Omit the `.ts`/`.tsx` extension. Keep the extension for CSS imports.
- There are **no barrel `index.ts` files**. Import from the concrete file. This keeps Fast Refresh working and avoids circular imports.

**Where code goes**
- New feature: create `src/features/<feature-name>/` with only the subfolders it needs (`components/`, `hooks/`, `pages/`, `schemas/`, `stores/`, `types/`, `utils/` or `lib/`). Register its pages in `app/router.tsx` and add a menu item in `layouts/SidebarNav.tsx` if needed.
- Code used by a single feature belongs inside that feature. Move it to `components/shared`, `lib`, `hooks` or `types` only when two or more features need it.
- Features should not import from each other. Allowed exceptions:
  - `dashboard` imports from all features
  - `layouts/SidebarNav` imports from `tasks`
  - `assistant/pages/AssistantPage` uses `tasks` and `habits` hooks for @mentions

**Naming**
- Components and pages: PascalCase files that match the component name. Pages end in `Page` (`TasksPage.tsx`).
- Hooks: `useXxx.ts`. Stores: `xxxStore.ts` exporting `useXxxStore`. Zod schemas: `xxx.schema.ts`.
- Types: lowercase singular file in the feature's `types/` folder (`task.ts`, `note.ts`, `habit.ts`).
- Sub-folders inside `components/` are lowercase/kebab-case (`lists/`, `task-list/`, `timer/`, `sessions/`).

**Data and state**
- All server data goes through TanStack Query hooks in `features/<x>/hooks/`, using the shared `api` Axios instance.
  - Query keys start with the resource name (`["habits", view, date]`, `["tasks"]`, …).
  - Mutations invalidate those keys in `onSuccess`. Some toggles, such as habit entries, are optimistic.
- Zustand holds **UI-only state** (filters, search, the running timer, theme). It never duplicates server data, with one exception: `tasksStore.lists` mirrors the lists for the sidebar.
- Feedback to the user: use `toast` from `@/lib/toast`, not `sonner` directly.
- Forms: react-hook-form + `zodResolver` with the schema in the feature's `schemas/` folder.
- Auth: `useSession()` from `@/lib/auth-client`. Requests send the session cookie (`withCredentials`).

**UI**
- Use the shadcn primitives from `@/components/ui/*` and the `cn()` helper.
- Pages share one visual language (modeled on Habits): `PageHeader` at the top, `StatTile` rows for numbers, `SectionCard` / `rounded-xl border border-border bg-card` for panels, `EmptyState` for empty lists, and `animate-pulse` skeletons instead of full-screen loaders. The primary page action is `Button size="sm"` with a leading `Plus` icon ("New task", "New list", "New habit"). Tasks, Dashboard and Settings no longer use the older `.glass` class.
- Add new primitives with the shadcn CLI. `components.json` aliases: `@/components`, `@/components/ui`, `@/lib`, `@/lib/utils`, `@/hooks`.
- Light/dark theming is done with CSS variables in `index.css`.

**API field naming**
- The frontend sends snake_case fields for tasks (`due_date`, `list_id`). The API maps them to Prisma camelCase (`dueDate`, `listId`).
- Check the route handler before adding new fields.

**Dates**
- Turn a local `Date` into a `"yyyy-MM-dd"` string with `format(date, "yyyy-MM-dd")` from date-fns, never `toISOString().split("T")[0]`. In zones ahead of UTC (for example Iran, UTC+3:30), `toISOString()` moves local midnight to the previous day.

### Calendar (`/calendar`)

`pages/CalendarPage` shows tasks by due date in a **Month** or **Week** view. The chosen view is stored in `useCalendarStore` (persisted in localStorage as `neura-calendar-view`).

- **Data:** `useCalendarTasks(range)` uses `useQueries` to fetch `GET /tasks/calendar?year=&month=` once for each month the visible range touches. A month grid with its padding days, or a week that crosses a month boundary, can touch up to 3 months. Results are mapped with `mapTask` and merged. The query keys are `["tasks", "calendar", year, month]`, so every task mutation (which invalidates `["tasks"]`) refreshes the calendar.
- **Logic** (`utils/calendar.ts`, pure functions):
  - `getVisibleRange` / `shiftCursor` / `formatRangeTitle`: range and navigation. Weeks start on Monday (`WEEK_STARTS_ON = 1`).
  - `groupTasksByDay`: returns a `Map` keyed by `dayKey`. Within each day, open tasks come first, then high → low priority, then by title.
  - `isTaskOverdue`, `getCalendarStats`.
  - `PRIORITY_STYLES`: the single source of priority colors (high = rose, medium = amber, low = sky). It provides `dot`, `bar` and `badge` classes and a label. Reuse it for any priority color in the calendar.
- **Month view** (`CalendarMonthView`):
  - Clicking a day opens `DayTasksModal`, where tasks can be edited, toggled and added.
  - **Mobile (< sm):** each cell is too narrow for titles. It shows a count badge and a priority bar so the day can be read at a glance:
    - The **count badge** shows the number of *open* tasks. Its color is the highest open priority. It is solid red if any task is overdue, and a green ✓ when every task is done.
    - The **priority bar** has one segment per task, up to 4, colored by priority. Completed tasks are grey.
  - **sm+:** `CalendarTaskChip` rows (2 on sm/md, 3 on lg, then "+N more") and an open-count badge next to the day number.
- **Week view** (`CalendarWeekView`):
  - md+ shows 7 columns. Mobile shows a stacked schedule, one card per day.
  - Each task is a `CalendarWeekTaskCard`. Its checkbox toggles completion, and the card body opens `TaskDetail`.
  - Each day has an "Add task" button. It uses `AddNewTask` with `initialDueDate` and a custom `trigger`.
- **Header** (`CalendarHeader`): stats for the period (the month itself in Month view, not the padding days), a priority legend, the view toggle and navigation.
- **Keyboard shortcuts:** `←`/`→` move to the previous/next period, `T` jumps to today, `M`/`W` switch views. Shortcuts are ignored while typing in a field or while a dialog is open.

### Notes editor (`/note/:id`)

- There is no view/edit split or form: opening a note puts you straight into a full-page editor (title + TipTap body).
- **Autosave** (`useNoteAutosave`): debounced 800 ms, saves never overlap, flushes on unmount / tab hide / Ctrl+S. The first save of `/note/new` POSTs and the URL is replaced with `/note/:id` without remounting the editor (`NoteEditorPage` keeps the same `key`). An empty title is saved as the body's first line, or "Untitled".
- **Toolbar**: TipTap v3 doesn't re-render on transactions, so `NoteToolbar` reads state through `useEditorState`. Buttons call `preventDefault` on mousedown so the mobile keyboard stays open.
- Images are downscaled (max 1600px, WebP/JPEG) and stored inline as data URLs; the API's JSON limit is 10 MB for this.
- Each paragraph uses `unicode-bidi: plaintext`, so Persian and English lines get their own direction. Editor styles live under `.note-prose` in `index.css`.

### Known pre-existing issues (not regressions)

- `tsc` reports about 16 errors that existed before the restructure:
  - zod v4 no longer supports `errorMap` in `z.enum`
  - resolver type mismatches in `TaskForm` and `ListForm`
  - a few unused variables
- `vite build` still succeeds because Vite does not type-check.
- ESLint reports about 21 pre-existing problems (react-hooks / react-refresh rules, unused vars).
- The production bundle is a single chunk of about 2.2 MB. There is no code-splitting yet.

---

## Backend (`neura-api`)

### Stack

- **Server:** Express 5, TypeScript (CommonJS), `ts-node-dev` in development
- **Database:** Prisma 6 + PostgreSQL (Neon)
- **Auth:** Better Auth (email + password, cookie sessions)
- **AI:** Groq Chat Completions (OpenAI-compatible) with tool calling

The README still says "Google Gemini", but the code now uses **Groq**.

### Architecture: modules with routes → controller → service

The backend is organized **by module** (one folder per resource), mirroring the frontend's features. Each module uses three layers:

| Layer | File | Responsibility |
|---|---|---|
| Routes | `xxx.routes.ts` | Paths + HTTP methods only. Maps each route to a controller function. |
| Controller | `xxx.controller.ts` | HTTP concerns: reads `req.params` / `req.query` / `req.body`, validates input, picks the status code, sends the response. |
| Service | `xxx.service.ts` | Business logic and **all Prisma queries**. Knows nothing about Express (`req`/`res`). Throws `HttpError` (e.g. `notFound("Task not found")`) for expected failures. |

Shared infrastructure lives outside `modules/`: `config/`, `lib/`, `middleware/`, `utils/` and `types/`.

### Directory structure (`neura-api`)

```
neura-api/
├── prisma/schema.prisma            # Data model (see below)
├── prisma.config.ts
└── src/
    ├── index.ts                    # Entry: loads env, starts the server (app.listen)
    ├── app.ts                      # Express app: CORS, JSON body, route mounting, 404 + error handler
    ├── config/
    │   └── env.ts                  # The ONLY place that reads process.env (loads dotenv); exports `env`, `allowedOrigins`
    ├── lib/                        # Clients for external systems
    │   ├── prisma.ts               # Prisma client singleton
    │   ├── auth.ts                 # Better Auth instance (prismaAdapter, email+password, trustedOrigins, cookie attrs)
    │   └── groq.ts                 # Groq client: model pool, rate-limit fallback/cooldown,
    │                               # runAssistantTurn (tool loop), AssistantBusyError
    ├── middleware/
    │   ├── require-auth.ts         # Checks the Better Auth session, sets req.userId, else 401 { error: "Unauthorized" }
    │   └── error-handler.ts        # notFoundHandler (404 JSON) + errorHandler (HttpError / Prisma P2025 → 404 / else 500)
    ├── utils/
    │   ├── http-error.ts           # HttpError(status, message), notFound(message)
    │   └── date.ts                 # dayKey(date) → "yyyy-MM-dd"
    ├── types/
    │   └── express.d.ts            # Augments Express.Request with `userId?: string`
    └── modules/
        ├── auth/
        │   └── auth.routes.ts      # /api/auth/* → Better Auth handler (no controller/service)
        ├── tasks/
        │   ├── tasks.routes.ts     # All /api/tasks routes, including lists and subtasks (order matters, see below)
        │   ├── tasks.controller.ts / tasks.service.ts        # Tasks + calendar; assertTaskOwner()
        │   ├── lists.controller.ts / lists.service.ts        # Task lists
        │   └── subtasks.controller.ts / subtasks.service.ts  # Subtasks (always check parent-task ownership first)
        ├── notes/
        │   └── notes.routes.ts / notes.controller.ts / notes.service.ts
        ├── habits/
        │   ├── habits.routes.ts / habits.controller.ts / habits.service.ts  # CRUD, entry toggle, overview + auto-archive
        │   └── habits.utils.ts     # Pure helpers: habitDueDate, getRange, shiftRange, groupEntriesByHabit,
        │                           # habitPeriodStats, toPercent, currentStreak (also used by assistant)
        ├── focus-sessions/
        │   └── focus-sessions.routes.ts / .controller.ts / .service.ts  # VALID_TAGS, isValidTag, stats
        ├── users/
        │   └── users.routes.ts / users.controller.ts / users.service.ts # Profile (/me)
        └── assistant/
            ├── assistant.routes.ts / assistant.controller.ts  # 503 + Retry-After when every model is busy
            ├── assistant.service.ts   # Builds the user prompt, runs the tool loop, filters mutating actions
            ├── assistant.prompts.ts   # SYSTEM_PROMPT, QUICK_INSTRUCTIONS (per quick-action mode), MUTATING_TOOLS
            ├── assistant.context.ts   # Task / habit / profile snapshots embedded in the prompt
            └── tools/
                ├── task.tools.ts      # list_tasks, create_task, update_task, delete_task
                └── habit.tools.ts     # list_habits, create_habit, update_habit, delete_habit, log_habit_completion
```

### Backend conventions (follow these when adding or changing code)

**Adding an endpoint or module**
- Create `src/modules/<name>/` with `<name>.routes.ts`, `<name>.controller.ts` and `<name>.service.ts`.
- Mount the router in `app.ts`: `app.use("/api/<name>", requireAuth, <name>Routes)`.
- Auth is applied **once, at mount level** in `app.ts`. Routers never add `requireAuth` themselves.
- Register static paths before parameterized ones in the same router (`/calendar`, `/lists`, `/stats` before `/:id`).

**Data scoping**
- Every Prisma query is scoped to the authenticated user, `req.userId!`, which controllers pass to services as the first argument.
- Use `where: { id, userId }`. For child records such as subtasks, verify ownership of the parent first (`assertTaskOwner`).
- Never trust an id from the client or from the LLM without this check.

**Errors**
- Express 5 forwards rejected promises to the error handler, so handlers don't need `try/catch`.
- For expected failures, `throw notFound("X not found")` (or `new HttpError(status, msg)`) from a service. The response is `{ error: message }`.
- Unexpected errors become `500 { error: "Internal server error" }`. Prisma `P2025` (record not found) becomes `404 { error: "Not found" }`.
- A few endpoints intentionally keep their own `try/catch` and message:
  - users: "Failed to fetch profile" / "Failed to update profile"
  - assistant: 503 busy and "Failed to generate response"
- Error JSON shape is always `{ error: string }`. The assistant 503 response also includes `message` and `retryAfterSec`, which the frontend reads.

**Validation**
- Validation is done by hand in controllers, returning `400 { error }`. There is no schema library on the backend.

**Config and env**
- Read env vars only through `env` from `config/env.ts`. Add new variables there.

**Imports**
- Always use the `@/` alias, which maps to `neura-api/src/`, the same as the frontend. Relative imports (`./`, `../`) are not used anywhere, including inside the same module.
  Example: `import { prisma } from "@/lib/prisma"`, `import * as tasks from "@/modules/tasks/tasks.controller"`.
- How the alias is resolved:
  - **Type-check:** `paths` in `neura-api/tsconfig.json`.
  - **Dev:** `npm run dev` preloads `tsconfig-paths/register`.
  - **Build:** `npm run build` runs `tsc-alias` after `tsc`, which rewrites `@/` into relative paths inside `dist/`. Production (`node dist/index.js`) therefore needs no alias package at runtime.
- If you change the build or dev scripts, keep `tsc-alias` / `-r tsconfig-paths/register` in them. Without these, the server fails at startup with "Cannot find module '@/…'".

**Naming**
- Files are kebab-case with a role suffix: `focus-sessions.service.ts`, `require-auth.ts`.
- Controllers and services export named functions. Import them as namespaces (`import * as tasks from "./tasks.controller"`).

**Field names**
- The task endpoints accept snake_case `due_date` / `list_id`, which `toTaskData` in `tasks.service.ts` maps to `dueDate` / `listId`.
- Responses return Prisma's camelCase objects.

**Assistant tools**
- Tool schemas use Gemini-style `functionDeclarations` groups. `toGroqTools` in `lib/groq.ts` converts them to OpenAI/Groq format.
- To add a tool:
  1. Add the schema and a `case` in `execute*Tool`.
  2. If the tool changes data, add its name to `MUTATING_TOOLS` in `assistant.prompts.ts`.
  3. For habit tools, also add the name to `HABIT_TOOL_NAMES`.

**Dependencies and deploy (Render)**
- Render installs with production settings, so **devDependencies are not installed** during the build.
- Every package the build needs must be in `dependencies`: `typescript`, `tsc-alias`, `@types/express`, `@types/cors`, `@types/node`, and any new `@types/*` package.
- Only dev-only tools stay in `devDependencies`: `ts-node-dev`, `tsconfig-paths`.
- If a new import compiles locally but Render fails with `TS7016: Could not find a declaration file`, its `@types` package is in the wrong section.

**Verification**
- `npx tsc --noEmit` in `neura-api` must report 0 errors.
- The `build` script is `prisma generate && tsc && tsc-alias`. A type error fails the deploy, and Render keeps the previous version running.
- To reproduce Render locally, use a fresh copy:
  - Install with `NODE_ENV=production npm ci`.
  - Run `npm run build`. Prisma needs `DATABASE_URL` set, even to a dummy value.

### API (all prefixed with `/api`, all require auth except `/api/auth/*`)

| Base | Endpoints |
|---|---|
| `/auth/*` | Better Auth handler (sign-in, sign-up, session, sign-out) |
| `/tasks` | `GET /`, `POST /`, `GET /calendar`, `GET /:id`, `PUT /:id`, `PATCH /:id/toggle`, `DELETE /:id` |
| `/tasks` (subtasks) | `POST /:taskId/subtasks`, `PUT /:taskId/subtasks/:subtaskId`, `PATCH /:taskId/subtasks/:subtaskId/toggle`, `DELETE /:taskId/subtasks/:subtaskId` |
| `/tasks/lists` | `GET /`, `POST /`, `GET /:id`, `PUT /:id`, `DELETE /:id` |
| `/notes` | `GET /`, `POST /`, `GET /:id`, `PUT /:id`, `DELETE /:id` |
| `/habits` | `GET /?view=&date=`, `POST /`, `PATCH /:id`, `DELETE /:id`, `POST /:id/toggle` (body `{ date }`) |
| `/focus-sessions` | `GET /`, `GET /stats`, `POST /`, `PATCH /:id`, `DELETE /:id` |
| `/users` | `GET /me`, `PATCH /me` |
| `/assistant` | `POST /` with `{ mode, question, history, … }`; mode `daily_plan` powers the dashboard card |

`GET /health` (no `/api` prefix) returns `{ status: "ok" }`.

### Data model (Prisma)

- `User`
  - Fields: name, email, image, age, job, gender
  - Relations: sessions, accounts, tasks, taskLists, notes, focusSessions, habits
- Better Auth tables: `Session`, `Account`, `Verification`
- `TaskList`: name, color, description, userId. Has many tasks.
- `Task`
  - Fields: title, description, completed, completedAt, priority (`"low" | "medium" | "high"`, default `"medium"`), dueDate
  - Relations: userId, listId (optional; set to null when the list is deleted), subtasks
- `SubTask`: title, completed, taskId (cascade delete)
- `Note`: title, description (HTML from TipTap), color, userId
- `FocusSession`
  - Fields: name, description, tag (enum: `work`, `personal`, `study`, `break`, `other`), duration (actual focused seconds), startTime, endTime, userId
- `Habit`: title, color, startDate, durationDays (null means tracked forever), isArchived, userId. Has many entries.
- `HabitEntry`: date, habitId. Unique on `(habitId, date)`, so there is one completion per day.

All IDs are `cuid()` strings. Child rows are cascade-deleted with their user.

### AI assistant flow

1. The frontend `useAssistant` posts a request to `POST /api/assistant`. The body is `{ mode, question?, history?, references?, clientDate?, timeZone? }`, where `references` are the @mentioned items.
2. `assistant.service` builds the request text.
   - `mode` picks a canned instruction from `QUICK_INSTRUCTIONS`. If the mode is unknown, the free-text `question` is used instead.
   - The user prompt includes:
     - today's date
     - profile info
     - task and habit snapshots from `assistant.context.ts`
     - sanitized references
     - the last 6 chat turns
3. `lib/groq.ts` runs the tool-calling loop with `SYSTEM_PROMPT`. It rotates through a model pool when a model is rate-limited. When every model is busy it throws `AssistantBusyError`, and the controller answers `503` with a `Retry-After` header.
4. Tool calls run against Prisma through `tools/task.tools.ts` and `tools/habit.tools.ts`, always scoped to the user. Only data-changing actions (`MUTATING_TOOLS`) are returned to the client, which shows them as `ActionBadge`s.
5. The assistant replies in the user's language. Both Persian and English are supported. Mode `daily_plan` powers the dashboard card.
