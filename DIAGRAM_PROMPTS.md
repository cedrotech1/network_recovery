# ChatGPT Diagram Prompts — ANFARS (Chapter 4)

Use these prompts in **ChatGPT** (or another image generator) to create dissertation diagrams that look like **draw.io / diagrams.net**: clean, straight connectors, white background, academic style.

---

## How to use (important)

1. Copy **ONE prompt at a time** (do not paste all prompts together).
2. Prefer: **ChatGPT → Create image** / DALL·E, or ask: *“Generate this as a clean technical diagram image.”*
3. If text is messy, reply: *“Redraw the same diagram with clearer labels, larger fonts, no overlapping text, still white background, draw.io style.”*
4. Save each image as: `Figure_4_3.png`, `Figure_4_4.png`, etc.
5. Paste into Word under the matching caption in `CHAPTER_4_AND_5.md`.

### Screenshots (do NOT generate with ChatGPT)

These must come from your running system:

| Figure | Source |
|--------|--------|
| 4.1, 4.2 | Charts page, Activity logs |
| 4.14–4.28 | Login + Admin / ICT / Viewer pages |
| 4.29–4.31 | IDE / Postman / acceptance evidence |

---

## GLOBAL STYLE (paste at the top of every prompt)

```text
Create a professional academic system-design diagram that looks exactly like it was drawn in draw.io / diagrams.net.

STRICT STYLE RULES:
- Pure white background (#FFFFFF)
- Clean flat 2D shapes only (rectangles, rounded rectangles, ellipses, diamonds, cylinders for data stores)
- Thin black or dark-gray borders (1–2 px)
- Straight orthogonal connectors (horizontal/vertical lines with right-angle bends), no curved spaghetti lines
- Small solid arrowheads on flow direction
- Sans-serif labels (like Arial/Helvetica), readable, no decorative fonts
- Soft light-gray or pale-blue fill for process boxes; white fill for actors/external entities; cylinder for database
- No 3D, no shadows, no neon, no gradients, no icons that look like clipart, no watermark, no logo clutter
- Plenty of white space, aligned layout, no overlapping text
- Title at the top in bold
- Caption-friendly: suitable for a university dissertation (University of Kigali, ANFARS project)
- Output as a single clear diagram image, landscape orientation preferred
```

---

# FIGURE 4.3 — Existing (As-Is) Manual Recovery Process

**Use for:** Section 4.5  
**Caption:** Figure 4.3 – Existing operational recovery process (manual).

### Prompt

```text
[PASTE GLOBAL STYLE HERE]

Title: Figure 4.3 – Existing Manual Network Recovery Process (As-Is)

Draw a left-to-right flowchart for the CURRENT manual operations at a small university/LAN lab before ANFARS:

Boxes in order (use rounded rectangles for steps, diamond for decision):
1. "LAN Service fails (Website / Portal / Campus App)"
2. "End users notice outage or complain"
3. "Basic alert or phone call reaches ICT Officer" (optional note: may be delayed)
4. Diamond decision: "Is ICT Officer available now?"
   - NO → "Wait / escalate / downtime continues"
   - YES → continue
5. "ICT Officer investigates manually"
6. "Manual restart of process / service / machine"
7. "Service restored"
8. "Little or no structured historical evidence stored"

Style notes:
- Put a red dashed box around steps 2–6 labeled "Human-dependent delay (MTTR high)"
- Keep labels short and clear
- Use numbered steps 1–8
```

---

# FIGURE 4.4 — Proposed (To-Be) Automatic Recovery Cycle

**Use for:** Section 4.6  
**Caption:** Figure 4.4 – Proposed automatic recovery cycle.

### Prompt

