import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models.user import User
from app.models.article import Article, ArticleFamily, ArticleAttribute
from app.schemas.article import (
    ArticleCreate, ArticleUpdate, ArticleResponse,
    ArticleFamilyCreate, ArticleFamilyResponse,
    ArticleAttributeResponse, ArticleListResponse,
)
from app.api.deps import get_current_user

router = APIRouter()


@router.get("/families")
async def list_families(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ArticleFamily)
        .options(selectinload(ArticleFamily.children))
        .where(ArticleFamily.company_id == current_user.company_id, ArticleFamily.active == True)
        .order_by(ArticleFamily.name)
    )
    families = result.scalars().all()
    return [ArticleFamilyResponse.model_validate(f) for f in families]


@router.post("/families")
async def create_family(
    data: ArticleFamilyCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    family = ArticleFamily(**data.model_dump(), company_id=current_user.company_id)
    db.add(family)
    await db.commit()
    await db.refresh(family)
    return ArticleFamilyResponse.model_validate(family)


@router.get("")
async def list_articles(
    search: str = Query(""),
    family_id: str = Query(""),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Article).where(Article.company_id == current_user.company_id)
    if search:
        query = query.where(
            or_(
                Article.name.ilike(f"%{search}%"),
                Article.code.ilike(f"%{search}%"),
                Article.barcode.ilike(f"%{search}%"),
            )
        )
    if family_id:
        query = query.where(Article.family_id == uuid.UUID(family_id))

    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar()

    query = query.options(
        selectinload(Article.family).selectinload(ArticleFamily.children),
        selectinload(Article.attributes),
    )
    query = query.order_by(Article.code).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    articles = result.unique().scalars().all()

    return {
        "items": [ArticleResponse.model_validate(a) for a in articles],
        "total": total or 0,
        "page": page,
        "page_size": page_size,
    }


@router.get("/{article_id}")
async def get_article(
    article_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Article)
        .options(
            selectinload(Article.family).selectinload(ArticleFamily.children),
            selectinload(Article.attributes),
        )
        .where(Article.id == uuid.UUID(article_id), Article.company_id == current_user.company_id)
    )
    article = result.unique().scalar_one_or_none()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    return ArticleResponse.model_validate(article)


@router.post("")
async def create_article(
    data: ArticleCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    attrs = data.attributes
    article = Article(
        **data.model_dump(exclude={"attributes"}),
        company_id=current_user.company_id,
    )
    db.add(article)
    await db.flush()

    for attr_data in attrs:
        attr = ArticleAttribute(article_id=article.id, **attr_data.model_dump())
        db.add(attr)

    await db.commit()
    await db.refresh(article)
    return await get_article(str(article.id), current_user, db)


@router.put("/{article_id}")
async def update_article(
    article_id: str,
    data: ArticleUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Article).where(Article.id == uuid.UUID(article_id), Article.company_id == current_user.company_id)
    )
    article = result.scalar_one_or_none()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(article, key, value)

    await db.commit()
    return await get_article(article_id, current_user, db)


@router.delete("/{article_id}")
async def delete_article(
    article_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Article).where(Article.id == uuid.UUID(article_id), Article.company_id == current_user.company_id)
    )
    article = result.scalar_one_or_none()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    article.active = False
    await db.commit()
    return {"message": "Article deactivated"}
