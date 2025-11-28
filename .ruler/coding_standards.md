# Coding Standards

## TypeScript Conventions

### Type Safety
- Leverage TypeScript fully - avoid `any` type
- Define explicit types for function parameters and return values
- Use const objects for enums: `export const Status = { ACTIVE: "ACTIVE" } as const`
- Never use type assertions unless well-documented

### File Naming
- Use kebab-case: `patient-service.ts`, `auth-controller.ts`
- Model files: `{entity}.model.ts`
- Service files: `{entity}.service.ts`
- Test files: `{scenario}.test.ts`

### Function Parameters
- Use object destructuring with inline types for parameters
- Avoid separate interfaces for single-function parameters
- Pattern: `function create({ name, age }: { name: string; age: number })`
- Destructure parameters directly in function signature

### Code Style
- Use tabs for indentation (Biome config)
- Use double quotes for strings
- Always use semicolons
- Keep functions small and focused
- Prefer early returns over nested conditions
- Use async/await over raw promises

## API Conventions

### REST Principles
- Use proper HTTP methods: GET (retrieve), POST (create), PATCH (update), DELETE (remove)
- Use plural nouns for resources: `/patients`, `/appointments`
- Path parameters for IDs, query parameters for filters
- Return appropriate status codes: 200 (OK), 201 (Created), 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found), 409 (Conflict)

### Request/Response
- Accept and return JSON with camelCase fields
- Use ISO 8601 for dates
- Include pagination metadata for lists: `{ data: [], pagination: { page, limit, total } }`
- Validate all inputs at API boundary
- Never expose internal errors or stack traces

### Authentication & Authorization
- Require JWT tokens in Authorization header
- Extract tenant ID from JWT automatically
- Check RBAC permissions on all protected endpoints
- Return 401 for missing/invalid auth, 403 for insufficient permissions
- Scope all queries to authenticated tenant

### Multi-Tenant Context
- Extract `tenantId` from JWT token only (never from request params)
- Include tenant ID in all database queries
- Prevent cross-tenant data access at all layers
- Use tenant-scoped cache keys

### Error Responses
- Use consistent error format with error codes
- Provide clear, actionable error messages
- Include field-level validation errors
- Log detailed errors server-side only
