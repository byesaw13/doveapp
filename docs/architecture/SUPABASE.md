# Supabase Client Usage Guidelines

## Client Types

- **Server Client** (`lib/supabase/server`): For server components and API routes that need user authentication. Uses cookies to maintain session.
- **Browser Client** (`lib/supabase/browser`): For client components. Handles auth state in browser.
- **Admin Client** (`lib/supabase/admin`): For privileged server operations that bypass RLS. Includes runtime guard to prevent browser usage.

## When to Use Each

- Use **server client** in server components, API routes for user-specific data
- Use **browser client** in client components for real-time features
- Use **admin client** in API routes for admin operations, webhooks, migrations

## Security Rules

- Never import admin client into client components (runtime guard prevents this)
- Admin client requires SUPABASE_SERVICE_ROLE_KEY environment variable
- Server client respects RLS and user permissions
- Browser client respects RLS and user permissions

## Database Access Locations

Per BOUNDARIES.md:

- Supabase reads/writes should live in features/_/(queries|commands).ts OR lib/db/_
- Use appropriate client based on context (server for SSR, admin for privileged ops)
