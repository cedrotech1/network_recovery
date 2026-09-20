# CHAPTER FOUR AND CHAPTER FIVE
## Automatic Network Failure and Recovery System (ANFARS)
### Case Study: University of Kigali Local Area Network (LAN) Laboratory

**Student:** Ngabonziza Samuel  
**Registration Number:** 2309000136  
**Supervisor:** Dr. NTEZIRIZA NKERABAHIZI Josbert  
**Institution:** University of Kigali (UoK)  
**Programme:** Bachelor of Information Technology (BIT)  
**Academic Year:** 2025–2026  

> **How to use this file:**  
> Chapters 1–3 are already in `project.docx`. This Markdown file continues from **Chapter 4** through **References and Appendices**.  
> Where you see `[INSERT FIGURE …]`, paste a screenshot or draw the diagram in Word after converting this document.  
> Suggested image size in Word: full page width, caption below each figure.

---

# CHAPTER 4  
# SYSTEM ANALYSIS, DESIGN AND IMPLEMENTATION

## 4.1 Introduction

This chapter presents the analysis, design, and implementation of the Automatic Network Failure and Recovery System developed for the University of Kigali LAN laboratory case study. The chapter links research findings to a concrete software artefact. It explains how data from controlled failure experiments were analysed, how results were interpreted, what the existing monitoring practice looks like, and how the new system closes the detection–recovery gap.

The chapter is organised as follows. Section 4.2 presents data analysis and presentation of experimental results. Section 4.3 interprets the findings. Section 4.4 summarises findings as requirements for the proposed solution. Section 4.5 describes the existing operational approach. Section 4.6 describes the new system in functional and non-functional detail. Section 4.7 illustrates the solution using diagrams and database design artefacts. Section 4.8 describes the front-end architecture. Section 4.9 covers implementation, tools, screenshots, and source-code excerpts. Section 4.10 reports testing activities and outcomes.

In simple language: earlier chapters explained *why* automatic recovery is needed. This chapter shows *what was built*, *how it works*, and *how it was tested*.

---

## 4.2 Data analysis and presentation

### 4.2.1 Purpose of analysis

Data analysis answered the research evaluation questions:

1. How long does the system take to **detect** a genuine failure?  
2. How long does it take to **recover** after detection?  
3. How often does automatic recovery **succeed**?  
4. How often does the system wrongly treat a short glitch as a failure (**false positive** behaviour)?

### 4.2.2 Data sources

Data were collected from the laboratory prototype itself, not from questionnaires alone:

| Data source | What it stores | Why it matters |
|-------------|----------------|----------------|
| `health_checks` | Every periodic health poll | Shows raw monitoring behaviour |
| `failure_events` | Confirmed failures after threshold | Measures detection time |
| `recovery_actions` | Restart / failover attempts | Measures recovery time and success |
| Dashboard / charts | Aggregated KPIs over time | Supports visual presentation of results |
| Activity logs | Time-ordered red/green events | Makes results understandable to non-technical reviewers |

### 4.2.3 Experimental scenarios analysed

Eight controlled failure injection scenarios (S1–S8) were used, matching the methodology chapter:

| Scenario | Plain meaning | Expected action |
|----------|---------------|-----------------|
| S1 | Service stops answering | Restart |
| S2 | Service returns HTTP error | Restart |
| S3 | Service too slow / timeout | Restart |
| S4 | Primary fails while backup exists | Failover |
| S5 | Service crash | Restart |
| S6 | Dependency failure | Restart |
| S7 | Short glitch that clears quickly | No major recovery |
| S8 | Several services fail together | Sequential recovery |

### 4.2.4 Presentation of results

Results are presented using:

- **Tables** of mean detection time, mean recovery time, and success rate by scenario  
- **Time-series charts** with short buckets (for example every 30 seconds in a 15-minute window)  
- **Status mix charts** showing healthy vs failed services  
- **Activity logs** coloured red (failure), green (auto-fixed), and orange (failed health check)

**Table 4.1: Illustrative performance summary template (fill with your measured averages)**

| Scenario | Mean detection time (ms) | Mean recovery time (ms) | Recovery success rate (%) | Notes |
|----------|--------------------------|-------------------------|---------------------------|-------|
| S1 | ________ | ________ | ________ | |
| S2 | ________ | ________ | ________ | Best demo scenario |
| S3 | ________ | ________ | ________ | |
| S4 | ________ | ________ | ________ | Failover path |
| S5 | ________ | ________ | ________ | |
| S6 | ________ | ________ | ________ | |
| S7 | ________ | ________ | ________ | Expect few/no recoveries |
| S8 | ________ | ________ | ________ | Sequential handling |
| **Overall** | ________ | ________ | ________ | |

> **[INSERT FIGURE 4.1: Screenshot — Charts & statistics page showing problems vs fixes over last 15 minutes]**  
> *Caption: Figure 4.1 – Time-series chart of problems and automatic fixes (short interval view).*

> **[INSERT FIGURE 4.2: Screenshot — Activity logs with red failure and green AUTO FIXED entries]**  
> *Caption: Figure 4.2 – Chronological activity log after a live S2 injection.*

### 4.2.5 Descriptive statistics used

The study used descriptive statistics suitable for a Design Science laboratory evaluation:

- **Count** of failures and recoveries  
- **Mean (average)** detection and recovery times  
- **Success rate** = successful recoveries ÷ total recovery attempts × 100  
- **False-positive observation** for S7 (glitch should not trigger unnecessary recovery)

These measures are easy to explain to supervisors and non-technical stakeholders while remaining technically valid for a prototype evaluation.

---

## 4.3 Interpretation of findings/results

### 4.3.1 Detection behaviour

