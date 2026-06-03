import uuid
from datetime import datetime
from pydantic import BaseModel


class TpvSessionBase(BaseModel):
    opening_amount: float = 0
    notes: str | None = None


class TpvSessionCreate(TpvSessionBase):
    pass


class TpvSessionResponse(TpvSessionBase):
    id: uuid.UUID
    company_id: uuid.UUID
    user_id: uuid.UUID
    opened_at: datetime
    closed_at: datetime | None
    closing_amount: float | None
    cash_sales: float
    card_sales: float
    transfer_sales: float
    total_sales: float
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class TpvPaymentBase(BaseModel):
    amount: float
    method: str
    reference: str | None = None


class TpvPaymentResponse(TpvPaymentBase):
    id: uuid.UUID
    session_id: uuid.UUID
    document_id: uuid.UUID | None
    created_at: datetime

    class Config:
        from_attributes = True


class TpvCloseSession(BaseModel):
    closing_amount: float
    notes: str | None = None
