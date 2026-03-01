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
