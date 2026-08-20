# HalaCoach Admin

Next.js operations console for HalaCoach. All modules **M0–M14** are implemented against a typed mock API until `halacoach-apis` exists.

## Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS
- Mock API adapter in `src/api/` (see [API_CONTRACT.md](./API_CONTRACT.md))

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

If dev cache misbehaves after a production build:

```bash
npm run dev:reset
```

### Demo accounts

| Role | Email | Password |
|---|---|---|
| Super admin | `admin@halacoach.local` | `Admin123!` |
| Reviewer | `reviewer@halacoach.local` | `Review123!` |
| Support | `support@halacoach.local` | `Support123!` |

Role-based nav: reviewers see verification + professionals; support sees clients, credits, support inbox, and messages (read-only).

## Modules (complete)

| # | Module | Route |
|---|---|---|
| M0 | Foundation | shell, routing, mock client |
| M1 | Auth & admins | `/login`, `/admins` |
| M2 | Settings & lookups | `/settings` |
| M3 | Services catalog | `/services` |
| M4 | Professionals | `/professionals` |
| M5 | Verification | `/verification` |
| M6 | Clients | `/clients` |
| M7 | Leads | `/leads` |
| M8 | Quote requests | `/requests` |
| M9 | Credits | `/credits` |
| M10 | Legal content | `/content` |
| M11 | Support inbox | `/support` |
| M12 | Messages (read-only) | `/messages` |
| M13 | Dashboard | `/` |
| M14 | Polish & API handoff | [API_CONTRACT.md](./API_CONTRACT.md) |

## Connect real API

When `halacoach-apis` is ready:

1. Set `NEXT_PUBLIC_API_BASE_URL` to the admin API base (e.g. `https://api.example.com/api/admin`)
2. Implement routes in [API_CONTRACT.md](./API_CONTRACT.md) — admin UI stays unchanged

## Project layout

```
src/
  api/           Mock store, seeds, client, types
  app/(admin)/   Pages per module
  components/    Screen components + shared UI
  lib/           Permissions, nav, domain utils
```