```text
[PASTE GLOBAL STYLE HERE]

Title: Figure 4.4 – Proposed Automatic Recovery Cycle (To-Be) — ANFARS

Draw a circular or clockwise loop flowchart with 5 main stages connected by arrows:

1. MONITOR — "Periodic HTTP /health checks (default every 5 seconds)"
2. DETECT — "Confirm failure after consecutive failed checks (default threshold = 3)"
3. RECOVER — "Auto Restart OR Auto Failover based on recovery_policy"
4. RECORD — "Save health_checks, failure_events, recovery_actions in PostgreSQL"
5. DISPLAY — "React dashboard: live status, activity logs, charts (Socket.IO)"

Also show a small side note box:
"Roles: Administrator, ICT Officer, Viewer"
and another note:
"Controlled experiments S1–S8 for evaluation"

Center text (optional): "ANFARS Automatic Cycle"
Use green accents for RECOVER success path only (still flat, not glowing).
```

---

# FIGURE 4.5 — Context Diagram (DFD Level 0)

**Use for:** Section 4.7.1  
**Caption:** Figure 4.5 – System context diagram for ANFARS.

### Prompt

```text
[PASTE GLOBAL STYLE HERE]

Title: Figure 4.5 – Context Diagram (DFD Level 0) — ANFARS

Draw a classic Yourdon/DeMarco context diagram:

CENTER:
- One large rounded rectangle labeled:
  "0. Automatic Network Failure and Recovery System (ANFARS)
   (Monitor + Detect + Recover + Dashboard + API)"

EXTERNAL ENTITIES (rectangles around the center):
1. Left: "Network / Service Nodes
   (Simulated UoK LAN services on ports 9101–9106:
   Website, Campus App, API Gateway, Student Portal, Standbys)"
2. Top-right: "Administrator"
3. Right: "ICT Officer"
4. Bottom-right: "Viewer"

DATA FLOWS (labeled arrows):
From Users (Admin/ICT/Viewer) → System:
- Login credentials
- View dashboard requests
- Inject failure test (S1–S8) [Admin/ICT only]
- Update settings / reset history [Admin/ICT]
- Manage users [Admin only]

From System → Users:
- Live service status
- Activity logs
- Charts / KPIs
- Alerts on screen

From System → Network Nodes:
- Health check requests (GET /health)
- Recover commands (POST /admin/recover)
- Inject commands (POST /admin/inject)
- Failover / promote standby commands

From Network Nodes → System:
- Health responses (status, latency, errors)

Do NOT draw internal processes. Keep it Level-0 only.
Legend in corner: Rectangle = External Entity, Rounded box = System, Arrow = Data flow
```

---

# FIGURE 4.6 — DFD Level 1

**Use for:** Section 4.7.1  
**Caption:** Figure 4.6 – Level-1 data flow diagram.

### Prompt

```text
[PASTE GLOBAL STYLE HERE]

Title: Figure 4.6 – Data Flow Diagram Level 1 — ANFARS

Draw a DFD Level-1 with these PROCESS bubbles/boxes (numbered):

P1 Authenticate User
P2 Monitor Node Health
P3 Detect Confirmed Failure
P4 Execute Recovery (Restart/Failover)
P5 Store Operational Records
P6 Present Dashboard / Logs / Charts
P7 Manage Experiments and Settings

DATA STORES (open-ended rectangles or cylinders):
D1 Users
D2 Network Nodes
D3 Health Checks
D4 Failure Events
D5 Recovery Actions
D6 System Settings

EXTERNAL ENTITIES:
E1 Administrator / ICT Officer / Viewer
E2 Network Service Nodes

KEY FLOWS (must appear):
- E1 → P1: email + password
- P1 → D1: verify user
- P1 → E1: JWT session / role
- P2 ↔ E2: poll /health and receive response
- P2 → D3: write health_check
- P2 → D2: update node status / consecutive_failures
- P2 → P3: fail streak data
- P3 → D4: create failure_event
- P3 → P4: confirmed failure + policy
- P4 ↔ E2: recover or failover commands
- P4 → D5: create recovery_action
- P5 reads/writes D2–D6 as needed
- P6 ← D2,D3,D4,D5: status, logs, charts data
- P6 → E1: dashboard UI updates (also via Socket.IO note)
- E1 → P7: inject scenario / change settings / reset
- P7 → E2: inject failure
- P7 → D6: update settings
- P7 → D4/D5: clear history on reset

Layout: place processes in a clear left-to-right / top-to-bottom grid. Avoid crossing lines where possible.
Include a small legend for process, data store, external entity, data flow.
```

