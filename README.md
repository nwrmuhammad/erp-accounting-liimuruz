# Multi-Branch Accounting & Analytics SaaS

Production-ready full-stack accounting platform with multi-branch support, RBAC, real-time analytics, and complete frontend. Built with Next.js 15, TypeScript, PostgreSQL, Prisma 6, TailwindCSS, and Shadcn/UI following Clean Architecture.

---

## Quick Start

```bash
cp .env.example .env          # DATABASE_URL + JWT secrets (>=32 chars)
npm install
npm run prisma:generate
npm run prisma:migrate         # runs all migrations
npm run db:seed                # seeds branches, roles, users, sample data
npm run dev                    # http://localhost:3000
```

> **PostgreSQL (without Docker):** Install via Homebrew, create `saas_db` and user `saas_user`, then run `ALTER USER saas_user CREATEDB;` for Prisma shadow database support.

---

## Frontend Pages

| URL | Sahifa / Page |
|-----|---------------|
| `/login` | Kirish (Login) |
| `/` | Dashboard — Analytics (sotuvlar, qarzlar, inventar, xarajatlar) |
| `/products` | Mahsulotlar — CRUD, qidirish, sahifalash |
| `/products/categories` | Mahsulot kategoriyalari — CRUD |
| `/sales` | Sotuvlar ro'yxati — ko'rish, o'chirish |
| `/sales/new` | Yangi sotuv — line items, to'lov turi |
| `/debts` | Qarzlar — yaratish, to'lov qo'shish, status filtri |
| `/inventory` | Inventar harakatlari — kirim/chiqim qo'shish |
| `/expenses` | Xarajatlar — CRUD, multi-valyuta (UZS/USD) |
| `/expenses/categories` | Xarajat kategoriyalari — CRUD |
| `/users` | Foydalanuvchilar — CRUD (BOSS va SUPER_ADMIN) |
| `/branches` | Filiallar — CRUD (faqat SUPER_ADMIN) |

**Kirish ma'lumotlari (Default Accounts):**

| Rol | Email | Parol |
|-----|-------|-------|
| SUPER_ADMIN | admin@accounting-saas.uz | Admin12345! |
| BOSS | boss.chilonzor@accounting-saas.uz | Boss12345! |
| EMPLOYEE | employee.chilonzor@accounting-saas.uz | Employee12345! |

---

## Backend API Endpoints

### Auth
| Method | URL | Description |
|--------|-----|-------------|
| POST | `/api/auth/login` | Login, cookie o'rnatadi |
| POST | `/api/auth/logout` | Logout, cookieni tozalaydi |
| POST | `/api/auth/refresh` | Access token yangilash |
| GET | `/api/auth/me` | Joriy foydalanuvchi ma'lumoti |

### Products
| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/products` | Ro'yxat (search, page, pageSize, categoryId, isActive) |
| POST | `/api/products` | Yangi mahsulot |
| GET | `/api/products/:id` | Bitta mahsulot |
| PATCH | `/api/products/:id` | Tahrirlash |
| DELETE | `/api/products/:id` | O'chirish |
| GET | `/api/products/categories` | Kategoriyalar ro'yxati |
| POST | `/api/products/categories` | Yangi kategoriya |
| PATCH | `/api/products/categories/:id` | Kategoriya tahrirlash |
| DELETE | `/api/products/categories/:id` | Kategoriya o'chirish |

### Sales
| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/sales` | Ro'yxat (search, paymentType, dateFrom, dateTo) |
| POST | `/api/sales` | Yangi sotuv (stokni avtomatik kamaytiradi) |
| GET | `/api/sales/:id` | Bitta sotuv (items bilan) |
| DELETE | `/api/sales/:id` | O'chirish (stokni qaytaradi) |

