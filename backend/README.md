# Automatic Network Failure and Recovery System — Backend

Node/Express + Sequelize (PostgreSQL) API for the University of Kigali LAN laboratory prototype (ANFARS).

## Setup

```bash
npm install
# Configure .env (see .env.example) — database: network_recovery
npm run seed
npm run start:dev
```

Default accounts after seed:

- Admin: `admin@uok.ac.rw` / `Admin@123`
- ICT Officer: `ict@uok.ac.rw` / `Ict@12345`
- Viewer: `viewer@uok.ac.rw` / `View@12345`

Demo screenshot data:

```bash
npm run seed:demo
```

## Main API (`/api/v1`)

| Area | Notes |
|------|--------|
| Auth | Login, users (admin) |
| Network | Nodes, failures, recoveries, health checks, logs |
| Metrics | Charts KPIs |
| Report | General report (admin) |
| Experiments | Failure injection S1–S8 |
