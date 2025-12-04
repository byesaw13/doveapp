DoveApp Agent Guide – quick reference.

1. `npm run dev` – Next.js dev server on :3000.
2. `npm run build` – Production build with type checks.
3. `npm run lint` / `npm run lint:fix` – ESLint repo-wide.
4. `npm run format` / `format:check` – Prettier + ESLint enforce single quotes, 2 spaces, 80 cols; do not disable rules.
5. `npm run type-check` – Standalone `tsc --noEmit`.
6. `npm run test` – Jest suite with setup in `jest.config.js`.
7. `npm run test -- --runTestsByPath __tests__/clients.test.ts` – run one test file.
8. `npm run test:watch` – Focused watch mode.
9. No Cursor or Copilot rule files exist; follow this guide.
10. Prefer `@/` alias imports; use relative paths only for siblings.
11. Keep side-effect imports above value imports; group and space logically.
12. Components/types PascalCase, vars/functions camelCase, enums PascalCase, constants SCREAMING_SNAKE.
13. Define shared interfaces in `types/` and re-export where helpful.
14. Exported functions/components need explicit return types and prop interfaces.
15. React server components live in `app/`, client components need `'use client'`; utilities belong under `lib/`.
16. Handle Supabase/external client calls with explicit error checks and informative throws/logs.
17. Async workflows should return structured `{ data, error }` objects and never swallow failures.
18. Environment secrets live in `.env.local` copied from `.env.local.example`; never commit secrets.
19. Before PRs, run lint, type-check, and targeted tests; document flaky suites in PR.
20. Database migrations in `supabase/migrations/`; run via Supabase SQL Editor. See `FIX_ESTIMATES_ERROR.md` for common issues.
