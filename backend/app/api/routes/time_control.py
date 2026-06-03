import uuid
from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.user import User
from app.models.time_control import TimeRecord, Absence
from app.schemas.time_control import TimeRecordCreate, TimeRecordResponse, AbsenceCreate, AbsenceResponse
from app.api.deps import get_current_user

router = APIRouter()


@router.post("/clock-in")
async def clock_in(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    today = date.today()
    existing = await db.execute(
        select(TimeRecord).where(
            TimeRecord.company_id == current_user.company_id,
            TimeRecord.user_id == current_user.id,
            TimeRecord.record_date == today,
        )
    )
    record = existing.scalar_one_or_none()
    if record:
        if record.clock_in and not record.clock_out:
            raise HTTPException(status_code=400, detail="Already clocked in")
        if record.clock_out:
            raise HTTPException(status_code=400, detail="Already completed today")

    if not record:
        record = TimeRecord(
            company_id=current_user.company_id,
            user_id=current_user.id,
            record_date=today,
            clock_in=datetime.utcnow(),
        )
        db.add(record)
    else:
        record.clock_in = datetime.utcnow()

    await db.commit()
    await db.refresh(record)
    return TimeRecordResponse.model_validate(record)


@router.post("/clock-out")
async def clock_out(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    today = date.today()
    result = await db.execute(
        select(TimeRecord).where(
            TimeRecord.company_id == current_user.company_id,
            TimeRecord.user_id == current_user.id,
            TimeRecord.record_date == today,
        )
    )
    record = result.scalar_one_or_none()
    if not record or not record.clock_in:
        raise HTTPException(status_code=400, detail="Not clocked in today")
    if record.clock_out:
        raise HTTPException(status_code=400, detail="Already clocked out today")

    record.clock_out = datetime.utcnow()
    await db.commit()
    return TimeRecordResponse.model_validate(record)


@router.post("/break-start")
async def break_start(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    today = date.today()
    result = await db.execute(
        select(TimeRecord).where(
            TimeRecord.company_id == current_user.company_id,
            TimeRecord.user_id == current_user.id,
            TimeRecord.record_date == today,
        )
    )
    record = result.scalar_one_or_none()
    if not record or not record.clock_in:
        raise HTTPException(status_code=400, detail="Not clocked in")
    if record.break_start and not record.break_end:
        raise HTTPException(status_code=400, detail="Already on break")

    record.break_start = datetime.utcnow()
    await db.commit()
    return TimeRecordResponse.model_validate(record)


@router.post("/break-end")
async def break_end(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    today = date.today()
    result = await db.execute(
        select(TimeRecord).where(
            TimeRecord.company_id == current_user.company_id,
            TimeRecord.user_id == current_user.id,
            TimeRecord.record_date == today,
        )
    )
    record = result.scalar_one_or_none()
    if not record or not record.break_start:
        raise HTTPException(status_code=400, detail="Not on break")

    record.break_end = datetime.utcnow()
    await db.commit()
    return TimeRecordResponse.model_validate(record)


@router.get("/records")
async def list_records(
    user_id: str = Query(""),
    start_date: str = Query(""),
    end_date: str = Query(""),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(TimeRecord).where(TimeRecord.company_id == current_user.company_id)
    if user_id:
        query = query.where(TimeRecord.user_id == uuid.UUID(user_id))
    if start_date:
        query = query.where(TimeRecord.record_date >= date.fromisoformat(start_date))
    if end_date:
        query = query.where(TimeRecord.record_date <= date.fromisoformat(end_date))
    query = query.order_by(TimeRecord.record_date.desc()).limit(100)

    result = await db.execute(query)
    records = result.scalars().all()
    return [TimeRecordResponse.model_validate(r) for r in records]


@router.get("/absences")
async def list_absences(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Absence)
        .where(Absence.company_id == current_user.company_id)
        .order_by(Absence.start_date.desc())
        .limit(100)
    )
    absences = result.scalars().all()
    return [AbsenceResponse.model_validate(a) for a in absences]


@router.post("/absences")
async def create_absence(
    data: AbsenceCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    absence = Absence(
        **data.model_dump(),
        company_id=current_user.company_id,
        user_id=current_user.id,
    )
    db.add(absence)
    await db.commit()
    await db.refresh(absence)
    return AbsenceResponse.model_validate(absence)


@router.put("/absences/{absence_id}/approve")
async def approve_absence(
    absence_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Absence).where(
            Absence.id == uuid.UUID(absence_id),
            Absence.company_id == current_user.company_id,
        )
    )
    absence = result.scalar_one_or_none()
    if not absence:
        raise HTTPException(status_code=404, detail="Absence not found")

    absence.status = "approved"
    absence.approved_by = current_user.id
    await db.commit()
    return AbsenceResponse.model_validate(absence)
