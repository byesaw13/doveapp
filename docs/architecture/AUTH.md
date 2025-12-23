# Authentication Architecture

## Role Casing

Canonical role values in database: 'OWNER', 'ADMIN', 'TECH' (uppercase strings)

Application code uses uppercase consistently.

Customer portal users without account membership are assigned synthetic role 'CUSTOMER'.

## Redirect Behavior

- Unauthenticated users: redirect to /auth/login

- Authenticated but insufficient role: redirect to /auth/login

This is consistent with existing app behavior.

## Portal Homes

- Admin: /admin/dashboard

- Tech: /tech/today

- Customer: /(portal)/portal/home

## Known Tech Debt

- Customer role is synthetic and not stored in DB

- Future: redirect wrong-role users to their appropriate portal home instead of login
