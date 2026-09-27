import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, DateTime, text, Numeric, ForeignKey, UniqueConstraint, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class Ingredient(Base):
    __tablename__ = "ingredients"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    kcal_per_100g: Mapped[Optional[float]] = mapped_column(Numeric(8, 2))
    protein_per_100g: Mapped[Optional[float]] = mapped_column(Numeric(8, 2))
    fat_per_100g: Mapped[Optional[float]] = mapped_column(Numeric(8, 2))
    carbs_per_100g: Mapped[Optional[float]] = mapped_column(Numeric(8, 2))
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), onupdate=text("CURRENT_TIMESTAMP"))

    recipe_ingredients = relationship("RecipeIngredient", back_populates="ingredient")
    user_inventory = relationship("UserInventory", back_populates="ingredient")
    product_mappings = relationship("ProductIngredient", back_populates="ingredient")
    shopping_list_items = relationship("ShoppingListItem", back_populates="ingredient")

class UserInventory(Base):
    __tablename__ = "user_inventory"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    ingredient_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("ingredients.id", ondelete="CASCADE"), nullable=False)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), onupdate=text("CURRENT_TIMESTAMP"))

    user = relationship("User", back_populates="inventory")
    ingredient = relationship("Ingredient", back_populates="user_inventory")

    __table_args__ = (
        UniqueConstraint('user_id', 'ingredient_id'),
    )
