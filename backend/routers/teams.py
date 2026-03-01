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
