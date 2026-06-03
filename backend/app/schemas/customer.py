import uuid
from datetime import datetime
from pydantic import BaseModel


class CustomerBase(BaseModel):
    code: str | None = None
    name: str
    nif: str | None = None
    address: str | None = None
    city: str | None = None
    province: str | None = None
    postal_code: str | None = None
    country: str = "España"
    phone: str | None = None
    email: str | None = None
    web: str | None = None
    notes: str | None = None
    credit_limit: float = 0


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(BaseModel):
    name: str | None = None
    nif: str | None = None
    address: str | None = None
    city: str | None = None
    province: str | None = None
    postal_code: str | None = None
    phone: str | None = None
    email: str | None = None
    notes: str | None = None


class CustomerResponse(CustomerBase):
    id: uuid.UUID
    company_id: uuid.UUID
    active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
