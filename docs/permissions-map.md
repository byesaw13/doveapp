# Permissions Map

## Permission Definitions

### System/Admin Permissions

- `admin:access` - Minimum permission to access admin portal
- `admin:read` - Read access to admin-level data and analytics
- `admin:write` - Write access to admin-level configurations and settings

### Team Permissions

- `team:read` - View team members, schedules, and assignments
- `team:manage` - Create/edit/delete team schedules, assignments, and technician roles

### Jobs Permissions

- `jobs:read` - View job details and status
- `jobs:write` - Create and edit job information
- `jobs:assign` - Assign jobs to technicians and manage dispatching

### Clients Permissions

- `clients:read` - View client information and history
- `clients:write` - Create and edit client records

### Estimates Permissions

- `estimates:read` - View estimate details
- `estimates:write` - Create and edit estimates

### Invoices Permissions

- `invoices:read` - View invoice details and payment history
- `invoices:write` - Create and edit invoices

### Billing Permissions

- `billing:read` - View billing and payment information
- `billing:manage` - Process payments and manage billing settings

### Inbox Permissions

- `inbox:read` - View messages and conversations
- `inbox:write` - Send messages and manage conversations

### Settings Permissions

- `settings:read` - View system settings
- `settings:manage` - Modify system settings and configurations

## Role Permission Bundles

| Role       | Permissions                                                                                                                                                                                                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| Owner      | All permissions                                                                                                                                                                                                                                                      |
| Admin      | admin:access, admin:read, admin:write<br>team:read, team:manage<br>jobs:read, jobs:write, jobs:assign<br>clients:read, clients:write<br>estimates:read, estimates:write<br>invoices:read, invoices:write<br>inbox:read, inbox:write<br>settings:read<br>billing:read |
| Dispatcher | admin:access, admin:read<br>team:read<br>jobs:read, jobs:write, jobs:assign<br>clients:read<br>inbox:read, inbox:write                                                                                                                                               |
| Tech       | jobs:read, jobs:write<br>inbox:read, inbox:write                                                                                                                                                                                                                     |
| Customer   | jobs:read<br>estimates:read<br>invoices:read<br>inbox:read, inbox:write                                                                                                                                                                                              | </content> |

<parameter name="filePath">docs/permissions-map.md
