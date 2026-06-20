# AI_CONTEXT.md — Multi-Branch Accounting & Analytics SaaS

> Read this file fully before generating or modifying any code in a new session.
> It is the single source of truth for conventions, decisions, and current state.

## 1. Project Overview
A production-grade, multi-tenant-by-branch accounting & analytics SaaS for
Uzbekistan-based businesses operating multiple physical branches. PART 1
delivered the foundation: authentication and RBAC. PART 2 adds the full
business domain: Products, Sales, Debts, Inventory, Expenses, and Analytics.

## 2. Tech Stack
- Next.js 15 (App Router) + TypeScript (strict, typedRoutes: true)
- TailwindCSS + Shadcn/UI + Poppins font (next/font/google)
- PostgreSQL + Prisma ORM 6
- JWT auth via `jose` (HS256), passwords via `bcryptjs`
- Validation via `zod`
- @tanstack/react-query v5 (data fetching, caching)
- Recharts (BarChart, AreaChart, PieChart)
- Docker + docker-compose for local/prod parity

## 3. Architectural Principles
Clean Architecture with strict dependency direction (outer to inner only):

```
app/api (Presentation/Controllers)
   --> application/services (Use cases)
         --> domain/repositories (Interfaces / contracts)
               ^
infrastructure/repositories (Prisma implementations) -- implements ---
```

- **Domain** (`src/domain`): repository interfaces + Prisma payload types only.
- **Application** (`src/application`): services (use cases) + DTOs. Never imports Prisma directly.
- **Infrastructure** (`src/infrastructure`): Prisma implementations, audit service, DI container.
- **Presentation** (`src/presentation` + `src/app/api`): zod validators, auth middleware, RBAC guards, route handlers.
- **Core** (`src/core`): cross-cutting config, constants, error classes, types.
- **Lib** (`src/lib`): low-level utilities (prisma client, jwt, password, token).

### Repository Pattern
Every persistence concern goes through an interface in `domain/repositories`,
implemented in `infrastructure/repositories`. Services never import `prisma`.

### Service Layer
All business rules live in `application/services`. Route handlers are thin:
authenticate -> validate (zod) -> call service -> audit -> respond.

## 4. Folder Structure
```
.
+-- prisma/
|   +-- schema.prisma          <- 17 models, 7 enums
|   +-- seed.ts
|   +-- migrations/
+-- src/
    +-- app/api/              <- Backend (do NOT modify)
    |   +-- health/
    |   +-- auth/{login,refresh,logout,me}/
    |   +-- users/, users/[id]/
    |   +-- branches/, branches/[id]/
    |   +-- products/, products/[id]/
    |   +-- products/categories/, products/categories/[id]/
    |   +-- sales/, sales/[id]/
    |   +-- debts/, debts/[id]/
    |   +-- debts/[id]/payments/
    |   +-- inventory/, inventory/[id]/
    |   +-- inventory/stock/
    |   +-- expenses/, expenses/[id]/
    |   +-- expenses/categories/, expenses/categories/[id]/
    |   +-- analytics/
    +-- app/(auth)/login/     <- Login page
    +-- app/(dashboard)/      <- All protected pages
    |   +-- page.tsx          <- Dashboard (branch & boss views)
    |   +-- products/         <- Product list + categories
    |   +-- sales/            <- Sales list + new sale form
    |   +-- debts/            <- Debt management + payments
    |   +-- inventory/incoming/  <- Stock incoming
    |   +-- inventory/outgoing/  <- Stock outgoing
    |   +-- expenses/         <- Expenses + categories
    |   +-- users/            <- User management
    |   +-- branches/         <- Branch management
    |   +-- settings/         <- Profile & security settings
    +-- components/ui/        <- UI primitives
    |   +-- button, card, badge, dialog, input, label, select
    |   +-- table, textarea, skeleton, separator, avatar
    |   +-- stat-card, empty-state, page-header
    +-- components/layout/    <- Sidebar, breadcrumbs
    +-- context/auth-context.tsx
    +-- hooks/                <- React Query hooks
    |   +-- use-analytics, use-products, use-sales, use-debts
    |   +-- use-inventory, use-expenses, use-users, use-branches
    +-- lib/api-client.ts     <- Production API client (ApiError, buildQuery)
    +-- lib/query-client.ts   <- React Query singleton
    +-- providers/query-provider.tsx
    +-- types/index.ts        <- All shared TypeScript types
    +-- core/{config,constants,errors,types}/
    +-- lib/{prisma,jwt,password,token,utils}.ts
    +-- domain/repositories/
    +-- infrastructure/{repositories,services}/, container.ts
    +-- application/{services,dto}/
    +-- presentation/{middleware,guards,validators}/
```

## 5. Conventions (MUST follow in future sessions)
- Path alias `@/*` -> `src/*`.
- API responses use the envelope `{ success: true, data }` or `{ success: false, error: { code, message, details? } }`.
- Throw typed errors from `src/core/errors/app-error.ts`; the `route()` wrapper translates them.
- Every route handler is wrapped with `route(...)` and declares `export const runtime = 'nodejs'`.
- New permissions go in `core/constants/permissions.ts`. Re-run the seed after changes.
- All persistence goes through a repository interface + Prisma impl wired in `infrastructure/container.ts`.
- Validate every request body/query with a zod schema in `presentation/validators`.
- Record meaningful state changes through `auditService.record(...)`.
- Decimal fields from Prisma: always call `.toNumber()` in DTOs before returning.

