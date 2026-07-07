# Architecture — BillX POS System

This document gives a single high-level map of the system. Refer to `backend-prd-detailed.md`, `frontend-prd-detailed.md`, and `schema-migration.sql` for full detail — this file just shows how everything connects.

## 1. High-Level System Diagram

```
                        ┌───────────────────────────┐
                        │        Browser/User        │
                        └─────────────┬──────────────┘
                                      │ HTTPS
                                      ▼
                        ┌───────────────────────────┐
                        │   React Frontend (Vite)    │
                        │   Hosted on: Netlify       │
                        │   - Landing Page           │
                        │   - Auth (Login/Signup)    │
                        │   - Cashier Module         │
                        │   - Manager Module         │
                        └─────────────┬──────────────┘
                                      │ REST (Axios) + JWT Bearer
                                      ▼
                        ┌───────────────────────────┐
                        │  Spring Boot Backend API   │
                        │  Hosted on: Koyeb          │
                        │  Layers: Controller →      │
                        │  Service → Repository →    │
                        │  Entity                    │
                        └───┬───────┬───────┬────────┘
                            │       │       │
              ┌─────────────┘       │       └─────────────┐
              ▼                     ▼                      ▼
     ┌─────────────────┐  ┌──────────────────┐   ┌──────────────────┐
     │ MySQL (Aiven)    │  │ Razorpay API     │   │ Cloudinary API   │
     │ - Users          │  │ - QR payments    │   │ - Product images │
     │ - Branches       │  │ - Webhooks       │   └──────────────────┘
     │ - Orders/Products│  └──────────────────┘
     │ - Payments etc.  │
     └─────────────────┘
              │
              ▼
     ┌─────────────────┐        ┌──────────────────┐
     │ Google OAuth2    │        │ SMTP (Gmail)     │
     │ - Login          │        │ - Weekly PDF     │
     └─────────────────┘        │   report emails  │
                                 └──────────────────┘
```

## 2. Repository Structure (as already scaffolded)

```
BillX/
├── Frontend/                      → React app (Vite)
│   ├── public/
│   │   └── assets/                → landing page images/videos go here
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── layouts/
│   │   ├── redux/
│   │   ├── routes/
│   │   ├── hooks/
│   │   └── utils/
│   └── .env                       → VITE_API_BASE_URL
├── src/main/java/com/project/BillX/  → Spring Boot backend
│   ├── config/
│   ├── security/
│   ├── controller/
│   ├── service/
│   ├── repository/
│   ├── entity/
│   ├── dto/
│   ├── mapper/
│   ├── exception/
│   ├── util/
│   └── scheduler/
├── src/main/resources/
│   └── application.properties
├── .env                            → backend secrets
├── .env.example
├── schema-migration.sql            → reference schema (Hibernate auto-creates actual tables)
├── backend-prd-detailed.md
├── frontend-prd-detailed.md
├── architecture.md                 → this file
└── pom.xml
```

## 3. Request Flow Examples

### 3.1 Cashier creates and pays for an order (UPI)
1. Frontend: cashier builds cart client-side (Redux `cart` slice), clicks Process Payment → UPI.
2. `POST /api/orders` — backend recomputes totals server-side, creates order with `status=PENDING`.
3. `POST /api/payments/qr` — backend calls Razorpay, creates a QR bound to the order amount, returns QR image URL.
4. Frontend displays QR, polls `GET /api/payments/status/{qrId}`.
5. Customer pays via any UPI app → Razorpay sends `payment.captured` webhook → `POST /api/payments/webhook`.
6. Backend verifies signature, marks payment `SUCCESS`, order `PAID`, decrements stock, logs to `inventory_logs` — all in one transaction.
7. Frontend polling detects success, shows invoice, clears cart.

### 3.2 Manager views a dashboard chart
1. Frontend: on `/manager/dashboard` mount (or branch filter change), dispatch thunk → `GET /api/reports/payment-breakdown?branchId=&range=`.
2. Backend verifies the manager is assigned to that `branchId` via `manager_branches`, runs a live aggregation query, returns `[{label, value, count}]`.
3. Frontend feeds the response directly into `<ChartCard type="donut">`.

### 3.3 Google OAuth2 login (new user)
1. Frontend redirects to backend's `/oauth2/authorization/google`.
2. Google authenticates, redirects back to backend's callback.
3. Backend checks if the email exists; if not, creates a new `User` with `role=CASHIER`, `branch_id=NULL`.
4. Backend issues a JWT, redirects to frontend with the token.
5. Frontend stores the token, calls `GET /api/auth/me` to hydrate the `auth` Redux slice.

## 4. Landing Page (new addition — not in original PRDs, defined here)

The landing page is public (no auth) and separate from the Cashier/Manager modules.

**Sections:**
1. **Hero** — BillX name/logo, tagline, background video/image (from `Frontend/public/assets/`), primary CTA buttons: **Login** and **Sign Up**.
2. **Features section** — cards summarizing: POS billing, Razorpay UPI QR payments, inventory management, branch management, dynamic analytics/charts, weekly PDF reports, Google OAuth2 login.
3. **Screens/visual preview section** — supporting images/video clips from the assets folder.
4. **Footer** — simple links/credits.

**Auth entry flow:**
- Landing page → **Login** or **Sign Up** button → auth page.
- After successful login, the backend-provided `role` in the JWT/`/api/auth/me` response determines redirect: `CASHIER` → `/cashier/pos`, `MANAGER` → `/manager/dashboard`. This happens automatically based on the authenticated user's role — there is no separate manual "login as Cashier / login as Manager" selector, since role is a property of the account, not a runtime choice. (A user's role is assigned when their account is created — by signup default or by a manager during employee creation.)

## 5. Theme System

- Global light/dark mode toggle (`theme` Redux slice), applied via a root-level class (e.g., Tailwind `dark:` variant).
- Color palette (both landing page and app):
  - Primary: deep green (brand color)
  - Accent: blue shade (secondary accent, used for links/secondary buttons/chart accents)
  - Light mode: white/light-gray backgrounds, dark text
  - Dark mode: near-black/dark-charcoal backgrounds, light text, green/blue accents remain vivid against dark background
- Chart color sets (Recharts) should pull from this same green/blue palette rather than default chart library colors, for visual consistency between landing page and dashboards.

## 6. Responsiveness Requirements
- Landing page: fully responsive, mobile-first (single-column stacking below 768px).
- Cashier POS Terminal: collapses to single-column with cart-as-drawer below 768px (tablet-friendly, per frontend PRD §11).
- Manager Dashboard: sidebar collapses to a hamburger/drawer menu below 1024px; charts stack to single-column below 768px.

## 7. Reference Files for the Agent
- `backend-prd-detailed.md` — full backend spec, API contracts, business rules.
- `frontend-prd-detailed.md` — full frontend spec, screens, Redux shape, components.
- `schema-migration.sql` — reference schema (Hibernate `ddl-auto=update` creates actual tables from `@Entity` classes; this file is documentation, not executed directly).
- `architecture.md` (this file) — system-level map, landing page spec, theme spec.
