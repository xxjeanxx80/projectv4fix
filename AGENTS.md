# AGENTS.md (Backend – NestJS Microservices)

## Tech Stack
- **Framework:** NestJS (TypeScript)
- **Database:** PostgreSQL via TypeORM
- **Messaging:** RabbitMQ (pub/sub)
- **Auth:** OAuth2 (Google/Facebook) → JWT
- **Runtime:** Node 20+ (Laragon compatible)

## Coding Conventions
- Keep module structure under `src/modules/*`
- Common shared logic under `src/common/*`
- Use DTOs for validation (class-validator, class-transformer)
- Entity names match SQL schema (e.g., `Users`, `Spas`, `Bookings`)
- Always export `Module`, `Controller`, and `Service` per feature folder

## Microservice Pattern
- Use NestJS microservices where applicable.
- Example: `BookingsService` publishes events → `PaymentsService` consumes.
- Queue naming: `{moduleName}.queue`
- Exchange type: `topic`

## Auth Rules
- JWT payload: `{ sub: user_id, email, role }`
- Roles: CUSTOMER, OWNER, ADMIN
- Guard: `@Roles()` + `RolesGuard` in `src/common/guards`
- Auth endpoints in `src/modules/auth/*`

## Testing
- Use Jest
- Command: `npm run test`
- Every service must have at least 1 test under `test/modules/<module>.spec.ts`

## Deployment
- Backend runs on `localhost:3000`
- Database: PostgreSQL (port 5432)
- Env example: `.env.example` should contain DB + JWT + RABBITMQ_URL

## PR Format
- `[Feature]`, `[Fix]`, `[Refactor]` prefix
- Include short “Testing Done:” section with commands executed

---

**Powered by:**  
Beauty Booking Hub Backend (NestJS + PostgreSQL + RabbitMQ)