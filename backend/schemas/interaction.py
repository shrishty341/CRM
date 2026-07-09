"""
Pydantic schemas for Interaction data validation and serialization.
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict


class InteractionSchema(BaseModel):
    """Base Interaction schema with all fields."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    hcp_id: int
    doctor_name: Optional[str] = None
    hospital: Optional[str] = None
    specialization: Optional[str] = None
    meeting_date: Optional[datetime] = None
    interaction_type: str = "in_person"
    products_discussed: Optional[List[str]] = None
    samples_given: Optional[int] = 0
    outcome: Optional[str] = None
    follow_up_date: Optional[datetime] = None
    notes: Optional[str] = None
    ai_summary: Optional[str] = None
    created_at: Optional[datetime] = None


class InteractionCreateSchema(BaseModel):
    """Schema for creating a new interaction."""
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
    meeting_date: Optional[datetime] = Field(
        None,
        description="Date of the meeting/interaction"
    )
    interaction_type: str = Field(
        default="in_person",
        pattern="^(in_person|virtual|phone|email)$",
        description="Type of interaction"
    )
    products_discussed: Optional[List[str]] = Field(
        None,
        description="List of pharmaceutical products discussed"
    )
    samples_given: Optional[int] = Field(
        None,
        ge=0,
        description="Number of samples provided"
    )
    outcome: Optional[str] = Field(
        None,
        description="Meeting outcome/sentiment"
    )
    follow_up_date: Optional[datetime] = Field(
        None,
        description="Scheduled follow-up date"
    )
    notes: Optional[str] = Field(
        None,
        max_length=2000,
        description="Additional notes about the interaction"
    )
    ai_summary: Optional[str] = Field(
        None,
        description="AI-generated summary of the interaction"
    )


class InteractionResponseSchema(BaseModel):
    """Schema for interaction API responses."""
    model_config = ConfigDict(from_attributes=True)

    success: bool = True
    message: str = "Interaction saved successfully"
    data: Optional[InteractionSchema] = None


class InteractionHistorySchema(BaseModel):
    """Schema for interaction history listing."""
    model_config = ConfigDict(from_attributes=True)

    total: int
    page: int
    page_size: int
    interactions: List[InteractionSchema]