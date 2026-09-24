# FarmPulse 🌾

> **Modern, Multi-Tenant Farm Management Web Platform & Progressive Web App (PWA)**  
> Built for commercial, medium, and smallholder farmers across Kenya and Africa, architected for international scale.

FarmPulse helps farm owners answer four fundamental questions in real time:
1. **How much money is coming into my farm?**
2. **How much money am I spending?**
3. **Which farm enterprise is making or losing money?**
4. **How is my farm performing compared with previous periods?**

---

## 🌟 Key Features

### 1. ⚡ Quick-Log Transaction Flow (< 30 Seconds)
- Designed specifically for field use on mobile phones under bright sunlight.
- Segmented toggle between **− Expense** and **+ Sale / Income**.
- Smart categories auto-filtered by selected farm enterprise.
- Auto-calculating totals ($Quantity \times UnitPrice = TotalAmount$).
- Default currency **KES (KSh)** with quick preset buttons (`+500`, `+1,000`, `+5,000`).
- Supports **M-Pesa**, **Cash**, **Bank**, and **Credit**.
- Optional receipt camera capture and gallery upload with client-side preview.

### 2. 📴 Offline-First PWA Architecture
- **Zero data loss**: When connectivity drops, transactions write optimistically to local **IndexedDB** (`Dexie.js`).
- Client-generated **UUIDv4 idempotency keys** ensure duplicate entries are never created when network reconnects.
- Automatic background synchronization on `window.online` event.
- Visual connection status badge (`Synced`, `Pending`, `Offline`) and alert banner.
- Fully installable to mobile home screens with Web App Manifest & Service Worker.

### 3. 👥 Automated Accounts Receivable (Debtors Ledger)
- Sales recorded as **Credit** or **Partially Paid** automatically generate debtor records with due dates.
- Partial and full payment recording with M-Pesa transaction reference tracking.
- Distinguishes **Revenue** from actual **Cash Flow** so credit sales do not distort cash on hand.

### 4. 📊 Enterprise Profitability & Unit Economics
- Independent financial breakdown for each agricultural enterprise:
  - **Poultry** (Broilers, Layers, Kienyeji)
  - **Dairy Cattle** (Milk yields, Friesian herds)
  - **Aquaculture** (Tilapia & Catfish ponds)
  - **Goats & Sheep** (Dairy goats, Boer meat goats)
  - **Piggery** (Breeding & fattening)
  - **Crops & Fodder** (Silage, Boma Rhodes hay)
- Cost driver percentage breakdowns (Feed, Labour, Veterinary, Transport, Utilities).
- Cost-per-unit operational metrics (e.g. Feed cost per tray of eggs, cost per litre of milk, cost per kg of fish).

### 5. 📬 Automated Weekly Farm Digest & Printable PDF
- Compiles 7-day performance: Revenue, Expenses, Net Profit/Loss, Cash Flow, and Week-on-Week (WoW) comparison.
- Top 3 cost drivers and outstanding customer balances.
- Responsive HTML email template for delivery via Resend/SendGrid every **Monday at 07:00 AM (Africa/Nairobi)**.
- 1-page clean printable PDF summary via dedicated `@media print` layout.
- Scheduled cron webhook at `/api/cron/weekly-digest`.

### 6. 🔒 Role-Based Access Control (RBAC) & Multi-Tenant Security
- Strict multi-tenant data isolation by `farmId`.
- **Owner**: Full access to all finances, profit margins, team management, and settings.
- **Farm Manager**: Can record transactions, manage assigned enterprises, view operational summaries.
- **Farm Hand**: Can record daily operational entries with financial summaries hidden.
- Soft-deletion with full JSON diff audit logging.

