# Automatic Network Failure and Recovery System (ANFARS)
University of Kigali LAN laboratory prototype — **Node.js + Express + Sequelize + PostgreSQL + React**

> No Docker required. Simulated network nodes run as local Node.js processes.

## Stack

| Layer | Technology |
|-------|------------|
| Backend | Node.js, Express, Socket.IO |
| ORM / DB | Sequelize + PostgreSQL |
| Frontend | React (Vite) + Tailwind |
| Simulated LAN | `simulated-nodes` (ports 9101–9106) |

## 1. Database

PostgreSQL must be running locally. Create DB (already done if you used the setup script):

```sql
CREATE DATABASE network_recovery;
```

Configure `backend/.env`:

```
DEV_DATABASE_NAME=network_recovery
DEV_DATABASE_USER=postgres
DEV_DATABASE_PASSWORD=password
DEV_DATABASE_HOST=127.0.0.1
DEV_DATABASE_PORT=5432
```

## 2. Install & seed

```bash
# Terminal A — simulated nodes
cd simulated-nodes
npm install
npm start

# Terminal B — API
cd backend
npm install
npm run seed
npm run start:dev

# Terminal C — dashboard
cd frontend
npm install
npm run dev
```

## Live proof (not dummy data)

Seed only creates **users + service list**. It does **not** invent failures/charts.

Before a presentation:
1. Login as Admin → **Test a problem** → **Clear history**
2. Show empty Problems / Fixes / Charts
3. Start a LIVE test (or PowerShell inject)
4. Watch Home recover automatically
5. Show new timestamped rows + charts

Full script: see `PRESENTATION_DEMO.md`

## Features

- Periodic HTTP health checks
- Threshold-based failure detection (consecutive failed checks)
- Automatic **restart** and **failover** recovery
- Failure injection scenarios S1–S8
- Real-time dashboard (Socket.IO)
- Failure / recovery history and evaluation metrics stored in PostgreSQL