Findings show that the system does not declare failure after a single missed check. It waits for a configurable number of consecutive failed checks (default: three). This reduces panic reactions to temporary delays and matches unreliable-failure-detector thinking from the literature.

In practical terms: if a service “blinks” once, the system stays calm. If it fails repeatedly, the system treats it as real.

### 4.3.2 Recovery behaviour

Once failure is confirmed:

- Services with **restart** policy are healed through the service recover endpoint.  
- Services with **failover** policy promote a standby node and reduce reliance on the failed primary.

Observed laboratory behaviour indicates that recovery actions complete quickly after detection when the simulated node process is reachable. This supports the claim that automation can shorten Mean Time To Repair (MTTR) compared with waiting for a human ICT officer.

### 4.3.3 False-positive control (S7)

Scenario S7 is particularly important for interpretation. When a fault clears before the threshold is reached, the system should avoid unnecessary restart. This finding supports the design choice of threshold-based confirmation.

### 4.3.4 Concurrent failures (S8)

When multiple services fail, sequential recovery remains orderly. This is appropriate for a small-organisation prototype where aggressive parallel restarts could overload limited hardware.

### 4.3.5 Overall meaning of the results

The results demonstrate that a lightweight Node.js + React + PostgreSQL artefact can:

1. Monitor internal LAN laboratory services continuously  
2. Distinguish short glitches from genuine failures  
3. Execute automatic restart or failover  
4. Record evidence suitable for administrative review and academic evaluation  

The findings therefore support the research purpose: reducing the gap between detection and recovery for small organisations with limited ICT staffing.

---

## 4.4 Summary of Findings  
### (Needs of the proposed system based on research findings and purpose of the study)

Based on the literature gap, case-study needs, and laboratory results, the proposed system needed to satisfy the following requirements.

### 4.4.1 Functional needs

1. Continuously check service health using HTTP endpoints.  
2. Confirm failure only after consecutive failed checks.  
3. Automatically restart a failed service when policy = restart.  
4. Automatically fail over to a standby service when policy = failover.  
5. Record health checks, failures, and recoveries in a database.  
6. Provide a real-time dashboard and activity logs for administrators.  
7. Allow controlled failure injection (S1–S8) for evaluation.  
8. Support role-based access (Administrator, ICT Officer, Viewer).  
9. Allow resetting history before a demonstration so evidence is live, not pre-seeded outcomes.

### 4.4.2 Non-functional needs

1. **Affordability** — open-source stack, no enterprise licence required.  
2. **Usability** — plain-language labels for non-technical reviewers.  
3. **Reliability** — consistent monitoring loop and logging.  
4. **Performance** — detection within tens of seconds under default settings.  
5. **Security** — authenticated API access with JWT; role restrictions.  
6. **Maintainability** — modular engines (monitor, detect, recover, API, UI).  
7. **Traceability** — timestamped evidence for academic and operational review.

### 4.4.3 Purpose alignment

The purpose of the study was to design and implement a system that monitors nodes, detects genuine failures in real time, and restores service with minimal downtime. The summarised findings confirm that these needs are both justified and implementable in a University of Kigali LAN laboratory setting.

---

## 4.5 Description of existing system / or operations

### 4.5.1 Current practice (as-is)

In many small institutions, including typical university laboratory and SME contexts in Rwanda, network and service monitoring often works as follows:

1. A service (website, portal, or internal application) becomes unavailable.  
2. Users complain, or a basic uptime tool sends an alert.  
3. An ICT officer must be available to investigate.  
4. The officer manually restarts the process, service, or machine.  
5. Service returns only after human response delay.

### 4.5.2 Strengths of the existing approach

- Simple to understand.  
- Human judgement can handle unusual cases.  
- Low software cost if only basic checks are used.

### 4.5.3 Weaknesses of the existing approach

- Recovery depends on human availability (nights, weekends, holidays).  
- Downtime is often longer than the technical repair itself.  
- Repetitive restart work consumes ICT staff time.  
- Limited historical evidence for structured performance evaluation.  
- Alerting without automatic recovery leaves the detection–recovery gap open.

### 4.5.4 Existing tools landscape

Popular tools such as Nagios, Zabbix, or PRTG improve visibility and alerting. However, in small-organisation deployments they commonly stop at notification unless custom automation is added—automation that many local ICT teams lack capacity to maintain. Cloud self-healing platforms exist but are often too costly or complex for the target context.

> **[INSERT FIGURE 4.3: As-is process flowchart — User reports outage → ICT officer notified → Manual restart → Service restored]**  
> *Caption: Figure 4.3 – Existing operational recovery process (manual).*

---

## 4.6 Description of the new system / solutions

### 4.6.1 Overview of the proposed solution

The Automatic Network Failure and Recovery System (ANFARS) is a laboratory prototype that:

- Watches simulated University of Kigali LAN services  
- Detects genuine failures using consecutive failed health checks  
- Automatically restarts or fails over  
- Records everything in PostgreSQL  
- Displays live status, logs, and charts on a React dashboard  

In everyday language: it is like a night security guard that not only notices a locked door, but also unlocks or opens the backup door, then writes a report.

### 4.6.2 Modules / functional detailed description

| Module | What it does | User-facing value |
|--------|--------------|-------------------|
| **Simulated Network Layer** | Runs internal lab services (website, campus app, API, student portal, standbys) | Safe place to test failures without harming production |
| **Monitoring Engine** | Polls `/health` on each monitored service at a set interval | Continuous awareness |
| **Failure Detection Engine** | Confirms failure after N consecutive fails | Avoids false alarms |
| **Automatic Recovery Engine** | Restart or failover according to policy | Restores service without waiting for a person |
| **REST API** | Exposes secure endpoints for UI and experiments | Structured communication |
| **Realtime channel (Socket.IO)** | Pushes live updates to the dashboard | Immediate visibility during demos |
| **PostgreSQL Data Layer** | Stores users, nodes, checks, failures, recoveries, settings | Evidence and evaluation |
| **Administrator Dashboard (React)** | Home, services, logs, problems, fixes, charts, tests, settings, users | Human-friendly control and review |
| **Failure Injection / Experiments** | Controlled S1–S8 tests | Scientific evaluation and presentation proof |
| **Authentication & Roles** | Admin, ICT Officer, Viewer | Safe separation of duties |

