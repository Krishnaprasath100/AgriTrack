# AgriTrack — Smart Agricultural Management Platform

AgriTrack is a modern, responsive full-stack agricultural management platform designed to help farmers manage their crop cycles from seeding to harvest, record categorized input costs, track agricultural sales in Indian Rupees (₹), calculate verified net profit margins, and review chronological activity audit trails. It includes a dedicated administrator governance console for overseeing farmer accounts and monitoring platform metrics.

---

## 🏗️ Architecture & Project Structure

The project is cleanly decoupled into dedicated **frontend** and **backend** directories:

```
Agri/
├── frontend/                     # Next.js 15 Web Application
│   ├── src/
│   │   ├── app/                 # Next.js App Router pages (Dashboard, Admin, etc.)
│   │   ├── components/          # Reusable UI cards, tables, badges, modals
│   │   ├── context/             # AuthContext with session management
│   │   ├── styles/              # Design System (Poppins + Inter typography)
│   │   ├── types/               # TypeScript interfaces
│   │   └── lib/                 # Client services & utilities
│   ├── public/                  # Static assets & icons
│   ├── next.config.mjs          # Proxy rewrites routing /api/* to Express backend
│   └── package.json             # Frontend dependencies
│
├── backend/                      # Node.js + Express REST API Server
│   ├── src/
│   │   ├── routes/              # Express API route modules
│   │   │   ├── auth.ts          # /api/auth (login, register)
│   │   │   ├── admin.ts         # /api/admin/users (status toggle, user directory)
│   │   │   ├── cropCycles.ts    # /api/crop-cycles (CRUD)
│   │   │   ├── expenses.ts      # /api/expenses (CRUD)
│   │   │   ├── income.ts        # /api/income (CRUD)
│   │   │   ├── profit.ts        # /api/profit (analytics)
│   │   │   └── dashboard.ts     # /api/dashboard/summary (metrics)
│   │   ├── db/                  # PostgreSQL client pool & query helpers
│   │   ├── lib/                 # Server store, demo seeds, validations
│   │   └── server.ts            # Express server (CORS, body parser, logging)
│   ├── data/                    # File-based persistent storage (users.json)
│   ├── scripts/                 # Database initialization script (init-db.mjs)
│   ├── schema.sql               # PostgreSQL database schema
│   └── package.json             # Backend dependencies
│
├── package.json                 # Root orchestrator with concurrent dev scripts
└── README.md
```

---

## 🌟 Key Features

1. **Precision Crop Cycle Management**
   - Track plantings (Basmati Rice, Wheat, Cotton, Sugarcane, etc.).
   - Growth progress timeline (Seeding, Vegetative Growth, Expected Harvest, Actual Harvest).
   - Remaining days countdown and automatic overdue harvest alerts.

2. **Categorized Farming Expense Ledger**
   - 11 specialized categories: *Seeds, Fertilizers, Pesticides, Labour, Irrigation, Equipment, Machinery rental, Transportation, Electricity, Land preparation, Other*.
   - Labour count and duration tracking for wage accounting.
   - All amounts formatted in Indian Rupees (₹).

3. **Agricultural Income & Mandi Sales Management**
   - Automatic formula: `Total Income = Quantity Sold × Unit Selling Price`.
   - Units: `quintal`, `tonne`, `kg`, `bags`, `crates`.
   - Buyer and mandi trader logging.

4. **True Net Profit Analysis**
   - `Net Profit = Total Income - Total Expenses`.
   - `Crop Profit = Income linked to crop - Expenses linked to crop`.
   - Most profitable crop highlighting.

5. **Administrator Console & Governance**
   - Dedicated management console restricted to platform administrators.
   - Farmer account directory with real-time status (`Active` / `Deactivated`).
   - Server-side account deactivation and activation.

---

## 🚀 Getting Started

### 1. Install Dependencies

Install all dependencies for both frontend and backend in one command:
```bash
npm run install:all
```

### 2. Run Both Frontend & Backend Concurrently

Start both the Express backend (port `5000`) and the Next.js frontend (port `3000`):
```bash
npm run dev
```

The terminal will launch both servers:
- **Frontend App**: `http://localhost:3000`
- **Backend API**: `http://localhost:5000`
- **API Health**: `http://localhost:5000/api/health`

### 3. Individual Service Commands

- **Run only frontend**: `npm run dev:frontend`
- **Run only backend**: `npm run dev:backend`
- **Build both**: `npm run build`
- **Initialize PostgreSQL DB**: `npm run db:init`

---

## 🐘 Database Configuration (Optional)

AgriTrack works out of the box with built-in persistent local storage. To connect your PostgreSQL database:

1. Create a `.env.local` inside the `backend/` directory:
```env
DATABASE_URL=postgres://username:password@localhost:5432/agritrack
PORT=5000
```
2. Initialize tables and seed data:
```bash
npm run db:init
```
