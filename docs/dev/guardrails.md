# Development Guardrails

## Supabase Client Boundaries

To prevent mixing server and browser Supabase clients, which can cause runtime errors and security issues:

### Rules

- **Browser clients** (createBrowserClient) must live in client-only modules marked with `"use client"`
- **Server clients** (createServerClient) must live in server-only modules with `import "server-only"`
- Never import browser clients in server code or vice versa

### Enforcement

Run `npm run check:boundaries` to verify no boundary violations exist. This script:

- Scans `lib/` and `app/` for boundary violations
- Fails if server-only files import browser clients
- Fails if non-client lib files use browser clients
- Provides actionable error messages with file paths and offending lines

### Correct Usage

```typescript
// Client-side (in components)
'use client';
import { createBrowserClient } from '@/lib/supabase/browser';

// Server-side (in Server Components)
import 'server-only';
import { createServerClient } from '@/lib/supabase/server';
```

Run the boundary check regularly, especially before commits.