---

# FIGURE 4.7 — DFD Level 2 (Detect & Recover)

**Use for:** Section 4.7.1  
**Caption:** Figure 4.7 – Detailed data flows for detection and recovery.

### Prompt

```text
[PASTE GLOBAL STYLE HERE]

Title: Figure 4.7 – DFD Level 2: Detect Confirmed Failure & Execute Recovery

Expand processes P3 and P4 into detailed sub-processes:

DETECTION SIDE:
3.1 Receive latest health result for a node
3.2 Update consecutive_failures counter
3.3 Compare consecutive_failures with failureThreshold (default 3)
3.4 Diamond: "Threshold reached?"
    - No → wait for next monitor cycle
    - Yes → 3.5 Create failure_event (failure_type, scenario_code, detection_time_ms)
3.6 Mark node status = failed
3.7 Emit realtime "failure detected" event

RECOVERY SIDE:
4.1 Read recovery_policy from network_nodes (restart OR failover)
4.2 Diamond: "Policy = failover AND standby exists?"
    - Yes → 4.3 Prepare standby / promote standby / mark primary failed_over
    - No  → 4.4 Call node recover endpoint (POST /admin/recover)
4.5 Wait for health to become successful
4.6 Create recovery_actions record (action_type, success, duration_ms)
4.7 Resolve linked failure_event (resolved_at)
4.8 Emit Socket.IO update to dashboard

DATA STORES shown:
D2 Network Nodes
D4 Failure Events
D5 Recovery Actions
D6 System Settings (failureThreshold, checkIntervalMs, autoRecoveryEnabled)

EXTERNAL:
E2 Network Service Nodes
E1 Dashboard User (receives live update)

Default settings note box:
checkIntervalMs = 5000
failureThreshold = 3
autoRecoveryEnabled = true
```

---

# FIGURE 4.8 — Use Case Diagram

**Use for:** Section 4.7.2  
**Caption:** Figure 4.8 – Use case diagram of ANFARS.

### Prompt

```text
[PASTE GLOBAL STYLE HERE]

Title: Figure 4.8 – Use Case Diagram — Automatic Network Failure and Recovery System (ANFARS)

Draw a UML use-case diagram:

SYSTEM BOUNDARY rectangle labeled: "ANFARS"

ACTORS (stick figures) outside boundary:
- Left: Administrator
- Left below: ICT Officer
- Left bottom: Viewer
- Right: "Automated System Engine" (monitoring/detection/recovery)

USE CASES (ovals) inside boundary:
UC1 Login
UC2 View live service status
UC3 View activity logs
UC4 Inject failure scenario (S1–S8)
UC5 Automatic failure detection
UC6 Automatic recovery (restart)
UC7 Automatic recovery (failover)
UC8 View problems found
UC9 View fixes done
UC10 View evaluation charts
UC11 Update system settings
UC12 Reset history for clean demo
UC13 Manage users

ASSOCIATIONS:
Administrator → UC1, UC2, UC3, UC4, UC8, UC9, UC10, UC11, UC12, UC13
ICT Officer → UC1, UC2, UC3, UC4, UC8, UC9, UC10, UC11, UC12
Viewer → UC1, UC2, UC3, UC8, UC9, UC10
Automated System Engine → UC5, UC6, UC7

Include relationships:
- UC6 and UC7 <<include>> or follow from UC5 (show dashed <<include>> from UC6/UC7 to UC5, or association from UC5 to both)
- Note near UC13: "Admin only"
- Note near UC4: "Admin and ICT Officer"

Keep layout neat: actors left/right, use cases centered in two columns inside the boundary.
```

---

