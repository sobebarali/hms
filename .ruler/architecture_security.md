# Architecture & Security

## Monorepo Structure

### Workspace Organization
- Turborepo with npm workspaces
- `apps/` - web (React + TanStack Router), server (Express), docs (Astro)
- `packages/` - auth, db, config
- Each workspace has own package.json
- Shared deps in root package.json

### Application Layers
- **Controller** - HTTP request handling
- **Service** - Business logic
- **Repository** - Data access
- **Model** - Mongoose schemas
- Keep layers loosely coupled

### Module Structure (Per Domain)

Each API domain is organized with **one file per endpoint per layer** for maximum modularity and scalability.

**Directory Structure:**
```
apps/server/src/apis/{domain}/
├── controllers/{endpoint}.{domain}.controller.ts
├── services/{endpoint}.{domain}.service.ts
├── repositories/{endpoint}.{domain}.repository.ts
├── validations/{endpoint}.{domain}.validation.ts
├── middlewares/{domain}.middleware.ts
└── {domain}.routes.ts
```

**Layer Responsibilities:**
- **Routes** (`{domain}.routes.ts`) - Endpoint definitions, middleware registration, route composition
- **Validations** (`{endpoint}.{domain}.validation.ts`) - Zod schemas for request validation, Input types (inferred from Zod), Output types (manually defined interfaces)
- **Controllers** (`{endpoint}.{domain}.controller.ts`) - HTTP handling, request extraction, response formatting
- **Services** (`{endpoint}.{domain}.service.ts`) - Business logic, orchestration, transaction management
- **Repositories** (`{endpoint}.{domain}.repository.ts`) - Database queries, model operations
- **Middlewares** (`{domain}.middleware.ts`) - Domain-specific middleware shared across endpoints

**File Naming Convention:**
- Controllers: `{endpoint}.{domain}.controller.ts` (e.g., `register.patients.controller.ts`)
- Services: `{endpoint}.{domain}.service.ts` (e.g., `register.patients.service.ts`)
- Repositories: `{endpoint}.{domain}.repository.ts` (e.g., `register.patients.repository.ts`)
- Validations: `{endpoint}.{domain}.validation.ts` (e.g., `register.patients.validation.ts`)
- Middlewares: `{domain}.middleware.ts` (e.g., `patients.middleware.ts`)
- Routes: `{domain}.routes.ts` (e.g., `patients.routes.ts`)

**Benefits:**
- Clear separation of concerns per endpoint
- Easy to locate and modify endpoint-specific logic
- Scalable for large domains with many endpoints
- Enables parallel development on different endpoints
- Simplifies testing and maintenance
- Reduces merge conflicts in team environments
- Zod as single source of truth for input types ensures validation and types are always in sync

### Shared Repositories

For reusable database lookup functions used across multiple endpoints or domains, create shared repository files.

**Directory Structure with Shared Repositories:**
```
apps/server/src/apis/{domain}/
├── controllers/{endpoint}.{domain}.controller.ts
├── services/{endpoint}.{domain}.service.ts
├── repositories/
│   ├── {endpoint}.{domain}.repository.ts    # Endpoint-specific operations
│   └── shared.{domain}.repository.ts        # Reusable lookup functions
├── validations/{endpoint}.{domain}.validation.ts
├── middlewares/{domain}.middleware.ts
└── {domain}.routes.ts
```

**Shared Repository Guidelines:**
- File naming: `shared.{domain}.repository.ts`
- Contains reusable lookup functions (e.g., `findById`, `findByEmail`)
- Services import directly from shared repositories
- Endpoint repositories contain only endpoint-specific operations
- Never re-export shared functions from endpoint repositories

**Example - users domain:**
```
repositories/
├── create.users.repository.ts      # createUser only
├── update.users.repository.ts      # updateStaff only
├── deactivate.users.repository.ts  # deactivateStaff only
└── shared.users.repository.ts      # findStaffById, findUserByEmail, getRolesByIds, etc.
```

**Cross-Domain Imports:**
Services can import shared functions from other domains:
```typescript
// In users service
import { findHospitalById } from "../../hospital/repositories/shared.hospital.repository";
import { findStaffById } from "../repositories/shared.users.repository";
```

**Existing Shared Repositories:**
- `shared.users.repository.ts` - Staff, User, Department, Role lookups, session invalidation
- `shared.hospital.repository.ts` - Hospital lookups by ID, license, admin email
- `shared.auth.repository.ts` - Session CRUD operations

## Multi-Tenant Architecture

### Schema-Per-Tenant Isolation
- Each tenant has isolated database schema
- Tenant ID in all models
- All queries scoped to tenant automatically
- Middleware extracts tenant from JWT
- Prevent cross-tenant access at all layers

### Authentication Flow
- Better-Auth with JWT tokens
- Access token: 1 hour expiry
- Refresh token: 7 days expiry
- Token claims: userId, tenantId, roles, permissions
- Validate on every request

### Authorization (RBAC + ABAC)
- **RBAC**: Role-based with permission format `RESOURCE:ACTION`
- **ABAC**: Attribute-based for fine-grained control
- Check permissions in middleware after auth
- Deny by default, allow only when explicitly permitted
- Cache permission checks with short TTL

### Roles Hierarchy
- SUPER_ADMIN → HOSPITAL_ADMIN → DOCTOR/NURSE/PHARMACIST → RECEPTIONIST

## Security Essentials

### Authentication Security
- Hash passwords with bcrypt/argon2
- Minimum 8 chars with uppercase, lowercase, number, special char
- Lock account after 5 failed login attempts
- Revoke tokens on logout
- Log all auth attempts

### Input Validation
- Validate all inputs at API boundary
- Use Zod for request validation
- Reject unknown fields
- Sanitize inputs to prevent injection
- Never trust client data

### Data Protection
- Encrypt sensitive data at rest
- Use HTTPS for all communications
- Never log passwords or tokens
- Redact sensitive data in logs
- Mask PII in API responses
- Follow HIPAA and GDPR requirements

### API Security
- Rate limiting on all endpoints
- CORS configured restrictively
- Request size limiting
- CSRF protection for mutations
- Secure session management

### Secrets Management
- Never commit secrets to version control
- Use environment variables
- Rotate secrets regularly
- Different secrets per environment

### Tenant Security
- Validate tenant is active before processing
- Monitor per-tenant resource usage
- Implement tenant-level rate limiting
- Audit cross-tenant access attempts

## Performance & Scalability

### Caching Strategy
- Redis for distributed caching
- Cache sessions, tokens, lookup data
- Tenant-specific namespacing: `tenant:{id}:*`
- Invalidate on mutations
- Set appropriate TTL

### Database Performance
- Use indexes for query fields
- Implement pagination
- Avoid N+1 queries
- Use connection pooling
- Monitor slow queries

### Horizontal Scaling
- Stateless API servers
- Load balancing
- Shared Redis cache
- MongoDB Atlas auto-scaling
