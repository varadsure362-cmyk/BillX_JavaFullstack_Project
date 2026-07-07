# Frontend PRD — POS System (React) — Detailed

## 1. Purpose & Goals
A responsive React app with two distinct authenticated experiences (Cashier, Manager) sharing one codebase, one design system, and one Axios/Redux data layer. Built to be handed to an AI coding agent with enough detail that layout, state shape, and data-fetching behavior don't need follow-up clarification.

## 2. Tech Stack (with rationale)
| Concern | Choice | Why |
|---|---|---|
| Build tool | Vite | Fast dev server, standard for modern React |
| State | Redux Toolkit | Predictable global state across cart, auth, reports across many screens |
| Styling | Tailwind CSS + Shadcn UI | Matches backend-agnostic design tokens, fast to build consistent UI |
| Charts | Recharts | Native React components, integrates with Shadcn chart primitives |
| Forms | Formik + Yup | Declarative validation, less boilerplate than manual controlled inputs |
| HTTP | Axios (single instance) | Central place for auth header + error interceptor |
| Routing | React Router DOM | Standard SPA routing with nested layouts and guards |

## 3. Information Architecture / Sitemap

```
/login
/signup
/oauth2/callback

/cashier                       (guard: role === CASHIER)
  /cashier/pos                 → POS Terminal (default)
  /cashier/orders              → Order History
  /cashier/orders/:id          → Order Detail
  /cashier/refunds             → Returns/Refunds
  /cashier/customers           → Customers

/manager                       (guard: role === MANAGER)
  /manager/dashboard           → Overview (default)
  /manager/branches            → Branch list/CRUD
  /manager/products            → Product list/CRUD
  /manager/categories          → Category CRUD
  /manager/employees           → Employee CRUD
  /manager/customers           → Customer list
  /manager/alerts              → Alerts
  /manager/inventory           → Inventory management
  /manager/transactions        → Transaction table
  /manager/reports             → Reports & charts + weekly PDF
  /manager/settings            → Branch/account settings
```

Route guard behavior: unauthenticated → redirect to `/login`. Authenticated but wrong role for the path → redirect to their own module's default route (never show a "forbidden" dead-end).

## 4. Redux Store Shape (detailed)

```js
{
  auth: {
    user: { id, fullName, email, role, branchId, managedBranchIds: [] },
    token: string | null,
    status: 'idle' | 'loading' | 'authenticated' | 'error',
    error: string | null
  },
  theme: { mode: 'light' | 'dark' },
  branchContext: {
    availableBranches: [{ id, name }],   // for manager's branch switcher
    selectedBranchId: number | 'ALL'
  },
  cart: {
    items: [{ productId, name, price, quantity, lineTotal, imageUrl }],
    customerId: number | null,
    discountType: 'PERCENT' | 'FLAT' | null,
    discountAmount: number,
    orderNote: string,
    subtotal: number,
    totalAmount: number
  },
  products: { list: [], pagination: {...}, filters: { search, categoryId, branchId }, status },
  categories: { list: [], status },
  customers: { list: [], selectedCustomer: null, status },
  orders: { history: [], pagination: {...}, currentOrder: null, status },
  payments: { activeQr: { qrImageUrl, qrId, razorpayOrderId } | null, pollStatus: 'idle'|'polling'|'success'|'failed' },
  refunds: { list: [], status },
  branches: { list: [], status },
  employees: { list: [], status },
  inventory: { list: [], status },
  reports: {
    overview: {...} | null,
    paymentBreakdown: [] ,
    salesTrend: [],
    topProducts: [],
    cashierPerformance: [],
    salesByCategory: [],
    refundSpikes: [],
    filters: { branchId, dateRange },
    status
  },
  alerts: { list: [], unreadCount: 0, status }
}
```

Every `status` field follows: `'idle' | 'loading' | 'succeeded' | 'failed'` (standard RTK async thunk pattern), each paired with an `error` field.

## 5. Axios Instance Contract
```js
// single instance, base URL from VITE_API_BASE_URL
// request interceptor: attach Authorization: Bearer <token> from Redux/localStorage
// response interceptor: on 401 → dispatch logout + redirect to /login
//                        on network error → surface a generic toast, don't crash the UI
```

