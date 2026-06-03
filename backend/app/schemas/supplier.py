import uuid
from datetime import datetime
from pydantic import BaseModel


class SupplierBase(BaseModel):
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
    contact_person: str | None = None
    notes: str | None = None


class SupplierCreate(SupplierBase):
    pass


class SupplierUpdate(BaseModel):
    name: str | None = None
    nif: str | None = None
    address: str | None = None
    city: str | None = None
    phone: str | None = None
    email: str | None = None
    contact_person: str | None = None


class SupplierResponse(SupplierBase):
    id: uuid.UUID
    company_id: uuid.UUID
    active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
