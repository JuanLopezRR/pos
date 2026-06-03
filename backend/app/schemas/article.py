import uuid
from datetime import datetime
from pydantic import BaseModel


class ArticleFamilyBase(BaseModel):
    name: str
    description: str | None = None
    parent_id: str | None = None


class ArticleFamilyCreate(ArticleFamilyBase):
    pass


class ArticleFamilyResponse(ArticleFamilyBase):
    id: uuid.UUID
    company_id: uuid.UUID
    active: bool
    created_at: datetime
    children: list["ArticleFamilyResponse"] = []

    class Config:
        from_attributes = True


class ArticleAttributeBase(BaseModel):
    attr_type: str
    value: str
    additional_price: float = 0
    stock: float = 0


class ArticleAttributeResponse(ArticleAttributeBase):
    id: uuid.UUID
    article_id: uuid.UUID
    created_at: datetime

    class Config:
        from_attributes = True


class ArticleBase(BaseModel):
    code: str
    barcode: str | None = None
    name: str
    description: str | None = None
    family_id: str | uuid.UUID | None = None
    tax_id: str | uuid.UUID | None = None
    image_url: str | None = None
    cost_price: float = 0
    sale_price: float = 0
    stock: float = 0
    min_stock: float = 0
    max_stock: float = 0
    stock_type: str = "units"
    has_sizes: bool = False
    has_colors: bool = False


class ArticleCreate(ArticleBase):
    attributes: list[ArticleAttributeBase] = []


class ArticleUpdate(BaseModel):
    code: str | None = None
    name: str | None = None
    description: str | None = None
    family_id: str | uuid.UUID | None = None
    tax_id: str | uuid.UUID | None = None
    cost_price: float | None = None
    sale_price: float | None = None
    barcode: str | None = None
    min_stock: float | None = None
    max_stock: float | None = None


class ArticleResponse(ArticleBase):
    id: uuid.UUID
    company_id: uuid.UUID
    active: bool
    image_url: str | None = None
    created_at: datetime
    updated_at: datetime
    family: ArticleFamilyResponse | None = None
    attributes: list[ArticleAttributeResponse] = []

    class Config:
        from_attributes = True


class ArticleListResponse(BaseModel):
    id: uuid.UUID
    code: str
    name: str
    barcode: str | None = None
    family_name: str | None = None
    stock: float
    sale_price: float
    active: bool

    class Config:
        from_attributes = True