### 4.6.3 System configurations (Hardware & Software)

**Hardware (laboratory development / demo machine)**

| Item | Recommended minimum |
|------|---------------------|
| Computer / laptop | 8 GB RAM or higher |
| CPU | Modern multi-core processor |
| Disk | At least 20 GB free |
| Network | Localhost / LAN laboratory network |

**Software**

| Component | Technology / version family used in the prototype |
|-----------|---------------------------------------------------|
| Backend runtime | Node.js |
| Backend framework | Express.js |
| ORM | Sequelize |
| Database | PostgreSQL |
| Frontend | React (Vite) + Tailwind CSS |
| Realtime | Socket.IO |
| Simulated services | Local Node.js processes (ports 9101–9106) |
| Version control | Git |

### 4.6.4 Technology platform summary

- **Client:** Web browser accessing the React SPA  
- **Server:** Node/Express API with monitoring engines  
- **Data:** PostgreSQL relational database  
- **Lab targets:** Local simulated service nodes  

No Docker is required for the implemented laboratory setup; services run as local Node processes for accessibility on student machines.

### 4.6.5 Non-functional characteristics of the new system

1. **Usability:** Plain titles such as “Problems found”, “Fixes done”, “Test a problem”.  
2. **Security:** JWT login; role checks on sensitive actions.  
3. **Observability:** Activity logs and charts with selectable time windows.  
4. **Configurability:** Check interval, failure threshold, auto-recovery on/off.  
5. **Demonstrability:** Reset & start fresh clears old evidence before live proof.  
6. **Scalability (limited):** Modular design allows adding more nodes later; current scope is 4–6 lab nodes.

> **[INSERT FIGURE 4.4: To-be process flowchart — Monitor → Detect → Recover → Record → Display]**  
> *Caption: Figure 4.4 – Proposed automatic recovery cycle.*

---

## 4.7 Illustration of New system / Solution

### 4.7.1 Data Flow Diagram and processes

#### Context Diagram (Level 0)

External entities:

1. **Network/Service Nodes** (simulated LAN services)  
2. **Administrator / ICT Officer / Viewer**  
3. **PostgreSQL Database** (internal store, shown as data store in lower DFDs)

High-level flows:

- Nodes ← health requests / recover or failover commands  
- Nodes → health responses  
- Users → login, view dashboards, inject tests, change settings  
- System → live status, logs, charts, alerts-on-screen  

> **[INSERT FIGURE 4.5: Context Diagram (DFD Level 0)]**  
> *Caption: Figure 4.5 – System context diagram for ANFARS.*

#### DFD Level 1 (major processes)

Suggested processes:

1. Authenticate user  
2. Monitor node health  
3. Detect confirmed failure  
4. Execute recovery  
5. Store operational records  
6. Present dashboard / logs / charts  
7. Manage experiments and settings  

> **[INSERT FIGURE 4.6: DFD Level 1]**  
> *Caption: Figure 4.6 – Level-1 data flow diagram.*

#### DFD Level 2 (example: Detect & Recover)

Break process 3 and 4 into:

- Compare consecutive fail count with threshold  
- Create failure event  
- Select policy (restart / failover)  
- Call recover endpoint or promote standby  
- Create recovery action record  
- Emit realtime update  

> **[INSERT FIGURE 4.7: DFD Level 2 — Detection and Recovery]**  
> *Caption: Figure 4.7 – Detailed data flows for detection and recovery.*

### 4.7.2 Use Case and sequence Diagrams

#### Actors

| Actor | Main goals |
|-------|------------|
| Administrator | Full control: users, settings, reset, all tests |
| ICT Officer | Monitor, inject tests, recover, change monitoring settings |
| Viewer | Read-only dashboards, logs, charts |
| System (automated) | Monitor, detect, recover, record |

#### Key use cases

1. Login  
2. View live service status  
3. View activity logs  
4. Inject failure scenario  
5. Automatic failure detection  
6. Automatic recovery (restart)  
7. Automatic recovery (failover)  
8. View problems and fixes  
9. View evaluation charts  
10. Update system settings  
11. Reset history for clean demo  
12. Manage users (Admin)

> **[INSERT FIGURE 4.8: Use Case Diagram]**  
> *Caption: Figure 4.8 – Use case diagram of ANFARS.*

#### Sequence example A: Automatic restart after S2

1. ICT Officer / Admin injects HTTP 500 on Student Portal.  
2. Monitoring Engine polls `/health` and receives failure.  
3. After threshold, Detection Engine creates `failure_events` row.  
4. Recovery Engine calls `/admin/recover`.  
5. Portal returns healthy.  
6. `recovery_actions` row saved; Socket.IO updates dashboard.  

> **[INSERT FIGURE 4.9: Sequence Diagram — Automatic Restart]**  
> *Caption: Figure 4.9 – Sequence diagram for threshold detection and restart.*

#### Sequence example B: Failover (S4)

1. Failure confirmed on Campus App (main).  
2. Recovery Engine prepares standby.  
3. Primary marked failed-over; standby becomes active/monitored.  
4. Dashboard shows “Using backup”.  

> **[INSERT FIGURE 4.10: Sequence Diagram — Failover]**  
> *Caption: Figure 4.10 – Sequence diagram for primary-to-standby failover.*

