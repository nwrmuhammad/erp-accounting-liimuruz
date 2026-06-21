# ERP Accounting — liimuruz

Multi-branch accounting SaaS. Next.js 15, TypeScript, PostgreSQL, Prisma 6, TailwindCSS.

---

## Talablar

- Node.js 18+
- PostgreSQL 14+
- npm

---

## O'rnatish va ishga tushirish

### 1. Loyihani yuklab oling

```bash
git clone https://github.com/nwrmuhammad/erp-accounting-liimuruz.git
cd erp-accounting-liimuruz
```

### 2. Paketlarni o'rnating

```bash
npm install
```

### 3. PostgreSQL bazasini yarating

```bash
# PostgreSQL ga kiring
psql -U postgres

# Baza va foydalanuvchi yarating
CREATE DATABASE accounting_saas;
CREATE USER saas_user WITH PASSWORD 'saas_password';
GRANT ALL PRIVILEGES ON DATABASE accounting_saas TO saas_user;
ALTER USER saas_user CREATEDB;
\q
```

### 4. `.env` faylini sozlang

```bash
cp .env.example .env
```

`.env` faylini oching va quyidagilarni to'ldiring:

```env
DATABASE_URL="postgresql://saas_user:saas_password@localhost:5432/accounting_saas"

JWT_ACCESS_SECRET="kamida-32-belgili-maxfiy-kalit-bu-yerga"
JWT_REFRESH_SECRET="boshqa-kamida-32-belgili-maxfiy-kalit"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

NEXTAUTH_URL="http://localhost:3000"
NODE_ENV="development"
```

> **Muhim:** JWT secret kalitlar kamida 32 belgi bo'lishi kerak.

### 5. Bazani migratsiya qiling

```bash
npm run prisma:generate
npm run prisma:migrate
```

### 6. Boshlang'ich ma'lumotlarni yuklang (seed)

```bash
npm run db:seed
```

Bu quyidagilarni yaratadi:
- 5 ta filial (Toshkent Chilonzor, Toshkent Solnechniy, Buxoro, Samarqand, Termiz)
- Barcha rollar va ruxsatnomalar
- Admin, Boss, Employee hisoblar

### 7. Dasturni ishga tushiring

```bash
npm run dev
```

Brauzerda oching: **http://localhost:3000**

---

## Kirish ma'lumotlari

| Rol | Email | Parol |
|-----|-------|-------|
| SUPER_ADMIN | admin@accounting-saas.uz | Admin12345! |
| BOSS | boss.chilonzor@accounting-saas.uz | Boss12345! |
| EMPLOYEE | employee.chilonzor@accounting-saas.uz | Employee12345! |

---

## Sahifalar

| URL | Nomi |
|-----|------|
| `/` | Dashboard — grafik va statistika |
| `/sales` | Sotuvlar — kunlik, statusi bilan |
| `/hisobot` | Hisobot — barcha vaqt bo'yicha |
| `/expenses` | Xarajatlar |
| `/kirim` | Kirim (kassaga tushgan pul) |
| `/chiqim` | Chiqim (kassadan chiqqan pul) |
| `/products` | Mahsulotlar |
| `/inventory` | Inventar harakatlari |
| `/users` | Foydalanuvchilar |
| `/branches` | Filiallar (faqat SUPER_ADMIN) |

---

## Rollar

| Rol | Imkoniyatlar |
|-----|-------------|
| **SUPER_ADMIN** | Barcha filiallar, barcha ma'lumotlar, foydalanuvchi boshqaruvi |
| **BOSS** | Faqat o'z filiali, hisobot ko'rish |
| **EMPLOYEE** | Sotuv qo'shish, xarajat kiritish, hisobot ko'rish |

---

## Sotuvlar qoidasi

- Sotuvlar **faqat bugungi sana** bo'yicha ko'rinadi (23:59 gacha)
- **POCHTADA** statusidagi (puli kutilayotgan) sotuvlar sana o'tsa ham ko'rinadi
- Pul olingandan so'ng "Pul olindi" tick qo'yilsa, sotuv Hisobotga o'tadi
- **YOPILDI** statusidagi sotuvlar bugungi kunda ko'rinadi, 23:59 dan keyin Hisobotga o'tadi

---

## Texnologiyalar

| Qism | Texnologiya |
|------|-------------|
| Framework | Next.js 15 App Router |
| Til | TypeScript (strict) |
| Baza | PostgreSQL + Prisma 6 |
| Auth | JWT + HttpOnly cookie |
| UI | TailwindCSS |
| Validation | Zod |

---

## Muammo chiqsa

```bash
# Baza ulanishini tekshiring
npx prisma db push

# Migratsiyalarni qayta ishga tushiring
npx prisma migrate reset

# Loglarni ko'ring
npm run dev
```
