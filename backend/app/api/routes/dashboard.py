from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.user import User
from app.models.article import Article
from app.models.customer import Customer
from app.models.document import Document
from app.api.deps import get_current_user

router = APIRouter()


@router.get("/summary")
async def get_dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    company_id = current_user.company_id

    articles_count = (await db.execute(
        select(func.count(Article.id)).where(Article.company_id == company_id, Article.active == True)
    )).scalar()

    low_stock = (await db.execute(
        select(func.count(Article.id)).where(
            Article.company_id == company_id,
            Article.active == True,
            Article.stock <= Article.min_stock,
        )
    )).scalar()

    customers_count = (await db.execute(
        select(func.count(Customer.id)).where(Customer.company_id == company_id, Customer.active == True)
    )).scalar()

    today_sales = (await db.execute(
        select(func.coalesce(func.sum(Document.total), 0)).where(
            Document.company_id == company_id,
            Document.doc_type == "ticket",
            func.date(Document.created_at) == func.current_date(),
        )
    )).scalar()

    pending_docs = (await db.execute(
        select(func.count(Document.id)).where(
            Document.company_id == company_id,
            Document.status == "draft",
        )
    )).scalar()

    monthly_sales = (await db.execute(
        select(func.coalesce(func.sum(Document.total), 0)).where(
            Document.company_id == company_id,
            Document.doc_type.in_(["invoice", "ticket"]),
            func.date_trunc("month", Document.created_at) == func.date_trunc("month", func.current_date()),
        )
    )).scalar()

    return {
        "articles_count": articles_count or 0,
        "low_stock": low_stock or 0,
        "customers_count": customers_count or 0,
        "today_sales": float(today_sales or 0),
        "pending_documents": pending_docs or 0,
        "monthly_sales": float(monthly_sales or 0),
    }
