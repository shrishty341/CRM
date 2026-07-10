"""
Pydantic schemas for Chat/AI interaction data validation and serialization.
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

# Re-export for backward compatibility
__all__ = ['ChatRequestSchema', 'AIExtractedData', 'ChatResponseSchema']


class ChatRequestSchema(BaseModel):
    """Schema for incoming chat messages."""
    message: str = Field(
        ...,
        min_length=1,
        max_length=2000,
        description="User's natural language message describing the interaction"
    )
    conversation_id: Optional[str] = Field(
        None,
        description="Optional conversation ID for maintaining context"
    )


class AIExtractedData(BaseModel):
    """Schema for AI-extracted structured data from natural language."""
    doctor_name: Optional[str] = Field(None, description="Extracted doctor name")
    hospital: Optional[str] = Field(None, description="Extracted hospital name")
    specialization: Optional[str] = Field(None, description="Extracted specialization")
    meeting_date: Optional[str] = Field(None, description="Extracted meeting date")
    products_discussed: Optional[List[str]] = Field(
        None,
        description="Extracted list of products discussed"
    )
    samples_given: Optional[int] = Field(None, ge=0, description="Number of samples given")
    sentiment: Optional[str] = Field(None, description="Detected sentiment")
    outcome: Optional[str] = Field(None, description="Meeting outcome")
    follow_up_date: Optional[str] = Field(None, description="Extracted follow-up date")
    summary: Optional[str] = Field(None, description="AI-generated meeting summary")
    confidence_score: Optional[float] = Field(
        None,
        ge=0.0,
        le=1.0,
        description="AI confidence score for the extraction"
    )


class ChatResponseSchema(BaseModel):
    """Schema for chat API responses."""
    success: bool = True
    message: str = "Message processed successfully"
    extracted_data: Optional[AIExtractedData] = None
    raw_response: Optional[str] = None
    conversation_id: Optional[str] = None