# Lionel Phase 1 — Foundation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the foundation of Lionel — project scaffolding, JWT authentication with 4 roles, user/team management, issue CRUD, dashboard stats, and a React frontend with login, issue list, and admin pages.

**Architecture:** FastAPI backend with SQLAlchemy ORM on SQLite. JWT auth (access + refresh tokens). Role-based access control (admin, team_lead, member, external). React 18 frontend with Vite, Tailwind CSS, and Recharts.

**Tech Stack:** Python 3 / FastAPI / SQLAlchemy / SQLite / python-jose / passlib, React 18 / Vite / Tailwind CSS / Recharts / Axios

---

## Project Structure

```
Lionel/
├── backend/
│   ├── main.py              # FastAPI app, CORS, router registration
│   ├── config.py            # Environment config
│   ├── database.py          # SQLAlchemy engine, models, session
│   ├── auth.py              # Password hashing + JWT token utils
│   ├── dependencies.py      # FastAPI deps (get_db, get_current_user, role checks)
│   ├── models/
│   │   └── schemas.py       # All Pydantic request/response schemas
│   ├── routers/
│   │   ├── auth.py          # Register, login, refresh
│   │   ├── users.py         # List users, get me
│   │   ├── teams.py         # Team CRUD
│   │   └── issues.py        # Issue CRUD + stats
│   ├── tests/
│   │   ├── conftest.py      # Test fixtures
│   │   ├── test_auth.py     # Auth endpoint tests
│   │   ├── test_teams.py    # Team endpoint tests
│   │   ├── test_users.py    # User endpoint tests
│   │   └── test_issues.py   # Issue endpoint tests
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── api/client.js
│   │   ├── contexts/AuthContext.jsx
│   │   └── components/
│   │       ├── Login.jsx
│   │       ├── ProtectedRoute.jsx
│   │       ├── Navbar.jsx
│   │       ├── Dashboard.jsx
│   │       ├── IssueList.jsx
│   │       ├── IssueDetail.jsx
│   │       ├── IssueForm.jsx
│   │       ├── TeamManagement.jsx
│   │       └── UserManagement.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json
├── docs/plans/
├── CLAUDE.md
└── .gitignore
```

---

### Task 1: Backend Scaffolding

**Files:**
- Create: `backend/requirements.txt`
- Create: `backend/config.py`
- Create: `backend/database.py`
- Create: `backend/main.py`
- Create: `.gitignore`

**Step 1: Create requirements.txt**

```
fastapi==0.115.0
uvicorn[standard]==0.30.6
sqlalchemy==2.0.35
python-dotenv==1.0.1
python-multipart==0.0.9
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
pytest==8.3.3
httpx==0.27.2
```

**Step 2: Create config.py**

```python
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./lionel.db")
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7
```

**Step 3: Create database.py with all Phase 1 models**

```python
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Float, ForeignKey, Enum
from sqlalchemy.orm import declarative_base, relationship, sessionmaker
from datetime import datetime, timezone
import enum

from config import DATABASE_URL

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class RoleEnum(str, enum.Enum):
    admin = "admin"
    team_lead = "team_lead"
    member = "member"
    external = "external"


class IssuePriority(str, enum.Enum):
    critical = "critical"
    high = "high"
    medium = "medium"
    low = "low"


class IssueStatus(str, enum.Enum):
    open = "open"
    in_progress = "in_progress"
    blocked = "blocked"
    resolved = "resolved"
    closed = "closed"


class IssueSource(str, enum.Enum):
    manual = "manual"
    imported = "imported"


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    name = Column(String, nullable=False)
    role = Column(String, default=RoleEnum.member)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    team = relationship("Team", back_populates="members")
    created_issues = relationship("Issue", back_populates="creator")


class Team(Base):
    __tablename__ = "teams"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    members = relationship("User", back_populates="team")


class Issue(Base):
    __tablename__ = "issues"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    priority = Column(String, default=IssuePriority.medium)
    status = Column(String, default=IssueStatus.open)
    source = Column(String, default=IssueSource.manual)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    due_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    creator = relationship("User", back_populates="created_issues")


Base.metadata.create_all(bind=engine)
```

**Step 4: Create main.py**

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Lionel", description="Issue Management Platform")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health_check():
    return {"status": "healthy"}
```

**Step 5: Create .gitignore**

```
__pycache__/
*.pyc
*.db
.env
node_modules/
dist/
.vite/
```

**Step 6: Verify backend starts**

Run: `cd backend && python -c "from main import app; print('OK')"`
Expected: `OK`

**Step 7: Commit**

```bash
git add backend/requirements.txt backend/config.py backend/database.py backend/main.py .gitignore
git commit -m "feat: backend scaffolding with FastAPI, SQLAlchemy models, config"
```

---

### Task 2: Auth Service

**Files:**
- Create: `backend/auth.py`

**Step 1: Create auth.py with password hashing and JWT utils**

```python
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
from jose import jwt, JWTError

from config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES, REFRESH_TOKEN_EXPIRE_DAYS

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict | None:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None
```

**Step 2: Commit**

```bash
git add backend/auth.py
git commit -m "feat: auth service with password hashing and JWT tokens"
```

---

### Task 3: FastAPI Dependencies

**Files:**
- Create: `backend/dependencies.py`

**Step 1: Create dependencies.py**

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from database import SessionLocal, User
from auth import decode_token

security = HTTPBearer()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    token = credentials.credentials
    payload = decode_token(token)
    if payload is None or payload.get("type") != "access":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return current_user


def require_admin_or_team_lead(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in ("admin", "team_lead"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin or Team Lead access required")
    return current_user
```

**Step 2: Commit**

```bash
git add backend/dependencies.py
git commit -m "feat: FastAPI dependencies for DB session, auth, and role checks"
```

