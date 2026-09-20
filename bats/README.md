# ANFARS Windows batch helpers

Double-click from the `bats` folder.

## Ports

| Service | Port |
|---------|------|
| Frontend UI | **5473** |
| Backend API | **9500** |
| Simulate control | **9399** |
| Lab nodes | **9401–9406** |

Login: http://127.0.0.1:5473/login  
`admin@uok.ac.rw` / `Admin@123`

## Start / stop (no port conflicts)

| File | Purpose |
|------|---------|
| `start-all.bat` | Free stuck API/UI → start simulate (skip if already up) → backend → frontend |
| `restart-app.bat` | Stop UI+API only, then start them again (**simulate stays**) |
| `start-simulate.bat` | Start lab nodes only (skips if control :9399 already healthy) |
| `start-backend.bat` | Free :9500 then start API |
| `start-frontend.bat` | Free :5473 then start UI |
| `kill-app.bat` / `stop-app.bat` | **Stop UI + API only — keep simulate running** |
| `kill-all.bat` | Stop everything including simulate |
| `open-ui.bat` | Open login page |

## Recommended daily use

1. First time / full reboot: `start-all.bat`  
2. Stuck UI/API but nodes OK: `restart-app.bat` or `kill-app.bat` then `start-backend.bat` + `start-frontend.bat`  
3. End of work, keep lab nodes for next test: `stop-app.bat`  
4. Full shutdown: `kill-all.bat`

## Data / tests

| File | Purpose |
|------|---------|
| `seed.bat` | Base users + nodes |
| `seed-demo.bat` | Screenshot demo history |
| `test-health.bat` | Check API, UI, control, all nodes |
| `test-s2-inject.bat` | Portal HTTP 500 auto-restart demo |
| `test-s4-failover.bat` | Campus App failover demo |
| `test-recover-portal.bat` | Manual portal recover |