### Debts
| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/debts` | Ro'yxat (search, status) |
| POST | `/api/debts` | Yangi qarz |
| GET | `/api/debts/:id` | Bitta qarz |
| PATCH | `/api/debts/:id` | Tahrirlash |
| DELETE | `/api/debts/:id` | O'chirish |
| POST | `/api/debts/:id/payments` | To'lov qo'shish |
| GET | `/api/debts/:id/payments` | To'lovlar ro'yxati |

### Inventory
| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/inventory` | Harakatlar ro'yxati (type, productId) |
| POST | `/api/inventory` | Yangi harakat (INCOMING/OUTGOING) |
| GET | `/api/inventory/summary` | Stok xulosasi |

### Expenses
| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/expenses` | Ro'yxat (search, categoryId, currency) |
| POST | `/api/expenses` | Yangi xarajat |
| GET | `/api/expenses/:id` | Bitta xarajat |
| PATCH | `/api/expenses/:id` | Tahrirlash |
| DELETE | `/api/expenses/:id` | O'chirish |
| GET | `/api/expenses/categories` | Kategoriyalar |
| POST | `/api/expenses/categories` | Yangi kategoriya |
| PATCH | `/api/expenses/categories/:id` | Kategoriya tahrirlash |
| DELETE | `/api/expenses/categories/:id` | Kategoriya o'chirish |

### Analytics
| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/analytics` | To'liq hisobot (dateFrom, dateTo, branchId) |

### Users & Branches
| Method | URL | Description |
|--------|-----|-------------|
| GET/POST | `/api/users` | Foydalanuvchilar |
| GET/PATCH | `/api/users/:id` | Bitta foydalanuvchi |
| GET/POST | `/api/branches` | Filiallar |
| GET/PATCH/DELETE | `/api/branches/:id` | Bitta filial |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict) |
| Database | PostgreSQL + Prisma 6 |
| Auth | JWT (HS256) + HttpOnly cookies |
| Styling | TailwindCSS + Shadcn/UI |
| Architecture | Clean Architecture (domain → application → infrastructure → presentation) |
| Validation | Zod |
| RBAC | Permission-based (SUPER_ADMIN, BOSS, EMPLOYEE) |

---

## Architecture

```
src/
├── app/
│   ├── (auth)/login/          # Login page
│   ├── (dashboard)/           # All protected pages
│   │   ├── layout.tsx         # Sidebar + AuthProvider
│   │   ├── page.tsx           # Dashboard/Analytics
│   │   ├── products/          # Products + categories
│   │   ├── sales/             # Sales list + new sale
│   │   ├── debts/             # Debts + payments
│   │   ├── inventory/         # Inventory movements
│   │   ├── expenses/          # Expenses + categories
│   │   ├── users/             # User management
│   │   └── branches/          # Branch management
│   └── api/                   # All API routes
├── core/                      # Errors, types, permissions
├── domain/                    # Repository interfaces
├── application/services/      # Business logic
├── infrastructure/            # Prisma repositories, container
├── presentation/              # Validators, middleware
├── components/                # UI components
├── context/                   # Auth context
└── lib/                       # API client, JWT, utils
```

---

## Key Business Rules

- **Branch isolation:** EMPLOYEE faqat o'z filiali ma'lumotlarini ko'radi. BOSS o'z filiali. SUPER_ADMIN hamma filial.
- **Sale → Stock:** Sotuv yaratilganda stok avtomatik kamayadi. Sotuv o'chirilganda stok qaytariladi.
- **Debt status:** ACTIVE → PARTIAL → PAID (to'lovlar qo'shilganda avtomatik yangilanadi).
- **Online payment:** `paymentType: ONLINE` bo'lsa `onlineReceiver` (ALI yoki BILOL) majburiy.
- **Sale number format:** `{BRANCH_CODE}-{YYYYMMDD}-{0001}` (har kun sifirdan boshlanadi).
- **SKU:** Har bir filialda unique (`sku + branchId` composite unique).
- **Multi-currency:** Xarajatlar UZS va/yoki USD da kiritilishi mumkin.




---

## Documentation
- `AI_CONTEXT.md` — arxitektura, konventsiyalar va loyihani kengaytirish bo'yicha qo'llanma.
- `SYSTEM_HANDOFF.md` — database dizayni, API referens, bajarilgan/qolgan vazifalar.


