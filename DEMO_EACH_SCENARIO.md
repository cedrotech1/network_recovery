# How services are recorded + how to demo every test (S1–S8)

## 1. What is automatic? What is seed?

| Thing | How it appears | Dummy? |
|-------|----------------|--------|
| Users (Admin / ICT / Viewer) | **Seed / setup** once (`npm run seed`) | Setup only |
| Service list (Website, Portal, App…) | **Seed / setup** once | Setup only — like registering cameras |
| Service status (healthy / failed) | **Automatic** every few seconds | Live |
| Health check rows | **Automatic** while monitoring | Live |
| Failure rows | **Automatic** after 3 failed checks | Live |
| Recovery / auto-fixed rows | **Automatic** when system restarts or failovers | Live |
| Charts & Activity logs | Built from live DB rows | Live |
| Injected problem (S1–S8) | **You** start it in demo | Live action |

**Simple sentence for the jury:**  
“Seed only creates the empty laboratory and login accounts. Every red failure and green auto-fix you see is recorded automatically when we break a real service.”

---

## 2. Before every demo (clean start)

1. Login Admin  
2. **Settings → Reset & start fresh**  
3. Open **Problems / Fixes / Activity logs / Charts** → should be empty or nearly empty  
4. Open **Home** and leave it open  

---

## 3. How to test EACH scenario in demo

Use menu **Test a problem**. Keep **Home** + **Activity logs** open.

| Code | What to choose | Best service | What you should see | Expected auto action |
|------|----------------|--------------|---------------------|----------------------|
| **S1** | Service stopped answering | Student Portal | Status → trouble, logs show failed checks | **Restart** |
| **S2** | Service returned an error | Student Portal | Best default demo; HTTP 500 then fix | **Restart** |
| **S3** | Service was too slow | Student Portal | Slow/timeout failures | **Restart** |
| **S4** | Main fails → use backup | **Campus App (main)** | Failover to backup | **Failover** |
| **S5** | Service crashed | API Gateway or Portal | Crash then restart | **Restart** |
| **S6** | Helper dependency failed | Any monitored | Dependency / 503 style failure | **Restart** |
| **S7** | Short glitch | Student Portal | Brief fail, then OK **without** big recovery | **No recovery** (or minimal) |
| **S8** | Several fail together | (auto picks 2) | Two services fail, fixed one after another | **Sequential restart** |

### Timing to say out loud
- Checks every **5 seconds**
- Confirms failure after **3** failed checks (~15 seconds)
- Then auto-fix appears in logs (green)

### Proof pages after each test
1. **Home** — status changed live  
2. **Activity logs** — red then green rows with timestamps  
3. **Problems found** — filter by scenario S2, S4…  
4. **Fixes done** — filter Success / restart / failover  
5. **Charts** — new points appear  

---

## 4. Table filters & sorts (now in the app)

On **Our services**, **Problems**, **Fixes**, **People**, **Activity logs**:
- Search box  
- Dropdown filters (status, service, scenario, role, result…)  
- Click column headers to sort (or Newest/Oldest on logs)  

Use this in demo:  
“I can filter only S4 failover successes” → proves organized evaluation, not a fake screenshot.

---

## 5. Optional PowerShell “hard proof” for S2

```powershell
Invoke-RestMethod -Method Post http://127.0.0.1:9106/admin/inject -ContentType 'application/json' -Body '{"mode":"http500"}'
```

Watch Home 20 seconds. Then:

```powershell
Invoke-RestMethod http://127.0.0.1:9106/health
```

Should be healthy again after auto-fix.

---

## 6. Short answers to jury questions

**Q: Are these seed failures?**  
A: No. Seed creates users and service list only. Failures appear only after a live break.

**Q: Is recovery automatic?**  
A: Yes, if Settings → automatic recovery is ON.

**Q: Can it see the whole internet?**  
A: No. It watches this campus lab’s internal services (ports 9101–9106).

**Q: How do we know it works?**  
A: Clear history → inject → watch status → show new timestamped logs and charts.
