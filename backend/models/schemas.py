from pydantic import BaseModel
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