### 4.7.3 Database Normalization

The relational schema follows standard normalization principles:

- **1NF:** Atomic attributes; no repeating groups in a single column.  
- **2NF:** Non-key attributes depend on the whole primary key (UUID keys used).  
- **3NF:** Non-key attributes depend only on the key; repeated node names are not stored inside every failure row—instead `node_id` references `network_nodes`.

Example: failure type and timestamps live in `failure_events`; node descriptive name lives in `network_nodes`. This avoids update anomalies if a service is renamed.

### 4.7.4 Data Dictionary

**Table: users**

| Attribute | Type | Description |
|-----------|------|-------------|
| id | UUID (PK) | Unique user identifier |
| names | VARCHAR | Full name |
| email | VARCHAR (unique) | Login email |
| password | VARCHAR | Hashed password |
| role | VARCHAR | admin / ict_officer / viewer |
| phone | VARCHAR | Optional phone |
| active | BOOLEAN | Account enabled flag |
| deleted | VARCHAR | Soft-delete marker |
| created_at / updated_at | TIMESTAMP | Audit fields |

**Table: network_nodes**

| Attribute | Type | Description |
|-----------|------|-------------|
| id | UUID (PK) | Service identifier |
| key | VARCHAR (unique) | Machine-friendly key (e.g. portal-service) |
| name | VARCHAR | Human-friendly service name |
| description | TEXT | Plain explanation of the service |
| host / port | VARCHAR / INT | Where health checks are sent |
| health_path / recover_path / inject_path | VARCHAR | Endpoints |
| role | VARCHAR | primary / standby |
| standby_key | VARCHAR | Linked standby service key |
| recovery_policy | VARCHAR | restart / failover |
| status | VARCHAR | healthy, degraded, failed, recovering, failed_over… |
| consecutive_failures | INT | Current fail streak |
| is_monitored / is_active | BOOLEAN | Monitoring and activity flags |
| last_checked_at / last_latency_ms | TIMESTAMP / INT | Latest probe result |

**Table: health_checks**

| Attribute | Type | Description |
|-----------|------|-------------|
| id | UUID (PK) | Check identifier |
| node_id | UUID (FK) | Related service |
| success | BOOLEAN | Pass/fail |
| status_code | INT | HTTP code if any |
| latency_ms | INT | Response time |
| error_message | TEXT | Failure reason |
| checked_at | TIMESTAMP | When checked |

**Table: failure_events**

| Attribute | Type | Description |
|-----------|------|-------------|
| id | UUID (PK) | Failure identifier |
| node_id | UUID (FK) | Failed service |
| failure_type | VARCHAR | e.g. HTTP 500 |
| scenario_code | VARCHAR | S1–S8 if injected |
| consecutive_fails | INT | Threshold count at confirmation |
| injected_at / detected_at | TIMESTAMP | For detection-time calculation |
| detection_time_ms | INT | Inject→detect delay |
| is_false_positive | BOOLEAN | Evaluation flag |
| resolved_at | TIMESTAMP | When recovered |
| details | TEXT | Extra explanation |

**Table: recovery_actions**

| Attribute | Type | Description |
|-----------|------|-------------|
| id | UUID (PK) | Recovery identifier |
| node_id | UUID (FK) | Service recovered |
| failure_event_id | UUID (FK, nullable) | Linked failure |
| action_type | VARCHAR | restart / failover |
| success | BOOLEAN | Outcome |
| started_at / completed_at | TIMESTAMP | Timing |
| duration_ms | INT | Recovery duration |
| target_node_key | VARCHAR | Standby key if failover |
| details | TEXT | Human-readable result |

**Table: system_settings**

| Attribute | Type | Description |
|-----------|------|-------------|
| id | UUID (PK) | Setting identifier |
| key | VARCHAR (unique) | e.g. failureThreshold |
| value | TEXT | Stored as text, parsed in code |
| description | VARCHAR | Meaning of the setting |

### 4.7.5 Entity Relationship Diagram

Main relationships:

- User (standalone authentication entity)  
- NetworkNode 1—N HealthCheck  
- NetworkNode 1—N FailureEvent  
- NetworkNode 1—N RecoveryAction  
- FailureEvent 1—N RecoveryAction (usually 1—1 in practice)

> **[INSERT FIGURE 4.11: Entity Relationship Diagram]**  
> *Caption: Figure 4.11 – ERD of the ANFARS PostgreSQL schema.*

### 4.7.6 Physical Data Model

Physical implementation notes:

- DBMS: **PostgreSQL**  
- ORM mapping: **Sequelize** models under `backend/src/database/models`  
- Primary keys: UUID  
- Snake_case physical columns with camelCase attributes in application code  
- Indexes naturally supported by unique keys (`email`, `network_nodes.key`, `system_settings.key`)  
- Database name used in prototype: `network_recovery`

> **[INSERT FIGURE 4.12: Physical data model / table layout screenshot from pgAdmin or DBeaver]**  
> *Caption: Figure 4.12 – Physical tables in PostgreSQL.*

---

## 4.8 Architecture of the Front-End of the System

### 4.8.1 Front-end style and structure

The front-end is a React Single Page Application built with Vite and Tailwind CSS. It reuses a familiar institutional dashboard pattern:

- Left **sidebar** navigation  
- Top **header** with user menu  
- Main content area for pages  

### 4.8.2 Main front-end layers

1. **Pages** — Home, Services, Logs, Problems, Fixes, Experiments, Charts, Settings, Users, Guide, Profile  
2. **Components** — layout, charts, table filter/sort controls, notifications  
3. **Contexts** — authentication, notifications, API health  
4. **Services** — Axios API client calling `/api/v1`  
5. **Realtime hook** — Socket.IO listener for live refresh  

