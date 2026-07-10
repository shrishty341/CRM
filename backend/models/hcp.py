"""
HCP (Healthcare Professional) model.
Represents a doctor or healthcare provider in the CRM system.
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from ..database.config import Base


class HCP(Base):
    """Healthcare Professional model - represents a doctor."""
    __tablename__ = "hcp"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    doctor_name = Column(String(255), nullable=False, index=True)
    hospital = Column(String(255), nullable=False)
    specialization = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationship to interactions
    interactions = relationship(
        "Interaction",
        back_populates="hcp",
        cascade="all, delete-orphan",
        lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<HCP(id={self.id}, name='{self.doctor_name}', hospital='{self.hospital}')>"

    def to_dict(self) -> dict:
        """Convert model to dictionary for serialization."""
        return {
            "id": self.id,
            "doctor_name": self.doctor_name,
            "hospital": self.hospital,
            "specialization": self.specialization,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "interaction_count": len(self.interactions) if self.interactions else 0
        }