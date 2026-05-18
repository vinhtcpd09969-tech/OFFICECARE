# PROJECT PLAN - OVERHAUL OF LEGACY OFFICE CARE SYSTEM DOCUMENTATION

> Dynamic Plan Slug: `office-care-docs-redesign`

---

## 📋 Overview

The purpose of this project is to perform a comprehensive overhaul and redesign of the four legacy planning and architecture documents (`PHYSIOFLOW_CONTEXT.md`, `PLAN-physio-website.md`, `PLAN-pm-roadmap.md`, `MODULE_ARCHITECTURE.md`) in the repository root. These files represent the initial analysis of the clinic management system. Since the platform has evolved into a production-ready system with a 3-tier backend, feature-based React frontend, and a simplified clinical trial/booking logic, these files must be rewritten to match 100% of the actual code and detail the future expansion roadmap.

---

## 🎯 Success Criteria

- Complete rebranding of all legacy documentation from "PhysioFlow" to "Office Care".
- 100% alignment between the database schemas described in the docs and the actual `office_care_backup.sql` structure.
- Perfect mapping of frontend and backend directory trees to reflect the active codebase.
- Inclusion of the exact 3-session trial flow and 50% refund mathematical model.
- Concrete future development roadmap containing the 7 advanced modules (SOAP Notes, Doctor Body Map, Advanced Receptionist, Patient Recovery Curve, SMS/Zalo Notifications, AI integration, Multi-branch).

---

## 💻 Project Type & Tech Stack Baseline

- **Project Type:** WEB and BACKEND
- **Language / Runtime:** TypeScript, Node.js, React (Vite)
- **Database:** PostgreSQL (raw SQL queries with `pg` driver, no ORM)
- **Backend Architecture:** 3-Tier (Routes -> Controllers -> Services -> Repositories)
- **Frontend Architecture:** Feature-Based (admin, auth, customer, receptionist, public)
- **State Management:** Zustand

---

## 📁 Document Structure & Scope

The files to be redesigned and updated in the project root:
1.  [PHYSIOFLOW_CONTEXT.md](file:///d:/VLTT/VLTT/PHYSIOFLOW_CONTEXT.md) -> Rebrand to `OFFICE_CARE_CONTEXT.md` or fully rewrite content to align with SQL backups.
2.  [MODULE_ARCHITECTURE.md](file:///d:/VLTT/VLTT/MODULE_ARCHITECTURE.md) -> Redesign to reflect five active actor roles and correct business flows.
3.  [PLAN-physio-website.md](file:///d:/VLTT/VLTT/PLAN-physio-website.md) -> Overhaul to detail the completed technical tasks.
4.  [PLAN-pm-roadmap.md](file:///d:/VLTT/VLTT/PLAN-pm-roadmap.md) -> Overhaul to detail baseline features and future roadmap.

---

## 📋 Task Breakdown (Execution Phases)

### Phase 1: Context & Database Schema Synchronization
| Task ID | Task Name | Agent | Skills | Priority | Dependencies | INPUT → OUTPUT → VERIFY |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **T1.1** | Rebrand & Rewrite Context File | `@[database-architect]` | `database-design`, `clean-code` | P0 | N/A | **INPUT:** `office_care_backup.sql` and `PHYSIOFLOW_CONTEXT.md` <br>**OUTPUT:** Completely synchronized database schemas and configuration parameters. <br>**VERIFY:** Verify that every table column, type, view, and constraint matches the actual PostgreSQL schema. |

### Phase 2: Domain Architecture & Business Flow Mapping
| Task ID | Task Name | Agent | Skills | Priority | Dependencies | INPUT → OUTPUT → VERIFY |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **T2.1** | Overhaul Module Architecture | `@[product-manager]` | `brainstorming`, `plan-writing` | P1 | T1.1 | **INPUT:** Actual code (`routes/`, `controllers/`, `services/`) and `MODULE_ARCHITECTURE.md` <br>**OUTPUT:** Beautifully updated actor-screen matrix, smart booking flow, and 3-session trial flow. <br>**VERIFY:** Verify the actor matrix perfectly represents all 5 roles and the 50% refund formula is documented. |

### Phase 3: Project Task & Directory Overhaul
| Task ID | Task Name | Agent | Skills | Priority | Dependencies | INPUT → OUTPUT → VERIFY |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **T3.1** | Overhaul Website Plan | `@[frontend-specialist]` | `frontend-design`, `react-best-practices` | P1 | T2.1 | **INPUT:** Current directories (`frontend/src/features/`, `backend/src/`) and `PLAN-physio-website.md` <br>**OUTPUT:** Accurate directory tree layouts, completed task lists, and alignment checks. <br>**VERIFY:** Confirm the directory trees perfectly represent the active codebase. |

### Phase 4: Roadmap & Backlog Architecture
| Task ID | Task Name | Agent | Skills | Priority | Dependencies | INPUT → OUTPUT → VERIFY |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **T4.1** | Redesign PM Roadmap & Future Backlog | `@[project-planner]` | `plan-writing`, `brainstorming` | P1 | T3.1 | **INPUT:** Current `TASKS.md` backlog and `PLAN-pm-roadmap.md` <br>**OUTPUT:** Completed features baseline and detailed future roadmap (7 advanced modules). <br>**VERIFY:** Review the roadmap to ensure it includes all future modules with detailed business descriptions. |

---

## 🏁 Phase X: Final Verification

- [ ] Verify that all legacy references to "PhysioFlow" are successfully rebranded to "Office Care".
- [ ] Cross-check all database schemas in the documents with the active `office_care_backup.sql` database file.
- [ ] Confirm the booking and billing flows in `MODULE_ARCHITECTURE.md` perfectly represent the active backend middleware, Zod schemas, and local storage recovery logic.
- [ ] Verify the roadmap is clearly detailed with a robust future development vision.

### ✅ PHASE X COMPLETE
- Status: ⏳ Awaiting User Approval to Start Phase 1
- Date: 2026-05-18
