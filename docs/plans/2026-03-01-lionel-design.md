# Lionel - Issue Management Platform Design

**Goal:** A cross-functional issue management platform for tracking complex compliance/audit findings that require multiple teams (legal, IT, audit, external vendors) to resolve collaboratively.

**Architecture:** Hierarchical model — Issues contain Team Workstreams, Workstreams contain Tasks. Dependencies exist at both workstream and task level. FastAPI backend with JWT auth, React frontend with Kanban + Gantt views.

**Tech Stack:** Python 3 / FastAPI / SQLAlchemy / SQLite, React 18 / Vite / Tailwind CSS / Recharts

---

## Data Model

### Users & Auth
- **User** — id, email, password_hash, name, role (admin / team_lead / member / external), team_id, created_at
- **Team** — id, name, description, created_at
- Auth via JWT tokens (login returns access + refresh token)

### Core Entities
- **Issue** — id, title, description, priority (critical/high/medium/low), status (open/in_progress/blocked/resolved/closed), source (manual/imported), created_by, created_at, due_date
- **Workstream** — id, issue_id (FK), team_id (FK), title, status (pending/in_progress/blocked/completed), due_date, created_at
- **Task** — id, workstream_id (FK), title, description, status (todo/in_progress/blocked/done), assigned_to (FK to User), due_date, created_at

### Dependencies
- **WorkstreamDependency** — id, workstream_id (FK), depends_on_workstream_id (FK)
- **TaskDependency** — id, task_id (FK), depends_on_task_id (FK)

### Relationships
```
Issue 1──* Workstream *──1 Team
Workstream 1──* Task *──1 User (assignee)
Workstream *──* Workstream (dependencies)
Task *──* Task (dependencies)
```

---

## Authentication & Roles

**Auth mechanism:** JWT tokens
- POST `/api/auth/register` — create account (admin-only for creating team leads/externals)
- POST `/api/auth/login` — returns access token (30 min) + refresh token (7 days)
- POST `/api/auth/refresh` — rotate access token
- Middleware checks JWT on all `/api/*` routes except login/register

### Role Permissions

| Action | Admin | Team Lead | Member | External |
|--------|-------|-----------|--------|----------|
| Create/edit/delete issues | Yes | No | No | No |
| Create/assign workstreams | Yes | Own team | No | No |
| Create/edit tasks | Yes | Own workstream | Own tasks | No |
| Set dependencies | Yes | Own workstream | No | No |
| View all issues | Yes | Yes | Yes | Assigned only |
| Manage users/teams | Yes | No | No | No |
| View Gantt/Kanban | Yes | Yes | Yes | Assigned only |

---

## API Surface

### Auth
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/auth/register` | Create user (admin only, except first user) |
| POST | `/api/auth/login` | Login, returns JWT tokens |
| POST | `/api/auth/refresh` | Refresh access token |

### Users & Teams
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/users` | List users (admin) |
| GET | `/api/users/me` | Current user profile |
| GET | `/api/teams` | List teams |
| POST | `/api/teams` | Create team (admin) |
| GET | `/api/teams/{id}` | Team detail + members |

### Issues
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/issues` | List issues (filtered by role visibility) |
| POST | `/api/issues` | Create issue (admin) |
| GET | `/api/issues/{id}` | Full issue detail with workstreams, tasks, dependencies |
| PUT | `/api/issues/{id}` | Update issue (admin) |
| DELETE | `/api/issues/{id}` | Delete issue (admin) |
| GET | `/api/issues/stats` | Dashboard stats |

### Workstreams
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/issues/{id}/workstreams` | Add workstream to issue |
| PUT | `/api/workstreams/{id}` | Update workstream |
| DELETE | `/api/workstreams/{id}` | Remove workstream (admin) |
| POST | `/api/workstreams/{id}/dependencies` | Add workstream dependency |
| DELETE | `/api/workstreams/{id}/dependencies/{dep_id}` | Remove dependency |

### Tasks
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/workstreams/{id}/tasks` | Create task in workstream |
| PUT | `/api/tasks/{id}` | Update task |
| DELETE | `/api/tasks/{id}` | Delete task |
| POST | `/api/tasks/{id}/dependencies` | Add task dependency |
| DELETE | `/api/tasks/{id}/dependencies/{dep_id}` | Remove dependency |

### Views
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/issues/{id}/gantt` | Gantt data |
| GET | `/api/issues/{id}/kanban` | Kanban data |

---

## Frontend UI

1. **Login Page** — email/password form
2. **Dashboard** — stats cards (total, open, blocked, overdue, resolved), issues by priority, quick filters, activity feed
3. **Issue List** — filterable/sortable table (title, priority, status, workstreams, due date)
4. **Issue Detail** — header, workstream cards with dependency indicators, expandable tasks, Kanban + Gantt view tabs
5. **Team Management** (admin) — create teams, manage members
6. **User Management** (admin) — create users, assign roles/teams

**Gantt:** `gantt-task-react` or custom CSS grid implementation.

---

## Phasing

### Phase 1 — Foundation
- Project scaffolding (FastAPI + React + SQLite)
- Auth system (JWT, register, login, refresh)
- User & Team management (CRUD, role assignment)
- Issue CRUD (create, list, detail, update, delete)
- Dashboard with basic stats
- Issue list with filters

### Phase 2 — Workstreams & Tasks
- Workstream CRUD within issues
- Task CRUD within workstreams
- Workstream and task dependency management
- Dependency validation (circular dependency detection)
- Issue detail page with expandable workstreams

### Phase 3 — Views
- Kanban board (tasks by status, grouped by workstream)
- Gantt chart (timeline with dependency arrows)

### Phase 4 — Import & Polish
- Import issues from CSV/audit reports
- Activity/audit log
- Email notifications
- External user scoped views