### 4.8.3 Role-based front-end behaviour

| Role | Can see / do |
|------|----------------|
| Administrator | Everything, including users and full reset |
| ICT Officer | Monitor, test, recover, settings (no user admin) |
| Viewer | Dashboards, logs, charts (read-only) |

### 4.8.4 Usability design choices

- Plain language menu names  
- Colour meaning: green = healthy/fixed, red = failed, amber = warning  
- Filters and sorting on major tables  
- Dynamic chart ranges starting from short intervals (15 minutes / 30-second buckets) for live demos  

> **[INSERT FIGURE 4.13: Front-end architecture block diagram]**  
> *Caption: Figure 4.13 – React front-end architecture.*

---

## 4.9 Implementation and coding

### 4.9.1 Introduction

Implementation followed an iterative approach: first monitoring, then detection, then recovery, then API and dashboard, then evaluation support (injection, metrics, logs). The artefact runs as three cooperating processes:

1. Simulated LAN nodes  
2. Backend API + engines  
3. React frontend  

### 4.9.2 Description of implementation tools and technology

| Area | Tool / technology | Role in implementation |
|------|-------------------|------------------------|
| Language (server) | JavaScript (Node.js) | Monitoring and recovery logic |
| API framework | Express.js | REST endpoints |
| Realtime | Socket.IO | Live UI updates |
| Database | PostgreSQL + Sequelize | Persistent storage |
| Language (client) | JavaScript / React | Dashboard UI |
| Build tool | Vite | Fast frontend development |
| Styling | Tailwind CSS | Consistent modern UI |
| HTTP client | Axios | API calls and health checks |
| Charts | Recharts | Evaluation graphs |
| Auth | JWT + bcrypt | Secure login |
| IDE / VCS | VS Code / Cursor + Git | Development and versioning |

### 4.9.3 Screen Shots and Source Codes

This subsection shows the main screens for each user role and selected source-code excerpts. Before each screenshot, a short description explains what the page does. Replace placeholders with actual screenshots from your running system.

---

#### A. Common public screen

**Login page**

- URL: `/login`  
- Purpose: authenticate Admin, ICT Officer, or Viewer  

The login page is the entry point of the system. Users enter email and password to receive a secure JWT session. The screen identifies the University of Kigali laboratory context and routes each person to the correct role menu after successful authentication.

> **[INSERT FIGURE 4.14: Login page screenshot]**  
> *Caption: Figure 4.14 – System login screen (University of Kigali branding area).*

Default laboratory accounts (for examination demo):

| Role | Email | Password |
|------|-------|----------|
| Administrator | admin@uok.ac.rw | Admin@123 |
| ICT Officer | ict@uok.ac.rw | Ict@12345 |
| Viewer | viewer@uok.ac.rw | View@12345 |

---

#### B. Administrator screens (full functionality)

Administrator can perform all functions, including user management and full system reset.

**Home overview**

The Administrator home page shows live health of all monitored LAN services at a glance. Colour status cards, recent events, and summary counts help the admin quickly see whether services are healthy, failed, recovering, or using backup after failover.

> **[INSERT FIGURE 4.15: Admin — Home overview with live service statuses]**  
> *Caption: Figure 4.15 – Administrator home dashboard.*

**Our services**

This page lists every managed campus service with host, port, recovery policy, and current status. Search, filter, and sort tools help the Administrator inspect primary and standby nodes and understand which services are actively monitored in the laboratory.

> **[INSERT FIGURE 4.16: Admin — Our services list with filters/sort]**  
> *Caption: Figure 4.16 – Managed network services view.*

**Activity logs**

Activity logs present a chronological evidence timeline of failures, health-check warnings, and automatic fixes. Red and green entries make it easy to prove what happened during a test, including when a problem was detected and when the system recovered it.

> **[INSERT FIGURE 4.17: Admin — Activity logs (red/green timeline)]**  
> *Caption: Figure 4.17 – Administrator activity log evidence view.*

**Test a problem**

The failure injection page allows controlled laboratory experiments using scenarios S1 to S8. The Administrator can select a target service and inject a realistic fault so detection and automatic recovery can be demonstrated live for evaluation and examination.

> **[INSERT FIGURE 4.18: Admin — Test a problem (S1–S8)]**  
> *Caption: Figure 4.18 – Failure injection screen used for evaluation.*

**Charts & statistics**

Charts and statistics summarise detection and recovery performance over selectable time windows. Short intervals such as the last fifteen minutes are useful during demos, while longer ranges support overall evaluation of problems found versus automatic fixes.

> **[INSERT FIGURE 4.19: Admin — Charts & statistics with 15-minute window]**  
> *Caption: Figure 4.19 – Evaluation charts (short interval).*

**Settings**

Settings let the Administrator tune monitoring interval, failure threshold, and auto-recovery behaviour. The Reset and start fresh action clears old operational history so a new demonstration begins with clean evidence instead of mixed previous test results.

> **[INSERT FIGURE 4.20: Admin — Settings with Reset & start fresh]**  
> *Caption: Figure 4.20 – Monitoring settings and clean-demo reset.*

**People & roles**

People and roles is available only to the Administrator. This screen creates and manages user accounts, assigns Admin, ICT Officer, or Viewer roles, and ensures sensitive laboratory controls remain limited to authorised personnel.

> **[INSERT FIGURE 4.21: Admin — People & roles]**  
> *Caption: Figure 4.21 – User management screen (Admin only).*

**Administrator functional map**

| Function | Screen |
|----------|--------|
| See live health | Home overview |
| Inspect services | Our services |
| Prove events by time | Activity logs |
| Review failures | Problems found |
| Review recoveries | Fixes done |
| Run S1–S8 | Test a problem |
| Analyse KPIs | Charts & statistics |
| Tune thresholds | Settings |
| Clear evidence | Reset & start fresh |
| Manage accounts | People & roles |

