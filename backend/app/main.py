import json
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import init_db
from app.api.routes import auth, articles, customers, suppliers, documents, tpv, reports, time_control, dashboard


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    lifespan=lifespan,
)

origins = json.loads(settings.CORS_ORIGINS) if isinstance(settings.CORS_ORIGINS, str) else settings.CORS_ORIGINS

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(articles.router, prefix="/api/articles", tags=["Articles"])
app.include_router(customers.router, prefix="/api/customers", tags=["Customers"])
app.include_router(suppliers.router, prefix="/api/suppliers", tags=["Suppliers"])
app.include_router(documents.router, prefix="/api/documents", tags=["Documents"])
app.include_router(tpv.router, prefix="/api/tpv", tags=["TPV"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])
app.include_router(time_control.router, prefix="/api/time", tags=["Time Control"])


@app.get("/api/health")
async def health():
    return {"status": "ok", "version": settings.VERSION}
