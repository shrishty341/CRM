"""
Pydantic schemas for HCP (Healthcare Professional) data validation and serialization.
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class HCPSchema(BaseModel):
    """Base HCP schema with all fields."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    doctor_name: str
    hospital: str
    specialization: Optional[str] = None
    created_at: Optional[datetime] = None
    interaction_count: Optional[int] = 0


class HCPCreateSchema(BaseModel):
    """Schema for creating a new HCP."""
    doctor_name: str = Field(
        ...,
        min_length=2,
        max_length=255,
        description="Full name of the healthcare professional"
    )
    hospital: str = Field(
        ...,
        min_length=2,
        max_length=255,
        description="Hospital or clinic name"
    )
    specialization: Optional[str] = Field(
        None,
        max_length=255,
        description="Medical specialization"
    )


class HCPSearchSchema(BaseModel):
    """Schema for HCP search/filter parameters."""
    query: Optional[str] = Field(None, max_length=255)
    specialization: Optional[str] = Field(None, max_length=255)
    limit: int = Field(default=10, ge=1, le=100)
    offset: int = Field(default=0, ge=0)