from fastapi import APIRouter
from app.api.v1 import dishes, recipes, shopping, auth, ratings, scraper, users

api_router = APIRouter()
api_router.include_router(dishes.router, prefix="/dishes", tags=["dishes"])
api_router.include_router(recipes.router, prefix="/recipes", tags=["recipes"])
api_router.include_router(shopping.router, prefix="/shopping", tags=["shopping"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(ratings.router, prefix="/ratings", tags=["ratings"])
api_router.include_router(scraper.router, prefix="/scraper", tags=["scraper"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
