# SYSTEM_HANDOFF.md — PART 2 Delivery

## Architecture Summary
Clean Architecture + Repository Pattern + Service Layer on Next.js 15 App Router.
Dependency flow points inward; Prisma isolated behind repository interfaces;
business rules and RBAC in the service layer; route handlers are thin controllers.
See `AI_CONTEXT.md` for full rationale.

## Database Design

### All Models
| Model              | Purpose                                                         |
|--------------------|-----------------------------------------------------------------|
| User               | System accounts; belong to one Role and optionally one Branch.  |
| Branch             | Physical location / tenant unit.                                |
| Role               | System role (SUPER_ADMIN / BOSS / EMPLOYEE).                    |
| Permission         | `resource:action` capability.                                   |
| RolePermission     | Join table (Role <-> Permission).                               |
| Session            | Login session; groups refresh tokens; revocable.               |
| RefreshToken       | Hashed, rotating refresh token bound to a Session.             |
| AuditLog           | Immutable record of meaningful actions.                         |
| Notification       | Per-user in-app notifications.                                  |
| ProductCategory    | Category for products, scoped to a branch.                      |
| Product            | Branch-scoped product with stock tracking.                      |
| Sale               | A completed sale with items, payment type, optional debt.       |
| SaleItem           | Line item within a Sale.                                        |
| Debt               | Outstanding debt linked 1:1 to a Sale.                          |
| DebtPayment        | A collected payment against a Debt.                             |
| InventoryMovement  | INCOMING or OUTGOING stock movement for a Product.              |
| ExpenseCategory    | Category for expenses, scoped to a branch.                      |
| Expense            | A branch expense with multi-currency support.                   |

### Enums
- `RoleType`: SUPER_ADMIN | BOSS | EMPLOYEE
- `UserStatus`: ACTIVE | INACTIVE | SUSPENDED
- `PaymentType`: CASH_UZS | CASH_USD | ONLINE
- `OnlineReceiver`: ALI | BILOL
- `CurrencyType`: UZS | USD
- `InventoryMovementType`: INCOMING | OUTGOING
- `DebtStatus`: ACTIVE | PARTIAL | PAID

### Key Relationships
- Product.stock is denormalized (updated on every sale + inventory movement)
- Sale -> Debt is 1:1 optional (debt created separately after sale)
- Debt.remainingAmount auto-updated on DebtPayment creation
- Sale creation decrements Product.stock; Sale deletion restores it

## APIs — Full Reference

### Auth
| Method | Path                | Auth     | Notes                              |
|--------|---------------------|----------|------------------------------------|
| POST   | /api/auth/login     | public   | Returns access token + cookies     |
| POST   | /api/auth/refresh   | token    | Rotates refresh token              |
| POST   | /api/auth/logout    | required | Revokes session                    |
| GET    | /api/auth/me        | required | Current user                       |

### Users & Branches
| Method | Path                | Permission   | Notes                          |
|--------|---------------------|--------------|--------------------------------|
| GET    | /api/users          | user:list    | Branch-scoped for BOSS/EMP     |
| POST   | /api/users          | user:create  |                                |
| GET    | /api/users/:id      | user:read    |                                |
| PATCH  | /api/users/:id      | user:update  |                                |
| DELETE | /api/users/:id      | user:delete  |                                |
| GET    | /api/branches       | branch:list  |                                |
| POST   | /api/branches       | branch:create|                                |
| GET    | /api/branches/:id   | branch:read  |                                |
| PATCH  | /api/branches/:id   | branch:update|                                |
| DELETE | /api/branches/:id   | branch:delete| Blocked if users assigned      |

### Products
| Method | Path                              | Permission                | Notes                     |
|--------|-----------------------------------|---------------------------|---------------------------|
| GET    | /api/products/categories          | product_category:list     | Branch-scoped             |
| POST   | /api/products/categories          | product_category:create   |                           |
| GET    | /api/products/categories/:id      | product_category:read     |                           |
| PATCH  | /api/products/categories/:id      | product_category:update   |                           |
| DELETE | /api/products/categories/:id      | product_category:delete   |                           |
| GET    | /api/products                     | product:list              | Filter: search, category, isActive |
| POST   | /api/products                     | product:create            | SKU unique per branch     |
| GET    | /api/products/:id                 | product:read              |                           |
| PATCH  | /api/products/:id                 | product:update            |                           |
| DELETE | /api/products/:id                 | product:delete            |                           |

