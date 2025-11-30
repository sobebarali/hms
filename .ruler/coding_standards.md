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
- Controller files: `{endpoint}.{domain}.controller.ts`
- Service files: `{endpoint}.{domain}.service.ts`
- Repository files: `{endpoint}.{domain}.repository.ts`
- Validation files: `{endpoint}.{domain}.validation.ts`
- Route files: `{domain}.routes.ts`
- Test files: `{scenario}.test.ts`

### Function Parameters
- Use object destructuring with inline types
- Pattern: `function create({ name, age }: { name: string; age: number })`

### Code Style
- Tabs for indentation (Biome config)
- Double quotes for strings
- Always use semicolons
- Keep functions small and focused
- Prefer early returns over nested conditions
- Use async/await over raw promises

### Shared Utilities
- Crypto utilities: `@/utils/crypto` - `hashPassword`, `comparePassword`, `generateTemporaryPassword`
- Constants: `@/constants` - auth, cache, http, rbac
- Errors: `@/errors` - typed error classes

## API Conventions

### REST Principles
- HTTP methods: GET (retrieve), POST (create), PATCH (update), DELETE (remove)
- Use plural nouns: `/patients`, `/appointments`
- Path parameters for IDs, query parameters for filters
- Status codes: 200, 201, 400, 401, 403, 404, 409

### Request/Response
- JSON with camelCase fields
- ISO 8601 for dates
- Pagination: `{ data: [], pagination: { page, limit, total } }`
- Validate all inputs at API boundary
- Never expose internal errors or stack traces

### Multi-Tenant Context
- Extract `tenantId` from JWT only (never from request params)
- Include tenant ID in all database queries
- Use tenant-scoped cache keys: `tenant:{id}:resource:{id}`

### Error Handling
- Use typed error classes from `@/errors`
- HTTP Errors: `BadRequestError`, `NotFoundError`, `ConflictError`, `ValidationError`, `InternalError`, `RateLimitError`, `ServiceUnavailableError`
- Auth Errors: `UnauthorizedError`, `ForbiddenError`, `InvalidCredentialsError`, `InvalidTokenError`, `SessionExpiredError`, `AccountLockedError`, `TenantInactiveError`, `PasswordExpiredError`, `InvalidGrantError`
- Pattern: `throw new NotFoundError("USER_NOT_FOUND", "User not found")`
- Never throw plain objects

## Media Assets

### Images
- Use Unsplash with optimization: `?w={width}&q=80`
- Always include descriptive `alt` text
- Use `loading="lazy"` for below-the-fold images

### Icons
- Use Lucide React: `import { IconName } from "lucide-react"`
- Consistent sizing: `className="h-5 w-5"` or `size={20}`

## TanStack Router Conventions

### Route Structure
- Layout route (`{section}.tsx`): Renders shared layout with `<Outlet />`
- Index route (`{section}/index.tsx`): Default content at section root
- Child routes (`{section}/{page}.tsx`): Individual pages inside layout
- Dynamic routes: `$param.tsx` for `/section/:param`

### Key Rules
- Layout routes render `<Outlet />` for child content
- Child routes render content only - NO layout wrapper
- Auth checks in parent layout's `beforeLoad` - children inherit automatically
- Use `redirect({ to: "/login" })` for unauthenticated users

### Route Naming
- Use kebab-case: `forgot-password.tsx`, `reset-password.tsx`
- Use `index.tsx` for default/list pages
- Use descriptive names: `add.tsx` instead of `new.tsx`