# FIGURE 4.9 — Sequence Diagram (Automatic Restart / S2)

**Use for:** Section 4.7.2  
**Caption:** Figure 4.9 – Sequence diagram for threshold detection and restart.

### Prompt

```text
[PASTE GLOBAL STYLE HERE]

Title: Figure 4.9 – Sequence Diagram: Automatic Restart after Scenario S2 (HTTP 500)

Draw a UML sequence diagram with lifelines (vertical dashed lines) and top actor/object boxes:

Lifelines from left to right:
1. ICT Officer / Admin (UI)
2. React Dashboard
3. Express API / Experiments
4. Simulated Student Portal Node (port 9106)
5. Monitoring Engine
6. Detection Engine
7. Recovery Engine
8. PostgreSQL Database
9. Socket.IO

Messages in order (numbered):
1. ICT Officer clicks "Test a problem" → inject S2 (HTTP 500) on Student Portal
2. API → Portal: POST /admin/inject {mode:"http500"}
3. Portal returns inject accepted
4. loop [every checkIntervalMs ≈ 5s]:
   Monitoring Engine → Portal: GET /health
   Portal → Monitoring Engine: HTTP 500 / failure
   Monitoring Engine → Database: INSERT health_checks (success=false)
   Monitoring Engine → Detection Engine: consecutive_failures++
5. alt [consecutive_failures >= failureThreshold (3)]:
   Detection Engine → Database: INSERT failure_events
   Detection Engine → Recovery Engine: confirmed failure (policy=restart)
   Recovery Engine → Portal: POST /admin/recover
   Portal → Recovery Engine: recovered / healthy
   Recovery Engine → Database: INSERT recovery_actions (success=true, duration_ms)
   Recovery Engine → Socket.IO: emit status update
   Socket.IO → React Dashboard: live refresh (green AUTO FIXED)
6. Dashboard shows: service healthy again + activity log entry

Add a note:
"Default settings: check every 5s, threshold = 3 consecutive fails"
Scenario note: "S2 = Service returns HTTP error → Restart"
```

---

# FIGURE 4.10 — Sequence Diagram (Failover / S4)

**Use for:** Section 4.7.2  
**Caption:** Figure 4.10 – Sequence diagram for primary-to-standby failover.

### Prompt

```text
[PASTE GLOBAL STYLE HERE]

Title: Figure 4.10 – Sequence Diagram: Automatic Failover (Scenario S4)

UML sequence diagram with lifelines:
1. ICT Officer / Admin
2. Monitoring Engine
3. Detection Engine
4. Recovery Engine
5. Campus App Primary (main)
6. Campus App Standby (backup)
7. PostgreSQL
8. React Dashboard (via Socket.IO)

Messages:
1. Failure injected or occurs on Campus App Primary
2. Monitoring Engine polls Primary /health → fails repeatedly
3. Detection Engine confirms threshold reached
4. Detection Engine → PostgreSQL: create failure_event (scenario_code=S4)
5. Recovery Engine reads recovery_policy = "failover" and standby_key
6. Recovery Engine → Standby: prepare / activate / begin monitoring standby
7. Recovery Engine updates Primary: status = failed_over, failed_over_to_key = standby key
8. Recovery Engine updates Standby: is_monitored/active as needed
9. Recovery Engine → PostgreSQL: create recovery_actions (action_type=failover, success=true, target_node_key=standby)
10. Socket.IO pushes update
11. Dashboard shows "Using backup" / standby healthy

Note box:
"Failover path is used when a standby node exists; restart path is used otherwise."
```

---

# FIGURE 4.11 — Entity Relationship Diagram (ERD)

**Use for:** Section 4.7.5  
**Caption:** Figure 4.11 – ERD of the ANFARS PostgreSQL schema.

### Prompt