### Sales
| Method | Path            | Permission  | Notes                                       |
|--------|-----------------|-------------|---------------------------------------------|
| GET    | /api/sales      | sale:list   | Filter: paymentType, onlineReceiver, dates  |
| POST   | /api/sales      | sale:create | Validates stock; decrements on creation     |
| GET    | /api/sales/:id  | sale:read   |                                             |
| DELETE | /api/sales/:id  | sale:delete | Restores product stock                      |

### Debts
| Method | Path                        | Permission          | Notes                             |
|--------|-----------------------------|---------------------|-----------------------------------|
| GET    | /api/debts                  | debt:list           | Filter: status, dates, dueDate    |
| POST   | /api/debts                  | debt:create         | Links to Sale; sets initial status|
| GET    | /api/debts/:id              | debt:read           | Includes all payments             |
| PATCH  | /api/debts/:id              | debt:update         | Update customer info, dueDate     |
| DELETE | /api/debts/:id              | debt:delete         |                                   |
| GET    | /api/debts/:id/payments     | debt_payment:list   |                                   |
| POST   | /api/debts/:id/payments     | debt_payment:create | Auto-updates remaining/status     |

### Inventory
| Method | Path                   | Permission       | Notes                              |
|--------|------------------------|------------------|------------------------------------|
| GET    | /api/inventory         | inventory:list   | Filter: type, product, dates       |
| POST   | /api/inventory         | inventory:create | Updates Product.stock              |
| GET    | /api/inventory/:id     | inventory:read   |                                    |
| GET    | /api/inventory/stock   | inventory:list   | Stock summary per product          |

### Expenses
| Method | Path                              | Permission               | Notes                    |
|--------|-----------------------------------|--------------------------|--------------------------|
| GET    | /api/expenses/categories          | expense_category:list    |                          |
| POST   | /api/expenses/categories          | expense_category:create  |                          |
| GET    | /api/expenses/categories/:id      | expense_category:read    |                          |
| PATCH  | /api/expenses/categories/:id      | expense_category:update  |                          |
| DELETE | /api/expenses/categories/:id      | expense_category:delete  |                          |
| GET    | /api/expenses                     | expense:list             | Multi-currency filter    |
| POST   | /api/expenses                     | expense:create           |                          |
| GET    | /api/expenses/:id                 | expense:read             |                          |
| PATCH  | /api/expenses/:id                 | expense:update           |                          |
| DELETE | /api/expenses/:id                 | expense:delete           |                          |

### Analytics
| Method | Path            | Permission      | Notes                                  |
|--------|-----------------|-----------------|----------------------------------------|
| GET    | /api/analytics  | analytics:read  | Query: branchId, dateFrom, dateTo      |

Response envelope: `{ success: true, data }` / `{ success: false, error }`.

## Analytics Response Shape
```json
{
  "sales": {
    "totalCashUzs": 0, "totalCashUsd": 0, "totalOnline": 0,
    "totalAli": 0, "totalBilol": 0, "totalSales": 0, "salesCount": 0
  },
  "debts": {
    "totalDebt": 0, "totalRemaining": 0, "totalCollected": 0,
    "activeDebts": 0, "partialDebts": 0, "paidDebts": 0
  },
  "inventoryTrends": [{ "date": "2024-01-01", "incoming": 0, "outgoing": 0, "net": 0 }],
  "expenseTrends": [{ "categoryId": "", "categoryName": "", "totalUzs": 0, "totalUsd": 0, "count": 0 }],
  "period": { "from": "", "to": "" }
}
```

## RBAC Permission Matrix

### SUPER_ADMIN
All permissions.

### BOSS
user:{create,read,update,list}, branch:{read,list}, role:{read,list},
audit:{read,list}, notification:{read,list},
product:{create,read,update,delete,list}, product_category:{create,read,update,delete,list},
sale:{create,read,update,delete,list},
debt:{create,read,update,delete,list}, debt_payment:{create,list},
inventory:{create,read,list},
expense:{create,read,update,delete,list}, expense_category:{create,read,update,delete,list},
analytics:read