---

### Task 4: Pydantic Schemas

**Files:**
- Create: `backend/models/__init__.py`
- Create: `backend/models/schemas.py`

**Step 1: Create empty __init__.py**

```python
```

**Step 2: Create schemas.py**

```python
from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional


# --- Auth ---

class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str
    role: str = "member"
    team_id: Optional[int] = None


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


# --- Users ---

class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    role: str
    team_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


# --- Teams ---

class TeamCreate(BaseModel):
    name: str
    description: Optional[str] = None


class TeamResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    created_at: datetime
    members: list[UserResponse] = []

    class Config:
        from_attributes = True


class TeamSummary(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    member_count: int = 0

    class Config:
        from_attributes = True


# --- Issues ---

class IssueCreate(BaseModel):
    title: str
    description: Optional[str] = None
    priority: str = "medium"
    due_date: Optional[datetime] = None


class IssueUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    due_date: Optional[datetime] = None


class IssueResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    priority: str
    status: str
    source: str
    created_by: int
    creator_name: Optional[str] = None
    due_date: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class IssueSummary(BaseModel):
    id: int
    title: str
    priority: str
    status: str
    due_date: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


# --- Dashboard ---

class DashboardStats(BaseModel):
    total_issues: int = 0
    open_issues: int = 0
    in_progress_issues: int = 0
    blocked_issues: int = 0
    resolved_issues: int = 0
    closed_issues: int = 0
    overdue_issues: int = 0
    critical_issues: int = 0
    total_teams: int = 0
    total_users: int = 0
```

**Step 3: Commit**

```bash
git add backend/models/
git commit -m "feat: Pydantic schemas for auth, users, teams, issues, dashboard"
```

---

### Task 5: Test Infrastructure

**Files:**
- Create: `backend/tests/__init__.py`
- Create: `backend/tests/conftest.py`

**Step 1: Create empty __init__.py**

```python
```

**Step 2: Create conftest.py**

```python
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from database import Base
from main import app
from dependencies import get_db
from auth import hash_password

TEST_DATABASE_URL = "sqlite:///./test_lionel.db"
engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def admin_user(db):
    from database import User
    user = User(
        email="admin@test.com",
        password_hash=hash_password("admin123"),
        name="Admin User",
        role="admin",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def admin_token(client, admin_user):
    response = client.post("/api/auth/login", json={"email": "admin@test.com", "password": "admin123"})
    return response.json()["access_token"]


@pytest.fixture
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture
def member_user(db):
    from database import User
    user = User(
        email="member@test.com",
        password_hash=hash_password("member123"),
        name="Member User",
        role="member",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def member_token(client, member_user):
    response = client.post("/api/auth/login", json={"email": "member@test.com", "password": "member123"})
    return response.json()["access_token"]


@pytest.fixture
def member_headers(member_token):
    return {"Authorization": f"Bearer {member_token}"}
```

**Step 3: Run pytest to verify fixtures load (no tests yet)**

Run: `cd backend && python -m pytest tests/ -v`
Expected: `no tests ran` (0 collected, no errors)

**Step 4: Commit**

```bash
git add backend/tests/
git commit -m "feat: test infrastructure with fixtures for admin and member users"
```

---

### Task 6: Auth Router

**Files:**
- Create: `backend/routers/__init__.py`
- Create: `backend/routers/auth.py`
- Modify: `backend/main.py` — register auth router

**Step 1: Create empty __init__.py**

```python
```

**Step 2: Create routers/auth.py**

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import User
from dependencies import get_db
from auth import hash_password, verify_password, create_access_token, create_refresh_token, decode_token
from models.schemas import RegisterRequest, LoginRequest, TokenResponse, RefreshRequest, UserResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    # Check if any users exist — first user becomes admin automatically
    user_count = db.query(User).count()
    if user_count > 0:
        # Only admins can register new users after the first
        # For now, allow registration (auth check added when we wire middleware)
        pass

    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    role = "admin" if user_count == 0 else req.role

    user = User(
        email=req.email,
        password_hash=hash_password(req.password),
        name=req.name,
        role=role,
        team_id=req.team_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/refresh", response_model=TokenResponse)
def refresh(req: RefreshRequest, db: Session = Depends(get_db)):
    payload = decode_token(req.refresh_token)
    if payload is None or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)
```

**Step 3: Update main.py to register auth router**

Replace `backend/main.py` with:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth

app = FastAPI(title="Lionel", description="Issue Management Platform")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)


@app.get("/api/health")
def health_check():
    return {"status": "healthy"}
```

**Step 4: Commit**

```bash
git add backend/routers/ backend/main.py
git commit -m "feat: auth router with register, login, refresh endpoints"
```

---

### Task 7: Auth Tests

**Files:**
- Create: `backend/tests/test_auth.py`

**Step 1: Write auth tests**

```python
def test_register_first_user_becomes_admin(client):
    response = client.post("/api/auth/register", json={
        "email": "first@test.com",
        "password": "password123",
        "name": "First User",
    })
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "first@test.com"
    assert data["role"] == "admin"


def test_register_duplicate_email(client, admin_user):
    response = client.post("/api/auth/register", json={
        "email": "admin@test.com",
        "password": "password123",
        "name": "Duplicate",
    })
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"]


def test_login_success(client, admin_user):
    response = client.post("/api/auth/login", json={
        "email": "admin@test.com",
        "password": "admin123",
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


def test_login_wrong_password(client, admin_user):
    response = client.post("/api/auth/login", json={
        "email": "admin@test.com",
        "password": "wrong",
    })
    assert response.status_code == 401


def test_refresh_token(client, admin_user):
    login_resp = client.post("/api/auth/login", json={
        "email": "admin@test.com",
        "password": "admin123",
    })
    refresh_token = login_resp.json()["refresh_token"]

    response = client.post("/api/auth/refresh", json={
        "refresh_token": refresh_token,
    })
    assert response.status_code == 200
    assert "access_token" in response.json()


def test_protected_endpoint_no_token(client):
    response = client.get("/api/users/me")
    assert response.status_code == 403
```