## 6. Global UI Components (build once, reuse everywhere)
- `<ChartCard type="pie|donut|bar|line|area" data={[{label,value}]} title loading error />` — wraps Recharts, handles loading skeleton and empty state internally.
- `<DataTable columns rows pagination onPageChange loading emptyMessage />` — used for orders, products, employees, transactions, refunds.
- `<StatCard title value icon trend? />` — for dashboard top cards.
- `<ConfirmDialog />` — for delete/destructive actions (Shadcn dialog).
- `<FormField />` wrapper around Formik inputs with consistent label/error styling.
- `<BranchSwitcher />` — dropdown shown only if `managedBranchIds.length > 1`; updates `branchContext.selectedBranchId` and triggers refetch of scoped data.
- `<ThemeToggle />`
- `<QrPaymentModal orderId onSuccess onFailure />` — encapsulates the full QR generate → display → poll → resolve flow.

## 7. Module 1: Cashier — Screen-by-Screen Detail

### 7.1 POS Terminal (`/cashier/pos`)
**Layout:** 3-column — product grid (left/center), cart panel (right).

**Behavior:**
- On mount: fetch products for the cashier's `branchId` (from `auth.user.branchId`), paginated, with category filter chips at top.
- Keyboard shortcuts (as shown in the reference UI): `F1` focuses search, `F2` focuses discount field, `F3` opens customer selector, `Ctrl+Enter` triggers payment.
- Clicking a product card adds it to `cart.items` (or increments quantity if already present) — dispatch to cart slice, no API call needed until checkout.
- Cart panel shows: item list (editable quantity, remove button), "Held"/"Clear" actions, customer selector, discount input (toggle % / ₹), order note textarea, computed total (recalculated client-side for display, but **server recomputes authoritatively** on submit).
- "Process Payment" button: disabled while `cart.items.length === 0`. On click, opens payment method selection (Card/Cash/UPI).
  - Card/UPI → `POST /api/orders` first (creates PENDING order) → then `POST /api/payments/qr` → open `<QrPaymentModal>` → poll status → on success, navigate to invoice view, clear cart.
  - Cash → `POST /api/orders` → `POST /api/payments/cash` with amount received → on success, show invoice, clear cart.
- "Hold Order" — stores current cart in local state/localStorage-free Redux only (not persisted to backend) so cashier can resume; out of scope to persist across sessions unless explicitly requested later.

**Acceptance criteria:**
- Cart total shown to the cashier always matches what the backend confirms after order creation; if they differ, show the backend's authoritative total and note "recalculated" (handles stale price edge case).
- Payment modal cannot be dismissed mid-poll without an explicit "Cancel Payment" confirmation (prevents accidental abandonment of a live QR).

### 7.2 Order History (`/cashier/orders`)
- `<DataTable>` fed by `GET /api/orders?branchId=&cashierId=&dateFrom=&dateTo=`, default filtered to the logged-in cashier's own orders for the current day; filters for date range/status.
- Row click → `/cashier/orders/:id` detail view showing line items, payment method, refund history if any, "Download Invoice" button.

### 7.3 Returns/Refunds (`/cashier/refunds`)
- Search bar (order number or customer name/phone) → shows matching orders eligible for refund (`status IN (PAID, PARTIALLY_REFUNDED)`).
- Select order → show line items with checkboxes to select which to refund, or a flat amount field.
- Reason field is **required** (Formik/Yup validation, min 5 chars) — submit disabled until filled.
- On submit: `POST /api/refunds`, show success toast, update order status locally.

### 7.4 Customers (`/cashier/customers`)
- Search + list, "Add Customer" quick form (name, phone required; email optional).
- Click customer → side panel with order history and total spend (read-only for cashier).

## 8. Module 2: Manager — Screen-by-Screen Detail

### 8.1 Dashboard (`/manager/dashboard`)
- On mount and whenever `branchContext.selectedBranchId` changes, fetch: overview stats, payment breakdown, sales trend (default range: last 7 days).
- Stat cards: Total Sales, Orders Today, Total Branches, Total Products, Total Employees, Low Stock Items — each a `<StatCard>`.
- `<ChartCard type="donut">` for payment breakdown.
- `<ChartCard type="area">` for sales trend, with a range selector (Daily/Weekly/Monthly) that refetches `GET /api/reports/sales-trend`.

### 8.2 Branches (`/manager/branches`)
- Table: name, address, working days, employee count. "Add Branch" opens a Formik modal (name, address required; working days as a multi-select of weekdays).
- Only branches in `managedBranchIds` are listed; creating a new branch auto-assigns the creating manager to it (backend responsibility, but frontend should optimistically add it to `branchContext.availableBranches`).

