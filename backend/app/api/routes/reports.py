from datetime import date, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func, extract
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.user import User
from app.models.article import Article
from app.models.document import Document, DocumentLine
from app.models.customer import Customer
from app.api.deps import get_current_user

router = APIRouter()


@router.get("/sales")
async def sales_report(
    start_date: str = Query(""),
    end_date: str = Query(""),
    group_by: str = Query("day"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(
        func.date(Document.created_at).label("period"),
        func.count(Document.id).label("count"),
        func.sum(Document.total).label("total"),
    ).where(
        Document.company_id == current_user.company_id,
        Document.status == "completed",
    )

    if start_date:
        query = query.where(Document.created_at >= date.fromisoformat(start_date))
    if end_date:
        query = query.where(Document.created_at <= date.fromisoformat(end_date))

    if group_by == "month":
        query = select(
            func.date_trunc("month", Document.created_at).label("period"),
            func.count(Document.id).label("count"),
            func.sum(Document.total).label("total"),
        ).where(
            Document.company_id == current_user.company_id,
            Document.status == "completed",
        )
        if start_date:
            query = query.where(Document.created_at >= date.fromisoformat(start_date))
        if end_date:
            query = query.where(Document.created_at <= date.fromisoformat(end_date))
        query = query.group_by(func.date_trunc("month", Document.created_at))
    else:
        query = query.group_by(func.date(Document.created_at))

    query = query.order_by("period")
    result = await db.execute(query)
    rows = result.all()

    return [
        {"period": str(r.period), "count": r.count or 0, "total": float(r.total or 0)}
        for r in rows
    ]


@router.get("/top-articles")
async def top_articles(
    limit: int = Query(10),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(
            DocumentLine.article_id,
            Article.name,
            func.sum(DocumentLine.quantity).label("total_qty"),
            func.sum(DocumentLine.subtotal).label("total_amount"),
        )
        .join(Document, DocumentLine.document_id == Document.id)
        .join(Article, DocumentLine.article_id == Article.id)
        .where(Document.company_id == current_user.company_id, Document.status == "completed")
        .group_by(DocumentLine.article_id, Article.name)
        .order_by(func.sum(DocumentLine.quantity).desc())
        .limit(limit)
    )
    rows = result.all()
    return [
        {"article_id": str(r.article_id), "name": r.name, "quantity": float(r.total_qty or 0), "amount": float(r.total_amount or 0)}
        for r in rows
    ]


@router.get("/customers")
async def customer_report(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(
            Customer.id,
            Customer.name,
            func.count(Document.id).label("doc_count"),
            func.coalesce(func.sum(Document.total), 0).label("total_spent"),
        )
        .outerjoin(Document, Document.customer_id == Customer.id)
        .where(Customer.company_id == current_user.company_id)
        .group_by(Customer.id, Customer.name)
        .order_by(func.coalesce(func.sum(Document.total), 0).desc())
        .limit(20)
    )
    rows = result.all()
    return [
        {"customer_id": str(r.id), "name": r.name, "documents": r.doc_count or 0, "total": float(r.total_spent or 0)}
        for r in rows
    ]


@router.get("/stock")
async def stock_report(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Article).where(
            Article.company_id == current_user.company_id,
            Article.active == True,
            Article.stock <= Article.min_stock,
        ).order_by(Article.stock)
    )
    articles = result.scalars().all()
    return [
        {
            "id": str(a.id),
            "code": a.code,
            "name": a.name,
            "stock": float(a.stock),
            "min_stock": float(a.min_stock),
            "sale_price": float(a.sale_price),
        }
        for a in articles
    ]