**Step 2: Run tests**

Run: `cd backend && python -m pytest tests/test_auth.py -v`
Expected: 6 tests PASS (test_protected_endpoint_no_token will pass once users router exists — skip if it fails for now)

**Step 3: Commit**

```bash
git add backend/tests/test_auth.py
git commit -m "test: auth endpoint tests (register, login, refresh)"
```

---

### Task 8: Team Router

**Files:**
- Create: `backend/routers/teams.py`
- Modify: `backend/main.py` — register teams router

**Step 1: Create routers/teams.py**

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import Team, User
from dependencies import get_db, get_current_user, require_admin
from models.schemas import TeamCreate, TeamResponse, TeamSummary

router = APIRouter(prefix="/api/teams", tags=["teams"])


@router.get("", response_model=list[TeamSummary])
def list_teams(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    teams = db.query(Team).all()
    result = []
    for team in teams:
        result.append(TeamSummary(
            id=team.id,
            name=team.name,
            description=team.description,
            member_count=len(team.members),
        ))
    return result


@router.post("", response_model=TeamResponse, status_code=status.HTTP_201_CREATED)
def create_team(req: TeamCreate, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    existing = db.query(Team).filter(Team.name == req.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Team name already exists")

    team = Team(name=req.name, description=req.description)
    db.add(team)
    db.commit()
    db.refresh(team)
    return team


@router.get("/{team_id}", response_model=TeamResponse)
def get_team(team_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    return team
```

**Step 2: Add teams router to main.py**

Add import and include:
```python
from routers import auth, teams
# ...
app.include_router(teams.router)
```

**Step 3: Commit**

```bash
git add backend/routers/teams.py backend/main.py
git commit -m "feat: team CRUD endpoints (list, create, get)"
```

---

### Task 9: Team Tests

**Files:**
- Create: `backend/tests/test_teams.py`

**Step 1: Write team tests**

```python
def test_create_team(client, admin_headers):
    response = client.post("/api/teams", json={"name": "Legal", "description": "Legal department"}, headers=admin_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Legal"
    assert data["description"] == "Legal department"


def test_create_team_non_admin_forbidden(client, member_headers):
    response = client.post("/api/teams", json={"name": "Legal"}, headers=member_headers)
    assert response.status_code == 403


def test_create_team_duplicate_name(client, admin_headers):
    client.post("/api/teams", json={"name": "Legal"}, headers=admin_headers)
    response = client.post("/api/teams", json={"name": "Legal"}, headers=admin_headers)
    assert response.status_code == 400


def test_list_teams(client, admin_headers):
    client.post("/api/teams", json={"name": "Legal"}, headers=admin_headers)
    client.post("/api/teams", json={"name": "IT"}, headers=admin_headers)
    response = client.get("/api/teams", headers=admin_headers)
    assert response.status_code == 200
    assert len(response.json()) == 2


def test_get_team(client, admin_headers):
    create_resp = client.post("/api/teams", json={"name": "Legal"}, headers=admin_headers)
    team_id = create_resp.json()["id"]
    response = client.get(f"/api/teams/{team_id}", headers=admin_headers)
    assert response.status_code == 200
    assert response.json()["name"] == "Legal"


def test_get_team_not_found(client, admin_headers):
    response = client.get("/api/teams/999", headers=admin_headers)
    assert response.status_code == 404
```

**Step 2: Run tests**

Run: `cd backend && python -m pytest tests/test_teams.py -v`
Expected: 6 tests PASS

**Step 3: Commit**

```bash
git add backend/tests/test_teams.py
git commit -m "test: team CRUD endpoint tests"
```

---

### Task 10: User Router

**Files:**
- Create: `backend/routers/users.py`
- Modify: `backend/main.py` — register users router

**Step 1: Create routers/users.py**

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import User
from dependencies import get_db, get_current_user, require_admin
from models.schemas import UserResponse

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.get("", response_model=list[UserResponse])
def list_users(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    return db.query(User).all()
```

**Step 2: Add users router to main.py**

Add import and include:
```python
from routers import auth, teams, users
# ...
app.include_router(users.router)
```

**Step 3: Commit**

```bash
git add backend/routers/users.py backend/main.py
git commit -m "feat: user endpoints (get me, list users)"
```

---

### Task 11: User Tests

**Files:**
- Create: `backend/tests/test_users.py`

**Step 1: Write user tests**

```python
def test_get_me(client, admin_headers):
    response = client.get("/api/users/me", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "admin@test.com"
    assert data["role"] == "admin"


def test_get_me_no_token(client):
    response = client.get("/api/users/me")
    assert response.status_code == 403


def test_list_users_admin(client, admin_headers, member_user):
    response = client.get("/api/users", headers=admin_headers)
    assert response.status_code == 200
    assert len(response.json()) == 2


def test_list_users_non_admin_forbidden(client, member_headers):
    response = client.get("/api/users", headers=member_headers)
    assert response.status_code == 403
```

**Step 2: Run tests**

Run: `cd backend && python -m pytest tests/test_users.py -v`
Expected: 4 tests PASS

**Step 3: Commit**

```bash
git add backend/tests/test_users.py
git commit -m "test: user endpoint tests"
```

---

### Task 12: Issue Router

**Files:**
- Create: `backend/routers/issues.py`
- Modify: `backend/main.py` — register issues router

**Step 1: Create routers/issues.py**

```python
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from database import Issue, User, Team
from dependencies import get_db, get_current_user, require_admin
from models.schemas import IssueCreate, IssueUpdate, IssueResponse, IssueSummary, DashboardStats

router = APIRouter(prefix="/api/issues", tags=["issues"])


@router.get("/stats", response_model=DashboardStats)
def get_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    issues = db.query(Issue).all()
    now = datetime.now(timezone.utc)
    stats = DashboardStats(
        total_issues=len(issues),
        open_issues=sum(1 for i in issues if i.status == "open"),
        in_progress_issues=sum(1 for i in issues if i.status == "in_progress"),
        blocked_issues=sum(1 for i in issues if i.status == "blocked"),
        resolved_issues=sum(1 for i in issues if i.status == "resolved"),
        closed_issues=sum(1 for i in issues if i.status == "closed"),
        overdue_issues=sum(1 for i in issues if i.due_date and i.due_date < now and i.status not in ("resolved", "closed")),
        critical_issues=sum(1 for i in issues if i.priority == "critical" and i.status not in ("resolved", "closed")),
        total_teams=db.query(Team).count(),
        total_users=db.query(User).count(),
    )
    return stats


@router.get("", response_model=list[IssueSummary])
def list_issues(
    status: str | None = Query(None),
    priority: str | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Issue)
    if status:
        query = query.filter(Issue.status == status)
    if priority:
        query = query.filter(Issue.priority == priority)
    query = query.order_by(Issue.created_at.desc())
    return query.all()


@router.post("", response_model=IssueResponse, status_code=status.HTTP_201_CREATED)
def create_issue(
    req: IssueCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    issue = Issue(
        title=req.title,
        description=req.description,
        priority=req.priority,
        due_date=req.due_date,
        created_by=current_user.id,
    )
    db.add(issue)
    db.commit()
    db.refresh(issue)
    return _issue_to_response(issue)


@router.get("/{issue_id}", response_model=IssueResponse)
def get_issue(issue_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    return _issue_to_response(issue)


@router.put("/{issue_id}", response_model=IssueResponse)
def update_issue(
    issue_id: int,
    req: IssueUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    for field, value in req.model_dump(exclude_unset=True).items():
        setattr(issue, field, value)

    db.commit()
    db.refresh(issue)
    return _issue_to_response(issue)


@router.delete("/{issue_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_issue(issue_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    db.delete(issue)
    db.commit()


def _issue_to_response(issue: Issue) -> IssueResponse:
    return IssueResponse(
        id=issue.id,
        title=issue.title,
        description=issue.description,
        priority=issue.priority,
        status=issue.status,
        source=issue.source,
        created_by=issue.created_by,
        creator_name=issue.creator.name if issue.creator else None,
        due_date=issue.due_date,
        created_at=issue.created_at,
    )
```

**Step 2: Add issues router to main.py**

Add import and include:
```python
from routers import auth, teams, users, issues
# ...
app.include_router(issues.router)
```

**Step 3: Commit**

```bash
git add backend/routers/issues.py backend/main.py
git commit -m "feat: issue CRUD + stats endpoints with role-based access"
```

---

### Task 13: Issue Tests

**Files:**
- Create: `backend/tests/test_issues.py`

**Step 1: Write issue tests**

```python
def test_create_issue(client, admin_headers):
    response = client.post("/api/issues", json={
        "title": "SOX Compliance Finding",
        "description": "Access controls need remediation",
        "priority": "high",
    }, headers=admin_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "SOX Compliance Finding"
    assert data["priority"] == "high"
    assert data["status"] == "open"


def test_create_issue_non_admin_forbidden(client, member_headers):
    response = client.post("/api/issues", json={
        "title": "Test Issue",
    }, headers=member_headers)
    assert response.status_code == 403


def test_list_issues(client, admin_headers):
    client.post("/api/issues", json={"title": "Issue 1"}, headers=admin_headers)
    client.post("/api/issues", json={"title": "Issue 2"}, headers=admin_headers)
    response = client.get("/api/issues", headers=admin_headers)
    assert response.status_code == 200
    assert len(response.json()) == 2


def test_list_issues_filter_by_priority(client, admin_headers):
    client.post("/api/issues", json={"title": "Critical", "priority": "critical"}, headers=admin_headers)
    client.post("/api/issues", json={"title": "Low", "priority": "low"}, headers=admin_headers)
    response = client.get("/api/issues?priority=critical", headers=admin_headers)
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["priority"] == "critical"


def test_get_issue(client, admin_headers):
    create_resp = client.post("/api/issues", json={"title": "Test Issue"}, headers=admin_headers)
    issue_id = create_resp.json()["id"]
    response = client.get(f"/api/issues/{issue_id}", headers=admin_headers)
    assert response.status_code == 200
    assert response.json()["title"] == "Test Issue"


def test_update_issue(client, admin_headers):
    create_resp = client.post("/api/issues", json={"title": "Test Issue"}, headers=admin_headers)
    issue_id = create_resp.json()["id"]
    response = client.put(f"/api/issues/{issue_id}", json={"status": "in_progress"}, headers=admin_headers)
    assert response.status_code == 200
    assert response.json()["status"] == "in_progress"


def test_delete_issue(client, admin_headers):
    create_resp = client.post("/api/issues", json={"title": "Test Issue"}, headers=admin_headers)
    issue_id = create_resp.json()["id"]
    response = client.delete(f"/api/issues/{issue_id}", headers=admin_headers)
    assert response.status_code == 204


def test_get_stats(client, admin_headers):
    client.post("/api/issues", json={"title": "Issue 1", "priority": "critical"}, headers=admin_headers)
    client.post("/api/issues", json={"title": "Issue 2", "priority": "low"}, headers=admin_headers)
    response = client.get("/api/issues/stats", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["total_issues"] == 2
    assert data["open_issues"] == 2
    assert data["critical_issues"] == 1
```

**Step 2: Run all tests**

Run: `cd backend && python -m pytest tests/ -v`
Expected: All tests PASS

**Step 3: Commit**

```bash
git add backend/tests/test_issues.py
git commit -m "test: issue CRUD and stats endpoint tests"
```

---

### Task 14: CLAUDE.md

**Files:**
- Create: `CLAUDE.md`

**Step 1: Create CLAUDE.md**

```markdown
# Lionel - CLAUDE.md

## Project Overview
Cross-functional issue management platform for tracking complex compliance/audit findings. Multiple teams (legal, IT, audit, external vendors) collaborate to resolve issues, each with their own workstreams and tasks.

## Tech Stack
- **Backend:** Python 3 / FastAPI / SQLAlchemy / SQLite / python-jose / passlib
- **Frontend:** React 18 / Vite / Tailwind CSS / Recharts / Axios

## Project Structure
```
Lionel/
├── backend/
│   ├── main.py            # FastAPI app, CORS, routers
│   ├── config.py          # Environment config
│   ├── database.py        # SQLAlchemy engine + models
│   ├── auth.py            # Password hashing + JWT utils
│   ├── dependencies.py    # FastAPI deps (get_db, auth, roles)
│   ├── models/schemas.py  # Pydantic request/response schemas
│   ├── routers/           # API route handlers
│   └── tests/             # pytest tests
└── frontend/
    ├── src/
    │   ├── App.jsx         # Router + layout
    │   ├── api/client.js   # Axios API wrapper
    │   ├── contexts/       # React contexts (auth)
    │   └── components/     # React components
    ├── vite.config.js
    └── package.json
```

## Running the App

### Backend (WSL)
```bash
source ~/workspace/lionel-venv/bin/activate
cd /mnt/c/Users/ticta/workspace2/Lionel/backend
uvicorn main:app --reload  # http://localhost:8000
```

### Frontend (WSL, separate terminal)
```bash
cd ~/workspace/lionel-frontend
npx vite --host  # http://localhost:5173
```

### First-time setup
```bash
# Python venv (must be on Linux filesystem)
python3 -m venv ~/workspace/lionel-venv
source ~/workspace/lionel-venv/bin/activate
pip install -r /mnt/c/Users/ticta/workspace2/Lionel/backend/requirements.txt

# Frontend (must be on Linux filesystem)
cp -r /mnt/c/Users/ticta/workspace2/Lionel/frontend ~/workspace/lionel-frontend
cd ~/workspace/lionel-frontend && npm install

# Backend .env
cp .env.example backend/.env  # then set SECRET_KEY
```

### System deps: `sudo apt install nodejs npm python3.12-venv`

## Key Conventions
- **API prefix:** All endpoints under `/api/`
- **Auth:** JWT tokens (access 30min + refresh 7 days)
- **Roles:** admin, team_lead, member, external
- **First registered user automatically becomes admin**
- **Issue priorities:** critical, high, medium, low
- **Issue statuses:** open, in_progress, blocked, resolved, closed

## Environment Variables
```
SECRET_KEY=<change-in-production>
DATABASE_URL=sqlite:///./lionel.db
```

## When Making Changes
- Backend schemas live in `models/schemas.py`
- New API routes go in `routers/` and get registered in `main.py`
- Auth dependencies in `dependencies.py` — use `require_admin` or `require_admin_or_team_lead`
- Frontend API calls go through `api/client.js`
- Tailwind classes for styling — no separate CSS files

## Current Status
- Phase 1 (foundation) in progress
- See ROADMAP.md and docs/plans/ for upcoming phases
```

**Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add CLAUDE.md project conventions"
```

---

### Task 15: Frontend Scaffolding

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/index.html`
- Create: `frontend/vite.config.js`
- Create: `frontend/tailwind.config.js`
- Create: `frontend/postcss.config.js`
- Create: `frontend/src/main.jsx`

**Step 1: Create package.json**

```json
{
  "name": "lionel-frontend",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "axios": "^1.7.4",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.0",
    "recharts": "^2.12.7"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.41",
    "tailwindcss": "^3.4.9",
    "vite": "^5.4.2"
  }
}
```

**Step 2: Create index.html**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Lionel - Issue Management</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

**Step 3: Create vite.config.js**

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
});
```

**Step 4: Create tailwind.config.js**

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

**Step 5: Create postcss.config.js**

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

**Step 6: Create src/main.jsx**

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

**Step 7: Create src/index.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**Step 8: Commit**

```bash
git add frontend/
git commit -m "feat: frontend scaffolding with Vite, React, Tailwind"
```

---

### Task 16: Frontend API Client + Auth Context

**Files:**
- Create: `frontend/src/api/client.js`
- Create: `frontend/src/contexts/AuthContext.jsx`

**Step 1: Create api/client.js**

```javascript
import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const resp = await axios.post('/api/auth/refresh', { refresh_token: refreshToken });
          localStorage.setItem('access_token', resp.data.access_token);
          localStorage.setItem('refresh_token', resp.data.refresh_token);
          originalRequest.headers.Authorization = `Bearer ${resp.data.access_token}`;
          return api(originalRequest);
        } catch {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const login = (email, password) => api.post('/auth/login', { email, password });
export const register = (data) => api.post('/auth/register', data);
export const getMe = () => api.get('/users/me');

// Teams
export const fetchTeams = () => api.get('/teams');
export const createTeam = (data) => api.post('/teams', data);
export const fetchTeam = (id) => api.get(`/teams/${id}`);

// Users
export const fetchUsers = () => api.get('/users');

// Issues
export const fetchIssues = (params) => api.get('/issues', { params });
export const createIssue = (data) => api.post('/issues', data);
export const fetchIssue = (id) => api.get(`/issues/${id}`);
export const updateIssue = (id, data) => api.put(`/issues/${id}`, data);
export const deleteIssue = (id) => api.delete(`/issues/${id}`);
export const fetchStats = () => api.get('/issues/stats');

export default api;
```

**Step 2: Create contexts/AuthContext.jsx**

```jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { getMe } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      getMe()
        .then((res) => setUser(res.data))
        .catch(() => {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = (accessToken, refreshToken, userData) => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login: handleLogin, logout: handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
```

**Step 3: Commit**

```bash
git add frontend/src/api/ frontend/src/contexts/
git commit -m "feat: API client with auto-refresh and AuthContext"
```

---

### Task 17: Frontend Components — Login + ProtectedRoute + Navbar + App

**Files:**
- Create: `frontend/src/components/Login.jsx`
- Create: `frontend/src/components/ProtectedRoute.jsx`
- Create: `frontend/src/components/Navbar.jsx`
- Create: `frontend/src/App.jsx`

**Step 1: Create Login.jsx**

```jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as apiLogin, getMe } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isRegistering) {
        const { register } = await import('../api/client');
        await register({ email, password, name });
      }
      const resp = await apiLogin(email, password);
      const { access_token, refresh_token } = resp.data;
      const meResp = await getMe();
      login(access_token, refresh_token, meResp.data);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-center mb-6">Lionel</h1>
        <h2 className="text-lg text-center text-gray-600 mb-6">
          {isRegistering ? 'Create Account' : 'Sign In'}
        </h2>
        {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegistering && (
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
          >
            {isRegistering ? 'Register' : 'Sign In'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-500">
          {isRegistering ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-blue-600 hover:underline"
          >
            {isRegistering ? 'Sign In' : 'Register'}
          </button>
        </p>
      </div>
    </div>
  );
}
```

**Step 2: Create ProtectedRoute.jsx**

```jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
```

**Step 3: Create Navbar.jsx**

```jsx
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center space-x-8">
            <Link to="/" className="text-xl font-bold text-blue-600">Lionel</Link>
            <Link to="/" className="text-gray-600 hover:text-gray-900">Dashboard</Link>
            <Link to="/issues" className="text-gray-600 hover:text-gray-900">Issues</Link>
            {user?.role === 'admin' && (
              <>
                <Link to="/teams" className="text-gray-600 hover:text-gray-900">Teams</Link>
                <Link to="/users" className="text-gray-600 hover:text-gray-900">Users</Link>
              </>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">{user?.name} ({user?.role})</span>
            <button
              onClick={handleLogout}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
```

**Step 4: Create App.jsx**

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import IssueList from './components/IssueList';
import IssueDetail from './components/IssueDetail';
import IssueForm from './components/IssueForm';
import TeamManagement from './components/TeamManagement';
import UserManagement from './components/UserManagement';

function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
          <Route path="/issues" element={<ProtectedRoute><Layout><IssueList /></Layout></ProtectedRoute>} />
          <Route path="/issues/new" element={<ProtectedRoute roles={['admin']}><Layout><IssueForm /></Layout></ProtectedRoute>} />
          <Route path="/issues/:id" element={<ProtectedRoute><Layout><IssueDetail /></Layout></ProtectedRoute>} />
          <Route path="/teams" element={<ProtectedRoute roles={['admin']}><Layout><TeamManagement /></Layout></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute roles={['admin']}><Layout><UserManagement /></Layout></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
```

**Step 5: Commit**

```bash
git add frontend/src/components/Login.jsx frontend/src/components/ProtectedRoute.jsx frontend/src/components/Navbar.jsx frontend/src/App.jsx
git commit -m "feat: Login, ProtectedRoute, Navbar, and App router"
```

---

### Task 18: Frontend Dashboard

**Files:**
- Create: `frontend/src/components/Dashboard.jsx`

**Step 1: Create Dashboard.jsx**

```jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchStats, fetchIssues } from '../api/client';

const STAT_CARDS = [
  { key: 'total_issues', label: 'Total Issues', color: 'bg-blue-500' },
  { key: 'open_issues', label: 'Open', color: 'bg-green-500' },
  { key: 'in_progress_issues', label: 'In Progress', color: 'bg-yellow-500' },
  { key: 'blocked_issues', label: 'Blocked', color: 'bg-red-500' },
  { key: 'resolved_issues', label: 'Resolved', color: 'bg-purple-500' },
  { key: 'overdue_issues', label: 'Overdue', color: 'bg-orange-500' },
];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentIssues, setRecentIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchStats(), fetchIssues()])
      .then(([statsRes, issuesRes]) => {
        setStats(statsRes.data);
        setRecentIssues(issuesRes.data.slice(0, 5));
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-8">Loading...</div>;

  const priorityColor = {
    critical: 'text-red-600 bg-red-50',
    high: 'text-orange-600 bg-orange-50',
    medium: 'text-yellow-600 bg-yellow-50',
    low: 'text-green-600 bg-green-50',
  };

  const statusColor = {
    open: 'text-blue-600 bg-blue-50',
    in_progress: 'text-yellow-600 bg-yellow-50',
    blocked: 'text-red-600 bg-red-50',
    resolved: 'text-purple-600 bg-purple-50',
    closed: 'text-gray-600 bg-gray-50',
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex space-x-3 text-sm text-gray-500">
          <span>{stats?.total_teams || 0} Teams</span>
          <span>{stats?.total_users || 0} Users</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {STAT_CARDS.map((card) => (
          <div key={card.key} className="bg-white rounded-lg shadow-sm p-4">
            <div className={`text-3xl font-bold ${card.color.replace('bg-', 'text-')}`}>
              {stats?.[card.key] || 0}
            </div>
            <div className="text-sm text-gray-500 mt-1">{card.label}</div>
          </div>
        ))}
      </div>

      {stats?.critical_issues > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <span className="font-semibold text-red-700">
            {stats.critical_issues} critical issue{stats.critical_issues > 1 ? 's' : ''} need attention
          </span>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">Recent Issues</h2>
          <Link to="/issues" className="text-sm text-blue-600 hover:underline">View all</Link>
        </div>
        {recentIssues.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">No issues yet</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentIssues.map((issue) => (
                <tr key={issue.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <Link to={`/issues/${issue.id}`} className="text-blue-600 hover:underline">{issue.title}</Link>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${priorityColor[issue.priority]}`}>
                      {issue.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${statusColor[issue.status]}`}>
                      {issue.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {issue.due_date ? new Date(issue.due_date).toLocaleDateString() : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add frontend/src/components/Dashboard.jsx
git commit -m "feat: Dashboard component with stats cards and recent issues"
```

---

### Task 19: Frontend Issue List

**Files:**
- Create: `frontend/src/components/IssueList.jsx`

**Step 1: Create IssueList.jsx**

```jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchIssues } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

export default function IssueList() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    const params = {};
    if (statusFilter) params.status = statusFilter;
    if (priorityFilter) params.priority = priorityFilter;
    setLoading(true);
    fetchIssues(params)
      .then((res) => setIssues(res.data))
      .finally(() => setLoading(false));
  }, [statusFilter, priorityFilter]);

  const priorityColor = {
    critical: 'text-red-600 bg-red-50',
    high: 'text-orange-600 bg-orange-50',
    medium: 'text-yellow-600 bg-yellow-50',
    low: 'text-green-600 bg-green-50',
  };

  const statusColor = {
    open: 'text-blue-600 bg-blue-50',
    in_progress: 'text-yellow-600 bg-yellow-50',
    blocked: 'text-red-600 bg-red-50',
    resolved: 'text-purple-600 bg-purple-50',
    closed: 'text-gray-600 bg-gray-50',
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Issues</h1>
        {user?.role === 'admin' && (
          <Link
            to="/issues/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition text-sm"
          >
            New Issue
          </Link>
        )}
      </div>

      <div className="flex space-x-4 mb-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm"
        >
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="blocked">Blocked</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm"
        >
          <option value="">All Priorities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : issues.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
          No issues found
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {issues.map((issue) => (
                <tr key={issue.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <Link to={`/issues/${issue.id}`} className="text-blue-600 hover:underline font-medium">
                      {issue.title}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${priorityColor[issue.priority]}`}>
                      {issue.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${statusColor[issue.status]}`}>
                      {issue.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {issue.due_date ? new Date(issue.due_date).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(issue.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add frontend/src/components/IssueList.jsx
git commit -m "feat: IssueList component with status and priority filters"
```

---

### Task 20: Frontend Issue Detail + Issue Form

**Files:**
- Create: `frontend/src/components/IssueDetail.jsx`
- Create: `frontend/src/components/IssueForm.jsx`

**Step 1: Create IssueDetail.jsx**

```jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchIssue, updateIssue, deleteIssue } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

export default function IssueDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    fetchIssue(id)
      .then((res) => {
        setIssue(res.data);
        setEditData(res.data);
      })
      .catch(() => navigate('/issues'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleUpdate = async () => {
    const resp = await updateIssue(id, {
      title: editData.title,
      description: editData.description,
      priority: editData.priority,
      status: editData.status,
    });
    setIssue(resp.data);
    setEditing(false);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this issue?')) {
      await deleteIssue(id);
      navigate('/issues');
    }
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (!issue) return null;

  const priorityColor = {
    critical: 'text-red-600 bg-red-50',
    high: 'text-orange-600 bg-orange-50',
    medium: 'text-yellow-600 bg-yellow-50',
    low: 'text-green-600 bg-green-50',
  };

  const statusColor = {
    open: 'text-blue-600 bg-blue-50',
    in_progress: 'text-yellow-600 bg-yellow-50',
    blocked: 'text-red-600 bg-red-50',
    resolved: 'text-purple-600 bg-purple-50',
    closed: 'text-gray-600 bg-gray-50',
  };

  return (
    <div>
      <button onClick={() => navigate('/issues')} className="text-sm text-gray-500 hover:text-gray-700 mb-4">
        &larr; Back to Issues
      </button>

      <div className="bg-white rounded-lg shadow-sm p-6">
        {editing ? (
          <div className="space-y-4">
            <input
              type="text"
              value={editData.title}
              onChange={(e) => setEditData({ ...editData, title: e.target.value })}
              className="w-full text-2xl font-bold border-b border-gray-300 focus:outline-none focus:border-blue-500 pb-2"
            />
            <textarea
              value={editData.description || ''}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              placeholder="Description"
            />
            <div className="flex space-x-4">
              <select
                value={editData.priority}
                onChange={(e) => setEditData({ ...editData, priority: e.target.value })}
                className="border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <select
                value={editData.status}
                onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                className="border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="blocked">Blocked</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div className="flex space-x-2">
              <button onClick={handleUpdate} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm">Save</button>
              <button onClick={() => { setEditing(false); setEditData(issue); }} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 text-sm">Cancel</button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-start mb-4">
              <h1 className="text-2xl font-bold">{issue.title}</h1>
              {user?.role === 'admin' && (
                <div className="flex space-x-2">
                  <button onClick={() => setEditing(true)} className="text-sm text-blue-600 hover:underline">Edit</button>
                  <button onClick={handleDelete} className="text-sm text-red-600 hover:underline">Delete</button>
                </div>
              )}
            </div>
            <div className="flex space-x-3 mb-4">
              <span className={`px-2 py-1 rounded text-xs font-medium ${priorityColor[issue.priority]}`}>
                {issue.priority}
              </span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${statusColor[issue.status]}`}>
                {issue.status.replace('_', ' ')}
              </span>
              <span className="text-sm text-gray-500">
                Created by {issue.creator_name || 'Unknown'} on {new Date(issue.created_at).toLocaleDateString()}
              </span>
            </div>
            {issue.description && (
              <p className="text-gray-700 whitespace-pre-wrap">{issue.description}</p>
            )}
            {issue.due_date && (
              <p className="mt-4 text-sm text-gray-500">
                Due: {new Date(issue.due_date).toLocaleDateString()}
              </p>
            )}

            <div className="mt-8 pt-6 border-t">
              <h2 className="text-lg font-semibold mb-4">Workstreams</h2>
              <p className="text-gray-500 text-sm">Workstreams will be available in Phase 2.</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
```

**Step 2: Create IssueForm.jsx**

```jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createIssue } from '../api/client';

export default function IssueForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    due_date: '',
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const data = { ...formData };
      if (!data.due_date) delete data.due_date;
      const resp = await createIssue(data);
      navigate(`/issues/${resp.data.id}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create issue');
    }
  };

  return (
    <div>
      <button onClick={() => navigate('/issues')} className="text-sm text-gray-500 hover:text-gray-700 mb-4">
        &larr; Back to Issues
      </button>
      <div className="bg-white rounded-lg shadow-sm p-6 max-w-2xl">
        <h1 className="text-2xl font-bold mb-6">New Issue</h1>
        {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
            />
          </div>
          <div className="flex space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
          </div>
          <div className="flex space-x-2 pt-4">
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition text-sm"
            >
              Create Issue
            </button>
            <button
              type="button"
              onClick={() => navigate('/issues')}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add frontend/src/components/IssueDetail.jsx frontend/src/components/IssueForm.jsx
git commit -m "feat: IssueDetail with inline editing and IssueForm for creating issues"
```

---

### Task 21: Frontend Admin Pages — Team + User Management

**Files:**
- Create: `frontend/src/components/TeamManagement.jsx`
- Create: `frontend/src/components/UserManagement.jsx`

**Step 1: Create TeamManagement.jsx**

```jsx
import { useState, useEffect } from 'react';
import { fetchTeams, createTeam } from '../api/client';

export default function TeamManagement() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const loadTeams = () => {
    fetchTeams()
      .then((res) => setTeams(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadTeams(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await createTeam({ name, description: description || null });
      setName('');
      setDescription('');
      setShowForm(false);
      loadTeams();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create team');
    }
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Team Management</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition text-sm"
        >
          {showForm ? 'Cancel' : 'New Team'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 max-w-lg">
          {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">{error}</div>}
          <form onSubmit={handleCreate} className="space-y-4">
            <input
              type="text"
              placeholder="Team Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm">
              Create Team
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teams.length === 0 ? (
          <div className="col-span-full bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
            No teams yet
          </div>
        ) : (
          teams.map((team) => (
            <div key={team.id} className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-semibold text-lg">{team.name}</h3>
              {team.description && <p className="text-sm text-gray-500 mt-1">{team.description}</p>}
              <p className="text-sm text-gray-400 mt-2">{team.member_count} member{team.member_count !== 1 ? 's' : ''}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
```

**Step 2: Create UserManagement.jsx**

```jsx
import { useState, useEffect } from 'react';
import { fetchUsers, register, fetchTeams } from '../api/client';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', name: '', role: 'member', team_id: '' });
  const [error, setError] = useState('');

  const loadData = () => {
    Promise.all([fetchUsers(), fetchTeams()])
      .then(([usersRes, teamsRes]) => {
        setUsers(usersRes.data);
        setTeams(teamsRes.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const data = { ...formData };
      if (data.team_id) data.team_id = parseInt(data.team_id);
      else delete data.team_id;
      await register(data);
      setFormData({ email: '', password: '', name: '', role: 'member', team_id: '' });
      setShowForm(false);
      loadData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create user');
    }
  };

  const roleColor = {
    admin: 'text-purple-600 bg-purple-50',
    team_lead: 'text-blue-600 bg-blue-50',
    member: 'text-green-600 bg-green-50',
    external: 'text-orange-600 bg-orange-50',
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition text-sm"
        >
          {showForm ? 'Cancel' : 'New User'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 max-w-lg">
          {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">{error}</div>}
          <form onSubmit={handleCreate} className="space-y-4">
            <input type="text" placeholder="Full Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required />
            <input type="email" placeholder="Email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required />
            <input type="password" placeholder="Password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required />
            <div className="flex space-x-4">
              <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="border border-gray-300 rounded-md px-3 py-2">
                <option value="member">Member</option>
                <option value="team_lead">Team Lead</option>
                <option value="admin">Admin</option>
                <option value="external">External</option>
              </select>
              <select value={formData.team_id} onChange={(e) => setFormData({ ...formData, team_id: e.target.value })} className="border border-gray-300 rounded-md px-3 py-2">
                <option value="">No Team</option>
                {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm">Create User</button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium">{u.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{u.email}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${roleColor[u.role]}`}>
                    {u.role.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{new Date(u.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add frontend/src/components/TeamManagement.jsx frontend/src/components/UserManagement.jsx
git commit -m "feat: Team and User management admin pages"
```

---

### Task 22: Run All Backend Tests + Push

**Step 1: Run all backend tests**

Run: `cd backend && python -m pytest tests/ -v`
Expected: All tests PASS

**Step 2: Push to GitHub**

```bash
git push origin main
```

**Step 3: Verify health endpoint**

Run: `cd backend && uvicorn main:app --reload &` then `curl http://localhost:8000/api/health`
Expected: `{"status":"healthy"}`
