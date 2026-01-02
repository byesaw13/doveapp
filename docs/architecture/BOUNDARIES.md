# Architecture Boundaries

## Canonical Entry Points (Import This)

- Client UI: `import { supabase } from "@/lib/supabase.ts"`
  - This is the canonical client-only Supabase singleton.
- Server: `import { createServerClient } from "@/lib/supabase/server"`
  - Server Components and server-only helpers.
- Server sessions: `import { getServerSessionOrNull } from "@/lib/auth/session"`
- Server guards: `import { requireRoleServer } from "@/lib/auth/requireRole.server"`

## Prohibited Imports (Do Not)

Server code must not import client-only modules (`"use client"`):

- `lib/supabase.ts`
- `lib/auth/context.ts`
- `lib/supabase/browser.ts`
- `lib/supabase/client.ts`
- `lib/supabase/index.ts` (client-only compatibility barrel; deprecated)

## Server-Only vs Client-Only Rules

- `"use client"` appears at the top of client-only modules and UI components.
  Those files must not be imported by Server Components, route handlers, or
  server utilities.
- `createBrowserClient` exists only in client modules.
- `createServerClient` is used only in server modules.
- Use `lib/supabase/server.ts` for server-only Supabase access.

## Enforcement

- `npm run check:boundaries` is mandatory.
- `scripts/check-boundaries.mjs` enforces client/server import rules and blocks
  accidental boundary violations.

## Common mistakes

- Importing `supabase` from `lib/supabase.ts` in server routes like `app/api/*`
  instead of `lib/supabase/server.ts`.
- Using the client-only barrel `lib/supabase/index.ts` for new server code.
- Calling `getAuthContext` from `lib/auth/context.ts` inside Server Components.
- Using `requireRole` from `lib/auth/requireRole.ts` in server layouts instead of
  `lib/auth/requireRole.server.ts`.
- Mixing `createBrowserClient` from `lib/supabase/browser.ts` into server code.