```text
[PASTE GLOBAL STYLE HERE]

Title: Figure 4.11 – Entity Relationship Diagram (Conceptual/Logical ERD) — ANFARS

Draw a clean ERD with entity rectangles. Each entity shows entity name on top bar and key attributes listed below.
Mark PK and FK clearly.

ENTITIES AND ATTRIBUTES:

1) users
- id (PK, UUID)
- names
- email (unique)
- password (hashed)
- role (admin | ict_officer | viewer)
- phone
- active
- deleted
- created_at, updated_at

2) network_nodes
- id (PK, UUID)
- key (unique)
- name
- description
- host, port
- health_path, recover_path, inject_path
- role (primary | standby)
- standby_key
- recovery_policy (restart | failover)
- status
- consecutive_failures
- last_checked_at, last_latency_ms
- is_active, is_monitored
- failed_over_to_key
- created_at, updated_at

3) health_checks
- id (PK, UUID)
- node_id (FK → network_nodes.id)
- success
- status_code
- latency_ms
- error_message
- checked_at
- created_at

4) failure_events
- id (PK, UUID)
- node_id (FK → network_nodes.id)
- failure_type
- scenario_code (S1–S8)
- consecutive_fails
- injected_at, detected_at
- detection_time_ms
- is_false_positive
- resolved_at
- details
- created_at, updated_at

5) recovery_actions
- id (PK, UUID)
- node_id (FK → network_nodes.id)
- failure_event_id (FK → failure_events.id, nullable)
- action_type (restart | failover)
- success
- started_at, completed_at
- duration_ms
- target_node_key
- details
- created_at, updated_at

6) system_settings
- id (PK, UUID)
- key (unique)
- value
- description
- created_at, updated_at

RELATIONSHIPS (crow’s foot notation preferred):
- network_nodes 1 ——< health_checks (one node has many health checks)
- network_nodes 1 ——< failure_events
- network_nodes 1 ——< recovery_actions
- failure_events 1 ——< recovery_actions (usually one recovery per failure)
- users is standalone (authentication entity, no mandatory FK to others)
- system_settings is standalone configuration entity

Optional self-reference note on network_nodes:
"standby_key logically links a primary node to its standby node"

Layout: put network_nodes in the center; surround with health_checks, failure_events, recovery_actions; users and system_settings on the sides.
Database name note: network_recovery (PostgreSQL)
```

---

# FIGURE 4.12 — Physical Data Model

**Use for:** Section 4.7.6  
**Caption:** Figure 4.12 – Physical tables in PostgreSQL.

### Prompt

```text
[PASTE GLOBAL STYLE HERE]

Title: Figure 4.12 – Physical Data Model (PostgreSQL) — database: network_recovery

Draw a physical database schema diagram (like pgAdmin / DBeaver / draw.io database mode).

Show 6 table boxes with physical column names in snake_case and SQL types:

TABLE users
- id UUID PK
- names VARCHAR(120) NOT NULL
- email VARCHAR(160) UNIQUE NOT NULL
- password VARCHAR(255) NOT NULL
- role VARCHAR(40) NOT NULL
- phone VARCHAR(40) NULL
- active BOOLEAN NOT NULL
- deleted VARCHAR(10) NOT NULL
- created_at TIMESTAMP
- updated_at TIMESTAMP

TABLE network_nodes
- id UUID PK
- key VARCHAR(80) UNIQUE NOT NULL
- name VARCHAR(160) NOT NULL
- description TEXT
- host VARCHAR(120) NOT NULL
- port INTEGER NOT NULL
- health_path VARCHAR(120)
- recover_path VARCHAR(120)
- inject_path VARCHAR(120)
- role VARCHAR(20)
- standby_key VARCHAR(80)
- recovery_policy VARCHAR(40)
- status VARCHAR(40)
- consecutive_failures INTEGER
- last_checked_at TIMESTAMP
- last_latency_ms INTEGER
- is_active BOOLEAN
- is_monitored BOOLEAN
- failed_over_to_key VARCHAR(80)
- created_at / updated_at TIMESTAMP

TABLE health_checks
- id UUID PK
- node_id UUID FK → network_nodes.id
- success BOOLEAN
- status_code INTEGER
- latency_ms INTEGER
- error_message TEXT
- checked_at TIMESTAMP
- created_at TIMESTAMP

TABLE failure_events
- id UUID PK
- node_id UUID FK → network_nodes.id
- failure_type VARCHAR(60)
- scenario_code VARCHAR(20)
- consecutive_fails INTEGER
- injected_at TIMESTAMP
- detected_at TIMESTAMP
- detection_time_ms INTEGER
- is_false_positive BOOLEAN
- resolved_at TIMESTAMP
- details TEXT
- created_at / updated_at TIMESTAMP

TABLE recovery_actions
- id UUID PK
- node_id UUID FK → network_nodes.id
- failure_event_id UUID FK → failure_events.id (nullable)
- action_type VARCHAR(40)
- success BOOLEAN
- started_at TIMESTAMP
- completed_at TIMESTAMP
- duration_ms INTEGER
- details TEXT
- target_node_key VARCHAR(80)
- created_at / updated_at TIMESTAMP

TABLE system_settings
- id UUID PK
- key VARCHAR(80) UNIQUE
- value TEXT
- description VARCHAR(255)
- created_at / updated_at TIMESTAMP

Show FK lines with arrow to parent PK.
Footer note: "Mapped by Sequelize ORM (underscored columns)"
Make table headers dark-blue with white text (still flat, academic).
```

