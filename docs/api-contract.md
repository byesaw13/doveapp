# API Contract Rules

This document outlines the standardized API contracts for the DoveApp backend.

## Response Formats

### Success Responses

All successful API responses follow this structure:

```json
{
  "data": <payload>,
  "meta": { ... }  // optional additional metadata
}
```

For list endpoints:

```json
{
  "data": [<items>],
  "page": 1,
  "pageSize": 20,
  "total": 123
}
```

### Error Responses

All error responses follow this structure:

```json
{
  "error": {
    "code": "string",
    "message": "human readable message"
  }
}
```

## HTTP Status Codes

- **200**: Success
- **201**: Created
- **400**: Bad Request (validation errors)
- **401**: Unauthorized (not authenticated)
- **403**: Forbidden (authenticated but insufficient permissions)
- **404**: Not Found (resource doesn't exist or access denied for privacy)
- **500**: Internal Server Error

## Authentication & Authorization

- All protected endpoints require valid JWT token
- Role-based access control enforced server-side
- Privacy-first: return 404 for resources user cannot access (not 403)

## List Endpoints

All list endpoints support:

- `page` (default: 1)
- `pageSize` (default: 20, max: 100)
- `sort` (field name, default: 'created_at')
- `dir` (asc|desc, default: 'desc')
- `q` (search query, optional)
- Additional filters per endpoint

## Mutation Endpoints

- Input validation using Zod schemas
- Return 400 for validation failures
- Idempotent where possible
- Audit logging for critical operations

## Rate Limiting

- Applied to mutation endpoints
- 100 requests per hour per user for mutations
- 1000 requests per hour for reads

## Pagination Rules

- Page numbers start at 1
- pageSize must be between 1-100
- total includes all matching records (before pagination)
- Empty results return `data: []`, `total: 0`

## Security

- All user inputs sanitized
- SQL injection prevented via parameterized queries
- CORS configured for allowed origins
- HTTPS required in production

## Versioning

- API version in URL path: `/api/v1/...`
- Breaking changes require new version
- Deprecation notices 6 months before removal
