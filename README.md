# MediCore HMS

MediCore is a hospital and clinic management system for patient records, appointments, admissions, pharmacy and inventory, laboratory, radiology, billing and finance, HR, and reporting. This repository currently contains a Next.js prototype of the module screens backed by local mock data; the target architecture, data model, security rules and roadmap are documented under `docs/`.

## Tech stack

- Next.js 16 (App Router) and React 19
- TypeScript (strict)
- Tailwind CSS v4 with shadcn/ui components built on Radix UI
- Zustand for client state, TanStack Query for server state
- Zod for validation, React Hook Form for forms
- Prisma with SQLite for local development (Supabase/Postgres is the target database)
- Framer Motion for UI motion

## Run locally

```bash
npm install
cp .env.example .env
npm run db:generate
npm run db:push
npm run dev
```

The app runs at http://localhost:3000. Other scripts: `npm run build`, `npm run start`, `npm run lint`.

## Documentation

- [AGENTS.md](AGENTS.md)
- [docs/SCOPE.md](docs/SCOPE.md)
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- [docs/DATABASE.md](docs/DATABASE.md)
- [docs/SECURITY.md](docs/SECURITY.md)
- [docs/MULTI_TENANCY.md](docs/MULTI_TENANCY.md)
- [docs/RBAC.md](docs/RBAC.md)
- [docs/CODING_STANDARDS.md](docs/CODING_STANDARDS.md)
- [docs/UI_GUIDELINES.md](docs/UI_GUIDELINES.md)
- [docs/TESTING.md](docs/TESTING.md)
- [docs/GIT_WORKFLOW.md](docs/GIT_WORKFLOW.md)
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)
- [docs/ROADMAP.md](docs/ROADMAP.md)
- [docs/audit/2026-11-14-project-audit.md](docs/audit/2026-11-14-project-audit.md)
- [docs/archive/errors.md](docs/archive/errors.md)