### EMPLOYEE
user:read, branch:read, notification:{read,list},
product:{read,list}, product_category:{read,list},
sale:{create,read,list},
debt:{read,list}, debt_payment:{create,list},
inventory:{read,list},
expense:{create,read,list}, expense_category:{read,list},
analytics:read

## Setup / Run
```bash
cp .env.example .env          # fill in DATABASE_URL + JWT secrets (>=32 chars)
docker compose up -d db        # start PostgreSQL
npm install
npm run prisma:generate
npm run prisma:migrate         # creates all migrations
npm run db:seed                # roles, permissions, branches, users
npm run dev                    # http://localhost:3000
```

Note: After PART 2 schema changes, run `npm run prisma:migrate` to generate
and apply the new migration (Prisma will prompt for migration name).

## Completed Tasks

### PART 1
- [x] Project scaffolding, Docker, configs
- [x] Prisma setup + init migration
- [x] Seed script (permissions, roles, branches, users)
- [x] Core layer, lib, HTTP helpers
- [x] Auth, User, Branch repository + service + API
- [x] RBAC middleware and guards

### PART 2
- [x] Prisma schema: 9 new models + 5 new enums
- [x] Permissions: 36 new permission keys
- [x] Domain repository interfaces: product, sale, debt, inventory, expense
- [x] Infrastructure Prisma repositories: product, sale, debt, inventory, expense
- [x] DTOs: product, sale, debt, inventory, expense
- [x] Services: product, sale, debt, inventory, expense, analytics
- [x] Zod validators: product, sale, debt, inventory, expense
- [x] API routes: products (CRUD + categories), sales, debts (+ payments), inventory (+ stock), expenses (+ categories), analytics
- [x] Container updated with all new services

### PART 3 — Full Frontend (current)
- [x] TypeScript types: `src/types/index.ts` — all domain types (PaginatedResponse, Product, Sale, Debt, Inventory, Expense, Analytics, DTOs)
- [x] API client: `src/lib/api-client.ts` — ApiError class, buildQuery helper, typed request wrapper
- [x] React Query setup: `src/lib/query-client.ts`, `src/providers/query-provider.tsx`
- [x] 8 React Query hook files: use-analytics, use-products, use-sales, use-debts, use-inventory, use-expenses, use-users, use-branches
- [x] UI components: skeleton, separator, avatar, stat-card, empty-state, page-header
- [x] Layout system: sidebar (Linear style), breadcrumbs, dashboard layout
- [x] Auth context rewritten with apiClient + User type
- [x] Login page: full redesign (Stripe/Linear style), demo credentials block
- [x] Dashboard: role-aware (Branch view vs Boss/SUPER_ADMIN view), Recharts charts (Bar, Area, Pie)
- [x] Products: CRUD with categories sub-page
- [x] Sales: list + new sale form (line items, stock validation, payment type)
- [x] Debts: CRUD + payment dialog + overdue highlighting
- [x] Inventory: incoming and outgoing pages with stock validation
- [x] Expenses: CRUD + categories sub-page
- [x] Users: CRUD with role/status badges
- [x] Branches: card grid layout
- [x] Settings: profile, security, branch info sections
- [x] TypeScript: 0 errors (`npx tsc --noEmit` passes)
- [x] AI_CONTEXT.md + SYSTEM_HANDOFF.md updated

## Remaining Tasks (future parts)
- [ ] Refresh-token reuse detection (auto-revoke on replay)
- [ ] Notification APIs (list/read/mark-read)
- [ ] AuditLog query APIs (list/filter by entity/action/date)
- [ ] Rate limiting on auth endpoints + account lockout
- [ ] Email/SMS (password reset, invites, OTP)
- [ ] Automated tests (unit for services, integration for routes)
- [ ] OpenAPI/Swagger spec generation
- [ ] CI/CD pipeline + DB backup strategy
- [ ] Per-branch custom permissions / dynamic roles
- [ ] Invoice / ledger / accounts domain
- [ ] Export to Excel/PDF for sales, debts, expenses, analytics
- [ ] Webhook / notification system for debt due dates
- [ ] Breadcrumbs component wired into all pages
- [ ] Pagination component extracted as shared component
- [ ] Dark mode support
