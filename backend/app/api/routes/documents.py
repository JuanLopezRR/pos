import uuid
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload
from app.database import get_db
from app.models.user import User
from app.models.document import Document, DocumentLine, Tax
from app.models.article import Article
from app.schemas.document import DocumentCreate, DocumentResponse, DocumentListResponse, TaxCreate, TaxResponse
from app.api.deps import get_current_user

router = APIRouter()


@router.get("/taxes")
async def list_taxes(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Tax).where(Tax.company_id == current_user.company_id, Tax.active == True)
    )
    taxes = result.scalars().all()
    return [TaxResponse.model_validate(t) for t in taxes]


@router.post("/taxes")
async def create_tax(
    data: TaxCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    tax = Tax(**data.model_dump(), company_id=current_user.company_id)
    db.add(tax)
    await db.commit()
    await db.refresh(tax)
    return TaxResponse.model_validate(tax)


@router.get("")
async def list_documents(
    doc_type: str = Query(""),
    search: str = Query(""),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Document).where(Document.company_id == current_user.company_id)
    if doc_type:
        query = query.where(Document.doc_type == doc_type)
    if search:
        query = query.where(
            or_(
                Document.number.ilike(f"%{search}%"),
                Document.notes.ilike(f"%{search}%"),
            )
        )

    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar()

    query = query.options(joinedload(Document.customer))
    query = query.order_by(Document.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    documents = result.unique().scalars().all()

    items = []
    for doc in documents:
        items.append({
            "id": doc.id,
            "doc_type": doc.doc_type,
            "number": doc.number,
            "issue_date": doc.issue_date,
            "customer_name": doc.customer.name if doc.customer else None,
            "total": float(doc.total),
            "status": doc.status,
            "created_at": doc.created_at,
        })

    return {"items": items, "total": total or 0, "page": page, "page_size": page_size}


@router.get("/{doc_id}")
async def get_document(
    doc_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Document)
        .options(joinedload(Document.lines), joinedload(Document.customer))
        .where(Document.id == uuid.UUID(doc_id), Document.company_id == current_user.company_id)
    )
    doc = result.unique().scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return DocumentResponse.model_validate(doc)


def generate_doc_number(doc_type: str) -> str:
    prefixes = {"invoice": "FAC", "quote": "PRE", "order": "PED", "ticket": "TIK"}
    prefix = prefixes.get(doc_type, "DOC")
    return f"{prefix}-{date.today().strftime('%Y%m')}-{uuid.uuid4().hex[:6].upper()}"


@router.post("")
async def create_document(
    data: DocumentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    doc = Document(
        company_id=current_user.company_id,
        doc_type=data.doc_type,
        number=generate_doc_number(data.doc_type),
        series=data.series,
        issue_date=data.issue_date or date.today(),
        due_date=data.due_date,
        customer_id=uuid.UUID(data.customer_id) if data.customer_id else None,
        supplier_id=uuid.UUID(data.supplier_id) if data.supplier_id else None,
        notes=data.notes,
        payment_method=data.payment_method,
        status="draft",
        created_by=current_user.id,
    )
    db.add(doc)
    await db.flush()

    subtotal_total = 0
    tax_total = 0

    for i, line_data in enumerate(data.lines):
        subtotal = line_data.quantity * line_data.unit_price
        discount_amount = subtotal * (line_data.discount / 100) if line_data.discount else 0
        line_subtotal = subtotal - discount_amount
        line_tax = line_subtotal * (line_data.tax_percentage / 100)

        line = DocumentLine(
            document_id=doc.id,
            article_id=uuid.UUID(line_data.article_id) if line_data.article_id else None,
            line_order=i,
            description=line_data.description,
            quantity=line_data.quantity,
            unit_price=line_data.unit_price,
            discount=line_data.discount,
            tax_percentage=line_data.tax_percentage,
            subtotal=line_subtotal,
        )
        db.add(line)
        subtotal_total += line_subtotal
        tax_total += line_tax

        if line_data.article_id and data.doc_type in ("ticket", "invoice"):
            article = await db.get(Article, uuid.UUID(line_data.article_id))
            if article:
                article.stock = float(article.stock) - line_data.quantity

    doc.subtotal = subtotal_total
    doc.tax_amount = tax_total
    doc.total = subtotal_total + tax_total

    if data.doc_type == "ticket":
        doc.status = "completed"

    await db.commit()
    return await get_document(str(doc.id), current_user, db)


@router.post("/{doc_id}/status")
async def update_document_status(
    doc_id: str,
    status: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Document).where(Document.id == uuid.UUID(doc_id), Document.company_id == current_user.company_id)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    doc.status = status
    await db.commit()
    return {"status": status}


@router.delete("/{doc_id}")
async def delete_document(
    doc_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Document).where(Document.id == uuid.UUID(doc_id), Document.company_id == current_user.company_id)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    doc.status = "cancelled"
    await db.commit()
    return {"message": "Document cancelled"}