### 8.3 Products (`/manager/products`)
- `<DataTable>` with search, category filter, pagination.
- Add/Edit modal: name, SKU, category (select), price, stock quantity, low stock threshold, image upload (drag-and-drop, preview before submit, uploads to Cloudinary via backend).
- Delete requires `<ConfirmDialog>`.

### 8.4 Categories (`/manager/categories`)
- Simple CRUD list, no pagination needed (expected to be a small list).

### 8.5 Employees (`/manager/employees`)
- Table: name, email, role, assigned branch(es).
- Add/Edit modal: role select (Cashier/Manager) — if Manager, show a **multi-select** branch assignment field; if Cashier, show a **single-select** branch field.
- Deactivate/delete with confirmation.

### 8.6 Customers (`/manager/customers`)
- Read-heavy list/search, click-through to order history and total spend (same detail panel as cashier's view, reused component).

### 8.7 Alerts (`/manager/alerts`)
- List grouped by type (Low Stock / No Sales / Refund Spike) with unread indicator, "Mark as read" action, click-through to the relevant product or order.

### 8.8 Inventory (`/manager/inventory`)
- Table: product, current stock, threshold, status (OK/Low). "Update Stock" inline action opens a small form (change type: Restock/Adjustment, quantity delta) → `PUT /api/products/{id}/inventory`.

### 8.9 Transactions (`/manager/transactions`)
- Full read-only table across orders + payments, filterable by branch/date/method/status, exportable is optional (not required).

### 8.10 Reports (`/manager/reports`)
- Filter bar: branch selector, date range picker.
- Grid of `<ChartCard>`s: Sales Trend (line), Top Products (bar), Cashier Performance (bar), Sales by Category (pie), Refund Spikes (table, not a chart).
- "Generate Weekly PDF Report Now" button → `POST /api/reports/weekly/generate`, show progress toast, then success with a link to the generated file.
- Below: history table of past weekly reports (`GET /api/reports/weekly/history`) with download links.

### 8.11 Settings (`/manager/settings`)
- Branch details form (name, address, working days) — scoped to `selectedBranchId`.
- Account section: change password (if `authProvider === LOCAL`), shows "Signed in with Google" badge if `authProvider === GOOGLE`.

## 9. Form Validation Rules (Yup, representative)
- Product: `name` required, `price` positive number, `stockQuantity` integer ≥ 0, `sku` required.
- Employee: `email` valid email format, `role` required, at least one branch selected.
- Refund: `reason` required min 5 chars, `amount` positive and ≤ remaining refundable (client-side soft check; backend is authoritative).
- Discount: `discountAmount` ≥ 0; if `PERCENT`, ≤ 100.

## 10. Error / Loading / Empty States (apply consistently across every list/chart)
- **Loading:** skeleton placeholders sized to match the eventual content (not a generic spinner for tables — use row-shaped skeletons).
- **Error:** inline retry button within the component ("Couldn't load sales data — Retry"), plus a toast for actions (create/update/delete failures).
- **Empty:** friendly message specific to context, e.g. "No orders yet today" rather than a generic "No data."

## 11. Non-Functional Requirements
- Mobile breakpoint: POS Terminal should collapse to a single-column, cart-as-drawer layout below 768px width (cashiers may use tablets).
- All chart data fetches must be cancelled/ignored if the branch filter changes before the previous request resolves (avoid stale-data flicker — use request cancellation or a request-id guard in the thunk).
- No sensitive data (JWT) stored in `localStorage` in plaintext if avoidable — prefer in-memory + refresh-on-reload via a silent `/api/auth/me` call; acceptable fallback is `localStorage` for a resume project but document the tradeoff.

## 12. Deployment Notes (Netlify)
- Build command: `npm run build` (or `pnpm build`), publish directory: `dist`.
- Environment variable: `VITE_API_BASE_URL` set to the deployed Koyeb backend URL.
- Add a `_redirects` file (`/* /index.html 200`) so React Router client-side routes don't 404 on refresh.

## 13. Acceptance Criteria (Definition of Done)
- [ ] Cashier can complete a full sale (cart → discount → payment → invoice) without a page reload.
- [ ] Manager dashboard charts update correctly when switching the branch filter, with no stale data flash.
- [ ] Every table (products, orders, employees, transactions) supports pagination and shows correct loading/empty states.
- [ ] Refund form blocks submission without a reason and shows the real backend error if the amount exceeds what's refundable.
- [ ] Theme toggle persists across page reloads.
- [ ] App is usable on a tablet-width viewport for the Cashier POS screen specifically.
- [ ] Weekly report history and manual-generate button both work end-to-end against the backend.
