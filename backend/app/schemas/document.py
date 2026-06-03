import uuid
from datetime import datetime, date
from pydantic import BaseModel


class TaxBase(BaseModel):
    name: str
    percentage: float


class TaxCreate(TaxBase):
    pass


class TaxResponse(TaxBase):
    id: uuid.UUID
    company_id: uuid.UUID
    active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class DocumentLineBase(BaseModel):
    article_id: str | None = None
    line_order: int = 0
    description: str
    quantity: float = 1
    unit_price: float = 0
    discount: float = 0
    tax_percentage: float = 21
    subtotal: float = 0


class DocumentLineResponse(DocumentLineBase):
    id: uuid.UUID
    document_id: uuid.UUID

    class Config:
        from_attributes = True


class DocumentBase(BaseModel):
    doc_type: str
    series: str | None = None
    issue_date: date | None = None
    due_date: date | None = None
    customer_id: str | None = None
    supplier_id: str | None = None
    notes: str | None = None
    payment_method: str | None = None


class DocumentCreate(DocumentBase):
    lines: list[DocumentLineBase] = []


class DocumentResponse(DocumentBase):
    id: uuid.UUID
    company_id: uuid.UUID
    number: str
    subtotal: float
    discount: float
    tax_amount: float
    total: float
    status: str
    created_by: uuid.UUID | None
    created_at: datetime
    updated_at: datetime
    lines: list[DocumentLineResponse] = []

    class Config:
        from_attributes = True


class DocumentListResponse(BaseModel):
    id: uuid.UUID
    doc_type: str
    number: str
    issue_date: date
    customer_name: str | None = None
    total: float
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