## 6. Authentication & RBAC Model
- Access token: short-lived JWT (900s), HS256. Contains `sub, email, roleType, branchId, sessionId, permissions`.
- Refresh token: opaque random 96-hex string; sha256 hash stored in DB.
- Three roles: `SUPER_ADMIN` (global), `BOSS` (branch-scoped with management perms), `EMPLOYEE` (branch-scoped, limited).
- `authorize(ctx, permission)` -- SUPER_ADMIN bypasses all checks.
- `assertBranchAccess(ctx, branchId)` -- BOSS/EMPLOYEE can only touch their branch.
- `branchScopeFilter(ctx)` -- returns undefined for global roles, ctx.branchId for scoped.

## 7. Domain Models (PART 2)

### Enums Added
- `PaymentType`: CASH_UZS | CASH_USD | ONLINE
- `OnlineReceiver`: ALI | BILOL
- `CurrencyType`: UZS | USD
- `InventoryMovementType`: INCOMING | OUTGOING
- `DebtStatus`: ACTIVE | PARTIAL | PAID

### Products
- `ProductCategory`: name + branch (unique per branch via @@unique([name, branchId]))
- `Product`: name, sku (unique per branch via @@unique([sku, branchId])), unit, costPrice, sellingPrice, stock (int, denormalized), isActive

### Sales
- `Sale`: saleNumber (auto-generated: `{BRANCH_CODE}-{YYYYMMDD}-{0001}`), paymentType, onlineReceiver (required when ONLINE), totalAmount, currency
- `SaleItem`: productId, quantity, unitPrice, totalPrice
- Creating a sale auto-decrements product stock. Deleting restores it.

### Debts
- `Debt`: linked 1:1 to a Sale. Tracks advancePaid, remainingAmount, status (ACTIVE/PARTIAL/PAID).
- `DebtPayment`: each collected payment auto-updates parent Debt's advancePaid/remainingAmount/status.

### Inventory
- `InventoryMovement`: INCOMING increases product.stock, OUTGOING decreases it.
- Stock is tracked on the `Product.stock` field (denormalized for fast reads).
- `GET /api/inventory/stock` returns current stock summary per product per branch.

### Expenses
- `ExpenseCategory`: name + branch (unique per branch)
- `Expense`: multi-currency (UZS/USD), paymentType, optional onlineReceiver, expenseDate

### Analytics (`GET /api/analytics`)
- Query params: `branchId`, `dateFrom`, `dateTo` (ISO datetime strings)
- Returns:
  - `sales`: totalCashUzs, totalCashUsd, totalOnline, totalAli, totalBilol, totalSales, salesCount
  - `debts`: totalDebt, totalRemaining, totalCollected, activeDebts, partialDebts, paidDebts
  - `inventoryTrends`: array of { date, incoming, outgoing, net }
  - `expenseTrends`: array of { categoryId, categoryName, totalUzs, totalUsd, count }

## 8. Branch Scoping Rules
- SUPER_ADMIN: `branchId = null` (global), unrestricted.
- BOSS / EMPLOYEE: must have a `branchId`; all reads/writes are auto-scoped.
- All PART 2 domain models (products, sales, debts, inventory, expenses) are branch-scoped.

## 9. Known Environment Constraints
- bcryptjs + Prisma require the Node.js runtime -- all API routes set `runtime = 'nodejs'`.
- Edge `middleware.ts` only checks token presence.
- Prisma `Decimal` fields MUST be converted via `.toNumber()` in DTOs -- never return raw Decimal objects.

## 10. Frontend Conventions (PART 3)
- All page components: `'use client'`, import types from `@/types`, use hooks from `@/hooks/`.
- `typedRoutes: true` is enabled → use `as never` for all dynamic Link hrefs and `router.push` calls.
- API client is `src/lib/api-client.ts`; `buildQuery(params: object)` builds query strings.
- Old `src/lib/api.ts` still exists for backward compatibility — new code uses `api-client.ts`.
- React Query keys: `['analytics', params]`, `['products', params]`, `['sales', params]`, etc.
- Recharts tooltip formatter: `(v) => formatUzs(Number(v ?? 0))` — not `(v: number)`.
- Auth context: `src/context/auth-context.tsx` — `useAuth()` gives `{ user, loading, login, logout }`.
- Admin credentials: `admin@accounting-saas.uz / admin123`; DB name: `accounting_saas`.

## 11. How to Continue (next sessions)
1. Read this file + `SYSTEM_HANDOFF.md`.
2. Run `npm install`, `npm run dev` (PostgreSQL via Homebrew already set up).
3. Login at http://localhost:3000/login with `admin@accounting-saas.uz / admin123`.
4. Pick a remaining task from `SYSTEM_HANDOFF.md` "Remaining Tasks".
5. Backend: Follow section 5 conventions. Frontend: Follow section 10 conventions.
