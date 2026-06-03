import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload
from app.database import get_db
from app.models.user import User
from app.models.tpv import TpvSession, TpvPayment
from app.schemas.tpv import TpvSessionCreate, TpvSessionResponse, TpvCloseSession
from app.api.deps import get_current_user

router = APIRouter()


@router.get("/sessions/active")
async def get_active_session(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(TpvSession).where(
            TpvSession.company_id == current_user.company_id,
            TpvSession.status == "open",
        ).order_by(TpvSession.opened_at.desc())
    )
    session = result.scalar_one_or_none()
    if not session:
        return None
    return TpvSessionResponse.model_validate(session)


@router.post("/sessions/open")
async def open_session(
    data: TpvSessionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    existing = await db.execute(
        select(TpvSession).where(
            TpvSession.company_id == current_user.company_id,
            TpvSession.status == "open",
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Already have an open session")

    session = TpvSession(
        company_id=current_user.company_id,
        user_id=current_user.id,
        opening_amount=data.opening_amount,
        notes=data.notes,
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return TpvSessionResponse.model_validate(session)


@router.post("/sessions/{session_id}/close")
async def close_session(
    session_id: str,
    data: TpvCloseSession,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(TpvSession).where(
            TpvSession.id == uuid.UUID(session_id),
            TpvSession.company_id == current_user.company_id,
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session.status = "closed"
    session.closed_at = datetime.utcnow()
    session.closing_amount = data.closing_amount
    session.notes = data.notes or session.notes
    await db.commit()
    return TpvSessionResponse.model_validate(session)


@router.get("/sessions")
async def list_sessions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(TpvSession)
        .where(TpvSession.company_id == current_user.company_id)
        .order_by(TpvSession.opened_at.desc())
        .limit(50)
    )
    sessions = result.scalars().all()
    return [TpvSessionResponse.model_validate(s) for s in sessions]


@router.get("/sessions/{session_id}")
async def get_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(TpvSession)
        .options(joinedload(TpvSession.payments))
        .where(TpvSession.id == uuid.UUID(session_id), TpvSession.company_id == current_user.company_id)
    )
    session = result.unique().scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return TpvSessionResponse.model_validate(session)