### 7. 🧾 Digital Receipts & Unique QR Code Verification
- Every expense, income, or sale transaction automatically generates a unique digital receipt.
- **Receipt Number**: Globally unique sequential format `FP-YYYYMMDD-XXXXXX`.
- **Embedded Dynamic QR Code**: Directs scanners to public verification URL `/verify/[receiptNumber]`.
- **Public Verification Security**: Scanners can verify receipt authenticity, farm name, enterprise, transaction type, and amounts without accessing internal farmer accounts, passwords, personal contacts, or private notes.
- **Print & Share**: Thermal receipt format (80mm) and standard A4 print styles, plus native Web Share API with clipboard copy fallback.
- **Offline Resilience**: Offline entries receive a temporary "Pending Sync" receipt identifier, automatically updated to an authoritative `FP-...` receipt upon reconnection.
- **Lifecycle & Invalidation**: Soft-deleting a transaction instantly updates its receipt status to **VOIDED**, with visual void watermarks and public invalidation notices.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router, Server-Side Rendering, Server Actions, Route Handlers)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict Mode)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with custom Agricultural palette
- **Icons**: [Lucide React](https://lucide.dev/)
- **Database & ORM**: [PostgreSQL](https://www.postgresql.org/) / [SQLite](https://sqlite.org/) with [Prisma ORM](https://www.prisma.io/)
- **Offline Storage**: [Dexie.js](https://dexie.com/) (IndexedDB wrapper)
- **Validation**: [Zod](https://zod.dev/) & [React Hook Form](https://react-hook-form.com/)
- **Charts**: [Recharts](https://recharts.org/)
- **Date Handling**: [date-fns](https://date-fns.org/)

---

## 📂 Project Structure

```
c:\THE FARM\
├── prisma/
│   ├── schema.prisma              # Local & development schema (SQLite/PostgreSQL)
│   └── schema.postgresql.prisma   # Production PostgreSQL schema with Enums & Decimals
├── public/
│   ├── manifest.json              # PWA Web App Manifest
│   ├── sw.js                      # PWA Service Worker (stale-while-revalidate & offline cache)
│   └── icons/                     # Application SVG and PNG icons
├── scripts/
│   ├── seed.mjs                   # Kenyan agricultural database seeder
│   └── test-runner.mjs            # Automated Unit & Integration test suite
├── src/
│   ├── app/
│   │   ├── (auth)/login/          # Authentication page
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx         # Responsive dashboard layout (Navbar, Sidebar, BottomNav)
│   │   │   ├── dashboard/         # Core Financial Health Dashboard
│   │   │   ├── transactions/      # Transactions Ledger & Standalone New Entry
│   │   │   ├── sales/             # Filtered Sales redirect
│   │   │   ├── expenses/          # Filtered Expenses redirect
│   │   │   ├── receivables/       # Debtors Ledger & Payment Settlement
│   │   │   ├── enterprises/       # Enterprise Profitability & Cost Drivers
│   │   │   ├── reports/           # Weekly Digest & PDF Export
│   │   │   └── settings/          # Farm Profile & RBAC Team Settings
│   │   ├── receipts/[id]/         # Dedicated digital receipt & printable view
│   │   ├── verify/[receiptNumber]/# Public QR code verification page
│   │   ├── onboarding/            # 4-step farm setup wizard
│   │   ├── api/
│   │   │   ├── transactions/      # Transaction CRUD & soft-delete
│   │   │   ├── receipts/[id]/     # Authenticated receipt details & voiding
│   │   │   ├── verify/[receiptNumber]/ # Public sanitized verification endpoint
│   │   │   ├── sync/batch/        # Offline batch sync with idempotency check
│   │   │   ├── receivables/       # Receivables & payment recording
│   │   │   ├── reports/weekly/    # Weekly digest aggregator & email HTML
│   │   │   └── cron/weekly-digest # Scheduled cron job webhook
│   │   ├── globals.css            # Tailwind directives & print media stylesheet
│   │   ├── layout.tsx             # Root layout with PWA meta tags
│   │   └── page.tsx               # Root redirect to /dashboard
│   ├── components/
│   │   ├── dashboard/             # StatCard, FinancialCharts, EnterpriseMatrix, RecentTx
│   │   ├── layout/                # Navbar, Sidebar, MobileBottomNav
│   │   ├── offline/               # SyncStatusPill, OfflineBanner
│   │   ├── receipts/              # ReceiptCard (branded slip, QR code, Web Share, print)
│   │   ├── receivables/           # ReceivablesTable, RecordPaymentModal
│   │   ├── reports/               # WeeklyDigestView
│   │   └── transactions/          # QuickLogForm, QuickLogModal
│   └── lib/
│       ├── offline/               # db.ts (Dexie), syncEngine.ts (offline queue)
│       ├── services/              # TransactionService, ReceiptService, QRCodeService, AnalyticsService, ReceivablesService, ReportService, AuditService
│       ├── types/                 # Domain interfaces & TypeScript types
│       └── prisma.ts              # Prisma Client singleton
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.17+ or v20+ (tested on Node.js v24)
- **npm** or **pnpm**

### 1. Installation
Clone or navigate to the project directory:
```bash
cd "c:\THE FARM"
npm install
```

### 2. Database Initialization
Generate the Prisma client and initialize the local database:
```bash
npm run prisma:generate
npm run prisma:push
```

### 3. Seed Realistic Kenyan Farm Data
Populate the database with the demo farm (**Baraka Agri-Ventures, Nakuru County**), active enterprises (Poultry, Dairy, Tilapia Aquaculture, Goats, Crops), categories, and sample transactions:
```bash
npm run seed
```

### 4. Run Automated Test Suite
Execute the unit and integration tests (21/21 assertions):
```bash
npm test
```

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing the Core Flows

### 1. Quick-Log Transaction (< 30s)
1. On the dashboard, click the **Quick Log** button (or central **(+)** button on mobile).
2. Switch between **− Expense** and **+ Sale / Income**.
3. Select an enterprise (e.g. `Poultry (Layers & Kienyeji)`).
4. Enter quantity `50` and unit price `360` $\rightarrow$ Total auto-calculates to `18,000`.
5. Select payment method `M-Pesa` and click **Record Sale**.
6. The transaction is immediately saved and visible in the ledger.

### 2. Credit Sale & Accounts Receivable
1. Open **Quick Log** and select **+ Sale / Income**.
2. Select Payment Status as **Partially Paid (Deposit)** or **Credit**.
3. Enter buyer name (e.g. `Lanet Green Grocers`).
4. Submit the transaction $\rightarrow$ Navigate to **Debtors** (`/receivables`).
5. Notice the new receivable record. Click **Record Pay** to log a partial cash or M-Pesa payment and watch the balance recalculate.

### 3. Offline Mode Verification
1. Open DevTools $\rightarrow$ **Network** tab $\rightarrow$ set throttling to **Offline**.
2. The sticky top banner appears: *"You're offline — new entries will be saved locally and sync automatically when you're connected."*
3. The sync badge displays **Offline**.
4. Log a new transaction $\rightarrow$ It saves immediately to IndexedDB and badge updates to **1 queued**.
5. Re-enable network in DevTools $\rightarrow$ The sync engine automatically flushes the queue via `POST /api/sync/batch` and transitions to **Synced**.

### 4. Weekly Report & PDF Generation
1. Navigate to **Reports** (`/reports`).
2. Review the Week-on-Week financial KPIs, top cost drivers, and debtor aging.
3. Click **Print / Save PDF** $\rightarrow$ triggers clean, 1-page printable summary formatted for field distribution or bank loan documentation.
4. Click **Email Digest** to simulate dispatching the branded HTML email to the farm owner.

---

## 🌐 Production Deployment

### 1. Environment Variables (`.env`)
```bash
DATABASE_URL="postgresql://user:password@host:5432/farmpulse?sslmode=require"
NEXT_PUBLIC_APP_NAME="FarmPulse"
NEXT_PUBLIC_DEFAULT_CURRENCY="KES"
NEXT_PUBLIC_DEFAULT_TIMEZONE="Africa/Nairobi"
CRON_SECRET="your-secure-cron-secret-token"
RESEND_API_KEY="re_your_resend_key"
```

### 2. Database Migration (PostgreSQL)
To deploy against a managed PostgreSQL instance (Supabase, Neon, AWS RDS, etc.):
```bash
npx prisma db push --schema prisma/schema.postgresql.prisma
```

### 3. Production Build
```bash
npm run build
npm start
```

---

## 📜 License
Proprietary SaaS platform built for modern African agriculture. All rights reserved.
