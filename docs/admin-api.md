# Admin User Management API

## Overview

Create API endpoints for admin operations to manage users, accounts, and permissions programmatically.

## Endpoints Needed

### User Management

- `POST /api/admin/users` - Create new user
- `GET /api/admin/users` - List all users
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user
- `POST /api/admin/users/:id/invite` - Send invitation email

### Account Management

- `POST /api/admin/accounts` - Create new account (tenant)
- `GET /api/admin/accounts` - List all accounts
- `PUT /api/admin/accounts/:id` - Update account settings
- `POST /api/admin/accounts/:id/members` - Add user to account

### Role Management

- `PUT /api/admin/users/:id/role` - Change user role
- `GET /api/admin/roles` - List available roles and permissions

## Implementation

```typescript
// lib/api/admin/users.ts
export async function createUser(data: {
  email: string;
  full_name: string;
  role: UserRole;
  account_id: string;
}) {
  // Create auth user
  const { data: authUser } = await supabase.auth.admin.createUser({
    email: data.email,
    password: generateSecurePassword(),
    email_confirm: true,
  });

  // Create user profile
  await supabase.from('users').insert({
    id: authUser.user.id,
    email: data.email,
    full_name: data.full_name,
  });

  // Create account membership
  await supabase.from('account_memberships').insert({
    account_id: data.account_id,
    user_id: authUser.user.id,
    role: data.role,
    is_active: true,
  });

  // Send welcome email
  await sendWelcomeEmail(data.email, data.full_name);

  return authUser.user;
}
```
