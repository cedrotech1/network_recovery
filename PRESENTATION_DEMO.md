# Live presentation demo — prove it is NOT dummy data

## Important: what “seed” means here

Seed is ONLY for setup:
- login users
- list of services to watch

Seed does **NOT** create fake failures, fake recoveries, or fake charts.
Charts fill only after you **break a real service live**.

Before presenting, click **Clear history** so the room sees empty charts first.

---

## Start the 3 programs

```bash
cd simulated-nodes
npm start

cd backend
npm run start:dev

cd frontend
npm run dev
```

Open: http://127.0.0.1:5173/login  
Admin: `admin@uok.ac.rw` / `Admin@123`

---

## 8-minute convincing script

### Minute 0–1 — Show empty baseline
1. Login as Admin  
2. Go to **Test a problem** → **Clear history**  
3. Open **Problems found**, **Fixes done**, **Charts**  
4. Say: *“Right now there is no history. Anything that appears next is from this live test.”*

### Minute 1–2 — Show healthy services
1. Open **Home overview**  
2. All services should say Working well  
3. Optionally open browser to `http://127.0.0.1:9106/health` — show `"status":"healthy"`

### Minute 2–4 — Kill / break a service LIVE
**Easiest (from UI):**
1. **Test a problem** → S2 → Student Portal → **Start LIVE test**
2. Keep **Home** open

**Harder proof (from PowerShell while panel watches):**
```powershell
Invoke-RestMethod -Method Post http://127.0.0.1:9106/admin/inject -ContentType 'application/json' -Body '{"mode":"http500"}'
Invoke-RestMethod http://127.0.0.1:9106/health
```
Second command should show error / not healthy.

### Minute 4–5 — Watch automatic recovery
Within ~15–25 seconds (3 failed checks × ~5s):
- Home status becomes Having trouble / Not working / Being fixed
- Then returns to Working well
- Say: *“Nobody clicked Fix. The system recovered by itself.”*

Confirm health again:
```powershell
Invoke-RestMethod http://127.0.0.1:9106/health
```

### Minute 5–7 — Show proof records
1. **Problems found** — new row with **today’s time**  
2. **Fixes done** — restart/failover success with duration ms  
3. **Charts & statistics** — graphs now have points (were empty before)

That sequence proves: empty → live break → detect → recover → recorded.

### Minute 7–8 — Failover demo (optional wow moment)
1. Test **S4** on **Campus App (main)**  
2. Explain: main fails → backup takes over  
3. Show recovery action type = failover

---

## What to say when someone asks “Is this dummy?”

> “We cleared history first. Then we broke the Student Portal health endpoint on this machine. You saw the live health URL fail, then the dashboard recover, and a new PostgreSQL record appeared with this exact timestamp. Charts were empty before that event.”

---

## Roles during Q&A

| Account | Use for |
|---------|---------|
| Admin | Clear history, run tests, manage users |
| ICT Officer `ict@uok.ac.rw` / `Ict@12345` | Run tests like a technician |
| Viewer `viewer@uok.ac.rw` / `View@12345` | Show manager can watch only |

---

## Quick troubleshooting

| Symptom | Fix |
|---------|-----|
| Inject fails | Make sure `simulated-nodes` is running |
| Never recovers | Check Settings: auto recovery ON, threshold 3, interval 5000 |
| Charts empty after test | Wait for recovery to finish, then refresh Charts |
| Port busy | Restart the 3 terminals |
