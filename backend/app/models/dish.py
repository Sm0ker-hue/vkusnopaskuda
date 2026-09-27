import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, DateTime, text, Numeric, Index
from sqlalchemy.dialects.postgresql import UUID, TSVECTOR
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class Dish(Base):
    __tablename__ = "dishes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    search_vector: Mapped[Optional[str]] = mapped_column(TSVECTOR)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("CURRENT_TIMESTAMP"), onupdate=text("CURRENT_TIMESTAMP"))

    recipe_variations = relationship("RecipeVariation", back_populates="dish")

    __table_args__ = (
        Index('idx_dishes_search', 'search_vector', postgresql_using='gin'),
        Index('idx_dishes_name', 'name'),
    )