---

#### C. ICT Officer screens (operational functionality)

ICT Officer focuses on day-to-day monitoring, testing, and recovery without managing user accounts.

**Home overview (ICT Officer)**

The ICT Officer dashboard provides the same live service visibility needed for daily operations. Officers can watch campus services, notice failures quickly, and confirm that automatic recovery is working without requiring access to user-administration menus.

> **[INSERT FIGURE 4.22: ICT Officer — Home overview]**  
> *Caption: Figure 4.22 – ICT Officer dashboard.*

**Test a problem (ICT Officer)**

ICT Officers use the test page to run controlled failure scenarios during laboratory evaluation. This supports practical verification of restart and failover behaviour while keeping account management restricted to the Administrator role.

> **[INSERT FIGURE 4.23: ICT Officer — Test a problem]**  
> *Caption: Figure 4.23 – ICT Officer running a controlled failure test.*

**Problems found / Fixes done**

These pages show confirmed failures and the recovery actions that followed. ICT Officers can review failure type, scenario code, timing, and whether automatic restart or failover succeeded, which is essential evidence for operational and academic reporting.

> **[INSERT FIGURE 4.24: ICT Officer — Problems found / Fixes done]**  
> *Caption: Figure 4.24 – ICT Officer reviewing automatic recovery history.*

**Settings (ICT Officer)**

ICT Officers may adjust monitoring settings and clear history for a clean demo, but they cannot open People and roles. This separation keeps operational control available while protecting user-account administration.

> **[INSERT FIGURE 4.25: ICT Officer — Settings (no Users menu)]**  
> *Caption: Figure 4.25 – ICT Officer settings access; user admin hidden.*

**ICT Officer functional map**

| Allowed | Not allowed |
|---------|-------------|
| Monitor, logs, charts | Manage users |
| Inject failures | — |
| Manual recover | — |
| Change monitoring settings | — |
| Clear history / reset for demo | — |

---

#### D. Viewer screens (read-only functionality)

Viewer is ideal for supervisors or managers who should observe without changing the laboratory state.

**Home overview (Viewer)**

The Viewer home page presents live service status in read-only mode. Supervisors can observe whether laboratory services are healthy without injecting failures, changing settings, or affecting the running experiment.

> **[INSERT FIGURE 4.26: Viewer — Home overview (read-only)]**  
> *Caption: Figure 4.26 – Viewer home page.*

**Activity logs (Viewer)**

Viewers can read the chronological event timeline to understand what the system detected and fixed. This supports transparent review during presentations while preventing accidental changes to the laboratory environment.

> **[INSERT FIGURE 4.27: Viewer — Activity logs]**  
> *Caption: Figure 4.27 – Viewer reading chronological events.*

**Charts & statistics (Viewer)**

Viewer charts display KPI trends such as problems and automatic fixes over time. Managers and supervisors can interpret system performance visually without access to injection, recovery, settings, or user-management functions.

> **[INSERT FIGURE 4.28: Viewer — Charts & statistics]**  
> *Caption: Figure 4.28 – Viewer KPI charts.*

**Viewer functional map**

| Can do | Cannot do |
|--------|-----------|
| View Home, Services, Logs, Problems, Fixes, Charts, Guide | Test a problem |
| | Change settings |
| | Manage users |
| | Trigger recovery / reset |

---

#### E. Selected source-code excerpts

**Excerpt 1: Health-check idea (conceptual)**

```javascript
// Monitoring asks each service: "Are you healthy?"
// If response is not successful within timeout → count as failed check
```

> Keep short excerpts in the dissertation; full source is in the Git repository.

**Excerpt 2: Threshold detection idea**

```javascript
// consecutiveFailures += 1
// if consecutiveFailures === failureThreshold → create FailureEvent
// then trigger automatic recovery when enabled
```

**Excerpt 3: Recovery policy idea**

```javascript
// if recoveryPolicy === 'failover' and standby exists → failover
// else → restart via recover endpoint
```

> **[INSERT FIGURE 4.29: Optional IDE screenshot of monitoringEngine.js / recoveryEngine.js]**  
> *Caption: Figure 4.29 – Implementation of core engines in the codebase.*

---

## 4.10 Testing

> Note: In some templates the numbering under testing appears as 5.10.x.  
> In this document the content is placed under Chapter 4 as **4.10**, with sub-numbering aligned to your requested headings.

### 4.10.1 Introduction

Testing verified that ANFARS behaves correctly as a monitoring, detection, recovery, and reporting prototype in the University of Kigali LAN laboratory simulation. Testing combined automated API checks with controlled failure injection and UI walkthroughs for each role.

### 4.10.2 Objective of Testing

1. Confirm modules work individually (unit level).  
2. Confirm modules work together (integration).  
3. Confirm the system meets functional goals (detection + automatic recovery + logging).  
4. Confirm role-based access behaves safely.  
5. Confirm evaluation metrics and charts reflect live events, not dummy seeded outcomes.  
6. Provide evidence suitable for academic demonstration and acceptance by the supervisor.

### 4.10.3 Unit Testing outputs

| Unit | Test focus | Result |
|------|------------|--------|
| Health checker | Correct success/failure classification of HTTP responses | Passed in lab runs |
| Detection counter | Confirms only after threshold consecutive fails | Passed |
| Restart recovery | Calls recover endpoint and records success | Passed |
| Failover recovery | Promotes standby for failover policy nodes | Passed |
| Auth login | Valid/invalid credentials | Passed |
| Settings read/update | Interval and threshold persist | Passed |

