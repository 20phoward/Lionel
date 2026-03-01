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
