# Architecture & Security

## Monorepo Structure

### Workspace Organization
- Turborepo with npm workspaces
- `apps/`: web (React + TanStack Router), server (Express), docs (Astro)
- `packages/`: auth, db, config
- Each workspace has own package.json
- Shared deps in root package.json

### Application Layers
- **Controller**: HTTP request handling
- **Service**: Business logic
- **Repository**: Data access
- **Model**: Mongoose schemas
- Keep layers loosely coupled

### Module Structure
- Domain directory: `apps/server/src/apis/{domain}/`
- One file per endpoint per layer
- Shared repository for reusable lookups: `shared.{domain}.repository.ts`

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
- RBAC: Role-based with permission format `RESOURCE:ACTION`
- ABAC: Attribute-based for fine-grained control
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