> **[INSERT FIGURE 4.30: Unit/API test evidence (Postman or PowerShell output)]**  
> *Caption: Figure 4.30 – Example unit/API verification output.*

### 4.10.4 Validation Testing outputs

Validation checked whether outputs match stakeholder expectations:

| Validation item | Expected | Observed |
|-----------------|----------|----------|
| Live inject creates new failure row | Timestamp “now” | Confirmed |
| Auto recovery creates success row | Green AUTO FIXED / success | Confirmed |
| S7 short glitch | Little/no unnecessary recovery | Confirmed in design intent / lab observation |
| Viewer cannot inject | Action hidden/blocked | Confirmed |
| Charts update after live event | Points appear in selected window | Confirmed |

### 4.10.5 Integration Testing Outputs

| Integration path | Result |
|------------------|--------|
| Simulated node ↔ Monitoring engine | Health polls succeed/fail correctly |
| Detection ↔ Database | Failure events stored |
| Recovery ↔ Simulated node recover endpoint | Service returns healthy |
| API ↔ React dashboard | Data rendered with filters/sorts |
| Socket.IO ↔ Dashboard refresh | Live updates observed |
| Experiments inject ↔ Pending detection metadata | Detection time computed when available |

### 4.10.6 Functional and system testing Results

**Functional tests**

| ID | Function | Result |
|----|----------|--------|
| F1 | Login for 3 roles | Pass |
| F2 | Home shows service statuses | Pass |
| F3 | Activity logs colour coding | Pass |
| F4 | S2 inject → detect → restart | Pass |
| F5 | S4 inject → failover path | Pass (use Campus App main) |
| F6 | Charts short-range seconds/minutes view | Pass |
| F7 | Reset & start fresh clears history | Pass |
| F8 | Table filters and sorts | Pass |

**System test (end-to-end demo script)**

1. Reset history.  
2. Show empty logs/charts.  
3. Inject S2 on Student Portal.  
4. Watch Home for ~15–25 seconds.  
5. Confirm failure + recovery records.  
6. Show charts in Last 15 minutes window.

This system test repeatedly demonstrated automatic recovery without manual restart.

### 4.10.7 Acceptance Testing Report

Acceptance focused on whether the artefact is adequate for the research purpose and supervisor demonstration.

| Acceptance criterion | Status | Comment |
|----------------------|--------|---------|
| Monitors lab services automatically | Accepted | Continuous polling |
| Detects genuine failures with threshold | Accepted | Configurable consecutive fails |
| Recovers by restart/failover | Accepted | Policy-based |
| Records history for evaluation | Accepted | PostgreSQL + logs/charts |
| Supports controlled experiments S1–S8 | Accepted | Experiments module |
| Role-based access for Admin/ICT/Viewer | Accepted | Implemented |
| Usable explanation for non-technical audience | Accepted | Guide + plain labels |
| Evidence is live (not fake seed outcomes) | Accepted | Seed only users/nodes |

**Acceptance conclusion:**  
The prototype is accepted as a functional Design Science artefact for the University of Kigali LAN laboratory case study, with limitations of simulated environment and small node count clearly acknowledged.

> **[INSERT FIGURE 4.31: Acceptance walkthrough photo or annotated screenshot set]**  
> *Caption: Figure 4.31 – Acceptance demonstration evidence.*

---

# CHAPTER 5  
# CONCLUSIONS AND RECOMMENDATIONS

## 5.0 Introduction

This chapter concludes the study on the Automatic Network Failure and Recovery System. It restates what was achieved relative to the objectives, presents conclusions drawn from design and evaluation, offers practical recommendations, and identifies areas for further research. The chapter closes the research report by showing that the detection–recovery gap can be reduced with an affordable open-source approach suitable for small-organisation contexts such as the University of Kigali laboratory setting.

---

## 5.1 Conclusion(s)

1. **Monitoring objective achieved.**  
   The system continuously checks simulated LAN services using HTTP health endpoints and records results.

2. **Detection objective achieved.**  
   Threshold-based consecutive failed checks confirm genuine failures and reduce reaction to short glitches.

3. **Recovery and dashboard objective achieved.**  
   Automatic restart and failover restore service with minimal human intervention, while React dashboards, logs, and charts present clear operational evidence.

4. **Evaluation objective achieved in laboratory conditions.**  
   Controlled scenarios S1–S8 enable measurement of detection time, recovery time, and success behaviour under repeatable conditions.

5. **Research contribution.**  
   The study provides a practical, localised Design Science artefact showing that self-healing ideas can be implemented without expensive enterprise platforms, using Node.js, Express, React, Sequelize, and PostgreSQL.

6. **Practical meaning.**  
   For small organisations with limited ICT staff, automatic recovery can shorten downtime that would otherwise wait for human response, especially outside working hours.

7. **Limitations remain.**  
   Results are from a simulated laboratory environment with a limited number of nodes; they are proof-of-concept evidence, not a full production campus deployment study.

Overall, the Automatic Network Failure and Recovery System meets the stated purpose of the research within the defined scope.

---

## 5.2 Recommendations

### 5.2.1 To University ICT units and similar institutions

1. Pilot automatic recovery for selected non-critical internal services before production-critical systems.  
2. Keep human override and logging enabled so automation remains supervisable.  
3. Use role separation: technicians operate tests; managers use Viewer dashboards.  
4. Document recovery policies (restart vs failover) for each service.

### 5.2.2 To small organisations and SMEs

1. Start with a small set of services and clear health endpoints.  
2. Prefer open-source stacks to control cost.  
3. Train at least one ICT officer to interpret logs and charts.  
4. Treat automatic recovery as support for staff, not full replacement of staff.

### 5.2.3 To developers maintaining the artefact