---

# FIGURE 4.13 — Front-End Architecture

**Use for:** Section 4.8  
**Caption:** Figure 4.13 – React front-end architecture.

### Prompt

```text
[PASTE GLOBAL STYLE HERE]

Title: Figure 4.13 – Front-End Architecture of ANFARS (React SPA)

Draw a layered block diagram (top to bottom):

LAYER 1 — Browser UI Shell
- Sidebar Navigation
- Header / User Menu
- Main Content Area

LAYER 2 — Pages
Boxes in a row:
Home | Our Services | Activity Logs | Problems Found | Fixes Done | Test a Problem | Charts & Statistics | Settings | People & Roles | Guide | Profile

LAYER 3 — Shared Components / Hooks
- Table filter & sort controls
- Charts (Recharts)
- Notifications
- Auth / role-gated menus
- Socket.IO realtime hook

LAYER 4 — Client Services
- Axios API client → "/api/v1"
- Auth token (JWT) handling

LAYER 5 — Backend boundary (shown below a dashed line)
- Express REST API
- Socket.IO server
- Monitoring / Detection / Recovery engines
- PostgreSQL

Also show a small role matrix box:
Administrator = full access including Users
ICT Officer = monitor + test + settings (no Users)
Viewer = read-only dashboards/logs/charts

Arrows:
Pages → Components
Components/Pages → Axios
Axios → Express API
Socket.IO ↔ Dashboard live updates
```

---

# BONUS A — Overall System Architecture (recommended for Chapter 4.6)

**Suggested caption:** Figure 4.X – Overall system architecture of ANFARS.

### Prompt

```text
[PASTE GLOBAL STYLE HERE]

Title: Overall System Architecture — ANFARS (University of Kigali LAN Lab Prototype)

Draw a 3-tier architecture diagram:

LEFT / TOP: Client Tier
- Web Browser
- React + Vite + Tailwind dashboard

MIDDLE: Application Tier
Boxes:
- Express.js REST API
- JWT Authentication
- Monitoring Engine
- Detection Engine
- Recovery Engine
- Socket.IO Realtime Channel
- Failure Injection / Experiments module

RIGHT / BOTTOM: Data Tier
- PostgreSQL database "network_recovery"
  (users, network_nodes, health_checks, failure_events, recovery_actions, system_settings)

FAR RIGHT: Simulated Network Layer
Six small node boxes:
- Website :9101
- Campus App (primary) :9102
- API Gateway :9103
- Student Portal :9104 or 9106 (use actual ports if known)
- Standby services :9105–9106
Label: "Local Node.js simulated LAN services (no Docker required)"

Arrows:
Browser ↔ API (HTTPS/HTTP JSON)
Browser ↔ Socket.IO
Engines → Nodes (health/recover/inject)
Engines ↔ PostgreSQL
```

