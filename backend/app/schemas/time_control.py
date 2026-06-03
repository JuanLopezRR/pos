import uuid
from datetime import datetime, date
from pydantic import BaseModel


class TimeRecordBase(BaseModel):
    notes: str | None = None


class TimeRecordCreate(TimeRecordBase):
    pass


class TimeRecordResponse(TimeRecordBase):
    id: uuid.UUID
    company_id: uuid.UUID
    user_id: uuid.UUID
    record_date: date
    clock_in: datetime | None
    clock_out: datetime | None
    break_start: datetime | None
    break_end: datetime | None
    created_at: datetime

    class Config:
        from_attributes = True


class AbsenceBase(BaseModel):
    start_date: date
    end_date: date
    absence_type: str
    reason: str | None = None


class AbsenceCreate(AbsenceBase):
    pass


class AbsenceResponse(AbsenceBase):
    id: uuid.UUID
    company_id: uuid.UUID
    user_id: uuid.UUID
    status: str
    approved_by: uuid.UUID | None
    created_at: datetime

    class Config:
        from_attributes = True
