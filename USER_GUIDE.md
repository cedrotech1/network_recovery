# Plain-language guide — Automatic Network Failure and Recovery System

## What is this? (for anyone)

Imagine university digital services are like shops in a mall:

- Student Portal
- University Website
- Campus App
- Internal API (the “messenger” between systems)

If a shop suddenly closes and nobody notices until morning, students and staff suffer.

This project is a **night guard + repair worker in software**:

1. It checks each service every few seconds: “Are you OK?”
2. If the answer fails several times, it confirms a **real problem**
3. It tries to **restart** the service, or **switch to a backup**
4. It saves history and draws **charts** so managers can understand performance

---

## What network do we detect?

| We DO watch | We do NOT watch (in this project) |
|-------------|-----------------------------------|
| Internal University of Kigali **LAN lab** services | The whole internet |
| Simulated campus services on this PC (ports 9101–9106) | ISP outages (MTN/Airtel) |
| Website / portal / app / API style services | Home Wi‑Fi problems |
| Failures we inject for testing | Physical cable cuts / router hardware faults |

So when someone asks: “Can it see other networks?”  
Answer: **Not by default.** This research is for a controlled campus lab. The same idea could later watch more internal services if you add their addresses.

---

## Users and roles

| Role | Email | Password | What they can do |
|------|-------|----------|------------------|
| Administrator | `admin@uok.ac.rw` | `Admin@123` | Everything (users, settings, tests) |
| ICT Officer | `ict@uok.ac.rw` | `Ict@12345` | Watch + run tests + recover + settings |
| Viewer | `viewer@uok.ac.rw` | `View@12345` | Watch only (great for non-technical demos) |

---

## How to demo (10 minutes)

1. Start 3 terminals: `simulated-nodes`, `backend`, `frontend`
2. Login as Admin
3. Open **Home overview** — show services working
4. Open **Simple guide** — explain in your own words
5. Open **Test a problem** → choose **S2** on Student Portal → Start
6. Wait ~20 seconds → Home shows trouble then recovery
7. Open **Problems found** and **Fixes done**
8. Open **Charts & statistics** and explain:
   - problems over time
   - time to notice
   - time to fix
   - success rate
9. Optional: **S4** on Campus App (main) to show backup takeover
10. Login as Viewer to show a manager-safe read-only view

---

## Short presentation speech

> “Existing tools often only alert a person. In many Rwandan small organizations, that person is not available 24/7. Our system watches University of Kigali lab services, confirms real failures, and recovers automatically by restart or failover. We evaluate detection time, recovery time, and success rate using charts stored in PostgreSQL.”

---

## Menu meaning (human words)

- **Home overview** — are services OK right now?
- **Simple guide** — explanation for non-technical people
- **Our services** — list of watched campus services
- **Problems found** — history of confirmed failures
- **Fixes done** — what automatic recovery did
- **Test a problem** — intentionally break something for evaluation
- **Charts & statistics** — graphs over time
- **Settings** — how sensitive the detector is
- **People & roles** — who can do what