---

# BONUS B — Module Interaction Diagram

### Prompt

```text
[PASTE GLOBAL STYLE HERE]

Title: ANFARS Functional Modules Interaction

Boxes with arrows:

Simulated Network Layer
→ Monitoring Engine
→ Failure Detection Engine
→ Automatic Recovery Engine
→ PostgreSQL Data Layer
→ REST API + Socket.IO
→ Administrator Dashboard (React)

Also connect:
Failure Injection / Experiments → Simulated Network Layer
Authentication & Roles → REST API
Dashboard ← Socket.IO live events

Keep it horizontal pipeline style, draw.io look, white background.
```

---

# BONUS C — Database Normalization Illustration (for 4.7.3)

### Prompt

```text
[PASTE GLOBAL STYLE HERE]

Title: Database Normalization Example in ANFARS (1NF → 2NF → 3NF)

Create a three-column comparison diagram:

Column 1 — Unnormalized / Poor design example:
One wide table "all_events" containing repeated node_name, node_host, node_port inside every failure row.

Column 2 — Better (2NF/3NF oriented):
Split into:
network_nodes (id, name, host, port, ...)
failure_events (id, node_id FK, failure_type, detected_at, ...)

Column 3 — Benefits bullets:
- No repeated service name in every failure row
- Rename a service once in network_nodes
- Avoid update anomalies
- Clear foreign-key relationships

Title note: "ANFARS schema uses separate tables linked by UUID foreign keys"
```

---

# BONUS D — Hardware & Software Configuration Diagram

### Prompt

```text
[PASTE GLOBAL STYLE HERE]

Title: Hardware and Software Configuration for ANFARS Lab Deployment

Left box HARDWARE:
- Laptop/PC ≥ 8GB RAM
- Multi-core CPU
- ≥ 20GB free disk
- Localhost / LAN lab network

Right box SOFTWARE STACK:
- Node.js runtime
- Express.js + Sequelize
- PostgreSQL
- React (Vite) + Tailwind CSS
- Socket.IO
- Git
- Simulated nodes on ports 9101–9106

Bottom arrow: "All components run locally for dissertation laboratory demonstration (no Docker required)"
```

---

## Quick copy checklist

| Figure | Diagram type | Prompt section |
|--------|--------------|----------------|
| 4.3 | As-is flowchart | Figure 4.3 |
| 4.4 | To-be cycle | Figure 4.4 |
| 4.5 | Context DFD | Figure 4.5 |
| 4.6 | DFD Level 1 | Figure 4.6 |
| 4.7 | DFD Level 2 | Figure 4.7 |
| 4.8 | Use case | Figure 4.8 |
| 4.9 | Sequence restart | Figure 4.9 |
| 4.10 | Sequence failover | Figure 4.10 |
| 4.11 | ERD | Figure 4.11 |
| 4.12 | Physical DB model | Figure 4.12 |
| 4.13 | Front-end architecture | Figure 4.13 |
| Bonus A–D | Extra architecture / normalization / config | Bonus sections |

---

## If ChatGPT image text is messy (fix reply)

```text
Redraw the exact same diagram again with:
- larger, sharper text
- no overlapping labels
- more spacing between boxes
- strictly white background
- draw.io / diagrams.net appearance
- keep all entity names and arrows exactly as specified
```

## Alternative (best quality for complex ERD/DFD)

If image generation garbles table text, ask ChatGPT for **Mermaid** or **draw.io XML**, then paste into [diagrams.net](https://app.diagrams.net/) and export PNG. Example follow-up:

```text
Do not generate an image. Instead output draw.io-compatible structured description (or Mermaid ER diagram) for Figure 4.11 using the exact tables and relationships I provided, so I can paste it into diagrams.net.
```
