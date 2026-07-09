"""
Interaction model.
Represents a logged interaction between a pharmaceutical representative and an HCP.
"""
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Text, DateTime, ForeignKey, JSON
)
from sqlalchemy.orm import relationship
from database.config import Base


class Interaction(Base):
    """Interaction model - represents a meeting/log entry with an HCP."""
    __tablename__ = "interaction"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    hcp_id = Column(Integer, ForeignKey("hcp.id", ondelete="CASCADE"), nullable=False, index=True)
    meeting_date = Column(DateTime, nullable=False, default=datetime.utcnow)
    interaction_type = Column(String(50), nullable=False, default="in_person")
    products_discussed = Column(JSON, nullable=True, default=list)
    samples_given = Column(Integer, nullable=True, default=0)
    outcome = Column(String(50), nullable=True)
    follow_up_date = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    ai_summary = Column(Text, nullable=True)
    ai_raw_response = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationship to HCP
    hcp = relationship("HCP", back_populates="interactions")

    SENTIMENT_CHOICES = [
        "very_interested",
        "interested",
        "neutral",
        "not_interested",
        "declined"
    ]

    OUTCOME_CHOICES = [
        "positive",
        "neutral",
        "follow_up_required",
        "sample_requested",
        "prescription_commitment"
    ]

    def __repr__(self) -> str:
        return (
            f"<Interaction(id={self.id}, hcp_id={self.hcp_id}, "
            f"date='{self.meeting_date}', outcome='{self.outcome}')>"
        )

    def to_dict(self) -> dict:
        """Convert model to dictionary for serialization."""
        products = self.products_discussed
        if isinstance(products, str):
            import json
            products = json.loads(products)

        return {
            "id": self.id,
            "hcp_id": self.hcp_id,
            "doctor_name": self.hcp.doctor_name if self.hcp else None,
            "hospital": self.hcp.hospital if self.hcp else None,
            "specialization": self.hcp.specialization if self.hcp else None,
            "meeting_date": self.meeting_date.isoformat() if self.meeting_date else None,
            "interaction_type": self.interaction_type,
            "products_discussed": products if products else [],
            "samples_given": self.samples_given or 0,
            "outcome": self.outcome,
            "follow_up_date": self.follow_up_date.isoformat() if self.follow_up_date else None,
            "notes": self.notes,
            "ai_summary": self.ai_summary,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }