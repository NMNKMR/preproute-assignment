# PrepRoute — Test Management

A 5-page test-management application for creating, editing, and publishing MCQ tests.
Built with **React + TypeScript + Vite**, integrated with the PrepRoute REST API.

> Application flow: **Login → Dashboard (test list) → Create/Edit Test → Add Questions → Preview & Publish**

---

## Quick start

> **Prerequisite:** Node **20.19+ or 22+** (required by Vite 8 / React 19).

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env        # already points at the staging API

# 3. Run the dev server
npm run dev                 # http://localhost:5173

# 4. (only for E2E) install the Playwright browser
npx playwright install chromium
```

**Test credentials:** `vedant-admin` / `vedant123`

### Scripts

| Command            | Description                                  |
| ------------------ | -------------------------------------------- |
| `npm run dev`      | Start the Vite dev server (with API proxy)   |
| `npm run build`    | Type-check and build for production          |
| `npm run preview`  | Preview the production build                 |
| `npm run typecheck`| Type-check without emitting                  |
| `npm test`         | Run unit/component tests (Vitest)            |
| `npm run test:watch`| Vitest in watch mode                        |
| `npm run test:ui`  | Vitest interactive UI                        |
| `npm run e2e`      | Run Playwright end-to-end tests              |
| `npm run lint`     | Run ESLint                                   |

---

## Tech stack

- **React 19 + TypeScript + Vite**
- **React Router** — routing & the Create → Questions → Preview wizard (test id carried in the URL)
- **TanStack Query** — server state, caching, cache invalidation
- **React Hook Form + Zod** — forms and validation
- **Tailwind CSS v4** — styling (brand tokens in `src/index.css`)
- **react-quill-new** — rich-text question editor (React 19-compatible Quill build)
- **Axios** — HTTP client with a JWT interceptor and response-envelope unwrapping
- **Vitest + Testing Library + MSW** — unit/component tests with a mocked API
- **Playwright** — end-to-end tests against the real backend

---

## Features

**Auth**
- User ID / password login with validation, JWT stored in localStorage, password show/hide toggle
- Protected routes + session restore on refresh; 401s clear the session and redirect

**Dashboard**
- Test list with search, status filter, and type filter
- Pagination with selectable page size; view / edit / delete (with confirm dialog)
- Filtering & pagination live in the data hook, so moving to a server-paginated API later
  needs no page changes

**Create / Edit Test**
- Test-type tabs (Chapter Wise / PYQ / Mock), cascading **subject → topics → sub-topics**
  (multi-select), marking-scheme steppers, difficulty, duration, totals
- Save as Draft or continue to questions; full edit-mode hydration (API names mapped back to UUIDs)

**Add Questions**
- Rich-text question editor, four options with a correct answer, per-question difficulty/topic/sub-topic
- Collapsible question rail; **Next** to add/navigate locally, **Save & Publish** to persist
- **Edit existing questions** (loads saved questions; create/update/delete diff on save)
- **CSV bulk import** (see format below), clear-field / clear-all-edits, capped to the configured count

**Preview & Publish**
- One-question-at-a-time preview with rail + arrow navigation
- **Publish Now** or **Schedule Publish** with a **Live Until** expiry, current status/date display
- Publish gated until the added question count equals the configured total

**Cross-cutting** — fully responsive (mobile drawer nav), toasts, loading / empty / error states,
custom Select / MultiSelect / DateTime / Pagination primitives, and a unit + E2E test suite.

### CSV import format

Header row required (case-insensitive, any order). **Required:** `question`, `option1`–`option4`,
`correct_option`. **Optional:** `explanation`, `difficulty`, `topic`, `sub_topic`, `media_url`.
`correct_option` accepts `1`–`4`, `A`–`D`, or `option1`–`option4`; `difficulty` is `easy` /
`medium` / `difficult` (`hard` → difficult). A ready template is at
[`public/sample-questions.csv`](public/sample-questions.csv) (downloadable via the **sample** link
next to the CSV button).

```csv
question,option1,option2,option3,option4,correct_option,explanation,difficulty,topic,sub_topic
"What is 2 + 2?",3,4,5,6,2,"Basic addition.",easy,Dice,Games
"Capital of France?",Berlin,Madrid,Paris,Rome,C,,medium,,
```

---

## Architecture

```
src/
  pages/                  one folder per route screen; the screen lives in
                          index.tsx, screen-only sub-components in components/
    Login/                Login
    Dashboard/            Dashboard + components/TestTable
    CreateEditTest/       CreateEditTest
    AddQuestions/         AddQuestions + components/ClearButton
    PreviewPublish/       PreviewPublish + components/QuestionPreview
    NotFound/             NotFound
  components/             app-wide shared UI — layout shell, Breadcrumb, Logo, ui/ primitives
  features/
    auth/                 AuthContext, ProtectedRoute, token storage, login api & schema
    tests/                tests domain logic — api, React Query hooks, schemas,
                          pure helpers (filter/csv/publish/question), components/
  api/                    axios client (JWT + envelope unwrap), shared API types
  lib/                    env, query client, formatters, cn, rich-text helper

tests/                    all unit/component tests, clubbed together
  unit/                   *.test.ts(x) — one file per page / module
  mocks/                  MSW handlers, server, fixtures
  utils/                  renderWithProviders helper
  setup.ts                Vitest global setup
e2e/                      Playwright end-to-end specs
```

> **Where to look:** every screen lives in `src/pages/<Screen>/index.tsx`, with its
> own `components/` for screen-only pieces. Cross-cutting logic lives in
> `src/features/auth` and `src/features/tests` (shared feature components under
> their `components/`). All tests are under `tests/` and `e2e/`.

### Key decisions

- **Response envelope:** the API wraps every payload in `{ status, message, data }`
  (not the `{ success: true }` shown in the brief). A single `unwrap()` helper keys off
  `status` and throws a typed `ApiError` otherwise.
- **Wizard via URL:** the test `id` lives in the route (`/tests/:id/questions`,
  `/tests/:id/preview`) so a refresh never loses progress.
- **Name ↔ UUID mapping:** `GET /tests` returns topics/subjects as **names**, while
  create/question endpoints expect **UUIDs**. Edit-mode hydration and question creation
  map between the two.
- **Status lifecycle:** `draft` on create/save → `live` only on publish. Saving questions
  never changes status, and editing a live test never downgrades it.
- **Configured totals are preserved:** saving questions updates only the `questions` list;
  `total_questions` / `total_marks` stay as configured. Publishing is gated in Preview until
  the number of added questions equals the configured total.

---

## API & CORS note

The staging API **does not allow CORS from `localhost`**. In development the app calls a
relative `/api` path that Vite proxies to the backend server-side
(`VITE_API_PROXY_TARGET` in `.env`, configured in `vite.config.ts`) — so there is no
cross-origin browser request.

For a **production deployment**, set `VITE_API_BASE_URL` to the full API URL and ensure the
backend allow-lists your deployed origin (or serve the app behind a host rewrite to `/api`).

### Deploying on Vercel

The staging API does not allow CORS from arbitrary origins, so the browser cannot call it
directly from `*.vercel.app`. Instead we keep all requests **same-origin** and let Vercel
proxy them to the backend server-side — exactly mirroring the Vite dev proxy.

`vercel.json` (JSON, so the rationale lives here rather than inline) does two things:

- `/api/:path*` → forwards to the Railway backend, so the browser only ever talks to the
  Vercel origin and never triggers a cross-origin request (no CORS).
- `/(.*)` → `/index.html` is the SPA fallback, so client-side routes such as
  `/tests/:id/preview` resolve on a hard refresh instead of 404-ing.

Required Vercel **Environment Variable** (set before the build, since Vite inlines `VITE_*`
at build time):

| Variable             | Value  | Notes                                                        |
| -------------------- | ------ | ----------------------------------------------------------- |
| `VITE_API_BASE_URL`  | `/api` | Requests stay same-origin and hit the `vercel.json` rewrite |

`VITE_API_PROXY_TARGET` is **not** needed in production — it only drives the dev-server proxy
in `vite.config.ts`.

---

## Testing

- **Unit/component (`npm test`):** validation, the subject→topic→sub-topic cascade,
  dashboard filtering/delete, question-draft logic, publish-schedule math, and each page's
  core interactions — all against a mocked API (MSW), so they run offline and fast.
- **End-to-end (`npm run e2e`):** real-backend flows — login/auth guards and the full
  **create test → add a question → publish** happy path.

---

## Notes / scope

- The **Dashboard** visual is built in the shared house style; it can be refined to a
  Figma mockup when provided.
- **Schedule Publish** and **Live Until** are wired to the API's `scheduled_date` /
  `expiry_date` fields.