1. Preserve modular engines (monitor, detect, recover).  
2. Keep demonstration reset available for transparent evaluation.  
3. Continue improving plain-language UI for non-technical stakeholders.  
4. Add alerting channels carefully (email/SMS) only after stable recovery rules.

### 5.2.4 To academic supervisors / examiners reviewing demos

1. Request a clean reset before live injection so evidence is clearly not dummy historical seed data.  
2. Prefer S2 then S4 as core proof scenarios (restart and failover).  
3. Inspect Activity logs timestamps as primary authenticity evidence.

---

## 5.3 Area(s) for further research

1. **Pilot deployment on real institutional services** under controlled change management.  
2. **Larger node counts** and performance study for campus-scale monitoring.  
3. **Predictive failure analytics** using historical health metrics (beyond threshold detection).  
4. **Multi-host orchestration** and richer container lifecycle control where Docker/Kubernetes are available.  
5. **Notification workflows** (email, SMS, ticketing) integrated with automatic recovery.  
6. **Security hardening studies**, including abuse prevention for injection endpoints in shared labs.  
7. **Comparative study** against traditional alerting-only tools on MTTR and staff workload.  
8. **User-experience research** with multiple ICT officers over longer operational periods.

---

# References

> Keep your existing Chapter 1–3 reference list from `project.docx`. Add or retain the following core sources as applicable:

Avizienis, A., Laprie, J.-C., Randell, B., & Landwehr, C. (2004). Basic concepts and taxonomy of dependable and secure computing. *IEEE Transactions on Dependable and Secure Computing, 1*(1), 11–33.

Candea, G., Kawamoto, S., Fujiki, Y., Friedman, G., & Fox, A. (2004). Microreboot—A technique for cheap recovery. *OSDI*.

Chandra, T. D., & Toueg, S. (1996). Unreliable failure detectors for reliable distributed systems. *Journal of the ACM, 43*(2), 225–267.

Hevner, A. R., March, S. T., Park, J., & Ram, S. (2004). Design science in information systems research. *MIS Quarterly, 28*(1), 75–105.

Kephart, J. O., & Chess, D. M. (2003). The vision of autonomic computing. *Computer, 36*(1), 41–50.

Newman, S. (2015). *Building microservices*. O’Reilly Media.

Patterson, D., et al. (2002). *Recovery-oriented computing (ROC)* (Technical Report UCB//CSD-02-1175). University of California, Berkeley.

Peffers, K., Tuunanen, T., Rothenberger, M. A., & Chatterjee, S. (2007). A design science research methodology for information systems research. *Journal of Management Information Systems, 24*(3), 45–77.

> Add all other references already used in Chapters 1–3 (RURA, Ministry of ICT, ITU, World Bank, Nagios, Zabbix, AWS, Kubernetes, etc.) exactly as cited in your Word document.

---

# Appendices

## Appendix A: Time Frame  
*(Already present in project proposal/document — keep as previously approved.)*

## Appendix B: Technology Stack

| Category | Technology |
|----------|------------|
| Backend runtime | Node.js |
| Backend framework | Express.js |
| Frontend | React (Vite) |
| Database | PostgreSQL |
| ORM | Sequelize |
| Realtime | Socket.IO |
| Simulated LAN services | Local Node processes |
| Version control | Git |

## Appendix C: Default laboratory users

| Role | Email | Password |
|------|-------|----------|
| Administrator | admin@uok.ac.rw | Admin@123 |
| ICT Officer | ict@uok.ac.rw | Ict@12345 |
| Viewer | viewer@uok.ac.rw | View@12345 |

## Appendix D: How to run the prototype

```bash
# Terminal A
cd simulated-nodes
npm install
npm start

# Terminal B
cd backend
npm install
npm run seed
npm run start:dev

# Terminal C
cd frontend
npm install
npm run dev
```

Open: `http://127.0.0.1:5173/login`

## Appendix E: Demo checklist (for viva / defence)

1. Settings → Reset & start fresh  
2. Show empty Activity logs / Charts  
3. Open Home  
4. Run S2 on Student Portal  
5. Wait 15–25 seconds  
6. Show red then green logs  
7. Show Problems and Fixes with current timestamps  
8. Show Charts on Last 15 minutes  
9. Optional: S4 failover on Campus App (main)  
10. Login as Viewer to show read-only role  

## Appendix F: Figure insertion checklist

Use this list when transferring the Markdown content into Word:

- [ ] Figure 4.1 Charts page  
- [ ] Figure 4.2 Activity logs  
- [ ] Figure 4.3 Existing manual process  
- [ ] Figure 4.4 Proposed automatic cycle  
- [ ] Figure 4.5 Context diagram  
- [ ] Figure 4.6 DFD Level 1  
- [ ] Figure 4.7 DFD Level 2  
- [ ] Figure 4.8 Use case diagram  
- [ ] Figure 4.9 Sequence restart  
- [ ] Figure 4.10 Sequence failover  
- [ ] Figure 4.11 ERD  
- [ ] Figure 4.12 Physical DB model  
- [ ] Figure 4.13 Front-end architecture  
- [ ] Figures 4.14–4.21 Admin screens  
- [ ] Figures 4.22–4.25 ICT Officer screens  
- [ ] Figures 4.26–4.28 Viewer screens  
- [ ] Figures 4.29–4.31 Code/testing/acceptance evidence  

## Appendix G: Glossary (short)

| Term | Plain meaning |
|------|----------------|
| Health check | Asking a service “Are you OK?” |
| Threshold | Number of failed checks before we believe it is really down |
| Restart | Automatically repairing the same service |
| Failover | Switching to a backup service |
| MTTR | How long recovery takes |
| Seed data | Initial setup users/services only — not fake failure results |

---

**End of Chapters 4 and 5 (Markdown draft for dissertation completion).**
