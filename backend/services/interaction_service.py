"""
Interaction Service implementing Repository Pattern.
Handles all business logic for Interaction operations.
"""
from datetime import datetime
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc
from ..models.hcp import HCP
from ..models.interaction import Interaction
from ..schemas.interaction import InteractionCreateSchema
from ..schemas.hcp import HCPCreateSchema
from .hcp_service import HCPService


class InteractionService:
    """Repository/service for Interaction database operations."""

    def __init__(self, db: Session):
        self.db = db
        self.hcp_service = HCPService(db)

    def create_interaction(
        self, interaction_data: InteractionCreateSchema
    ) -> Interaction:
        """Create a new interaction, auto-creating or finding the HCP."""
        # Find or create HCP
        hcp_create = HCPCreateSchema(
            doctor_name=interaction_data.doctor_name,
            hospital=interaction_data.hospital,
            specialization=interaction_data.specialization,
        )
        hcp = self.hcp_service.create_hcp(hcp_create)

        # Create interaction
        interaction = Interaction(
            hcp_id=hcp.id,
            meeting_date=interaction_data.meeting_date or datetime.utcnow(),
            interaction_type=interaction_data.interaction_type or "in_person",
            products_discussed=interaction_data.products_discussed or [],
            samples_given=interaction_data.samples_given or 0,
            outcome=interaction_data.outcome,
            follow_up_date=interaction_data.follow_up_date,
            notes=interaction_data.notes,
            ai_summary=interaction_data.ai_summary,
        )

        self.db.add(interaction)
        self.db.commit()
        self.db.refresh(interaction)

        # Eagerly load the HCP relationship
        self.db.refresh(interaction, attribute_names=["hcp"])
        return interaction

    def get_interaction_by_id(self, interaction_id: int) -> Optional[Interaction]:
        """Get interaction by primary key with HCP data."""
        return (
            self.db.query(Interaction)
            .options(joinedload(Interaction.hcp))
            .filter(Interaction.id == interaction_id)
            .first()
        )

    def get_interactions_by_hcp_id(
        self, hcp_id: int, limit: int = 20, offset: int = 0
    ) -> Tuple[List[Interaction], int]:
        """Get all interactions for a specific HCP."""
        db_query = (
            self.db.query(Interaction)
            .options(joinedload(Interaction.hcp))
            .filter(Interaction.hcp_id == hcp_id)
        )

        total = db_query.count()
        results = (
            db_query.order_by(desc(Interaction.meeting_date))
            .offset(offset)
            .limit(limit)
            .all()
        )

        return results, total

    def get_interaction_history(
        self,
        page: int = 1,
        page_size: int = 20,
        doctor_name: Optional[str] = None,
    ) -> Tuple[List[Interaction], int]:
        """Get paginated interaction history with optional doctor filter."""
        db_query = (
            self.db.query(Interaction)
            .options(joinedload(Interaction.hcp))
        )

        if doctor_name:
            db_query = db_query.join(HCP).filter(
                HCP.doctor_name.ilike(f"%{doctor_name.strip()}%")
            )

        total = db_query.count()
        offset = (page - 1) * page_size

        results = (
            db_query.order_by(desc(Interaction.created_at))
            .offset(offset)
            .limit(page_size)
            .all()
        )

        return results, total

    def get_recent_interactions(self, limit: int = 10) -> List[Interaction]:
        """Get most recent interactions."""
        return (
            self.db.query(Interaction)
            .options(joinedload(Interaction.hcp))
            .order_by(desc(Interaction.created_at))
            .limit(limit)
            .all()
        )

    def update_interaction(
        self,
        interaction_id: int,
        **kwargs,
    ) -> Optional[Interaction]:
        """Update an interaction with provided fields."""
        interaction = self.get_interaction_by_id(interaction_id)
        if not interaction:
            return None

        for key, value in kwargs.items():
            if hasattr(interaction, key) and value is not None:
                setattr(interaction, key, value)

        self.db.commit()
        self.db.refresh(interaction)
        self.db.refresh(interaction, attribute_names=["hcp"])
        return interaction

    def delete_interaction(self, interaction_id: int) -> bool:
        """Delete an interaction by ID."""
        interaction = self.get_interaction_by_id(interaction_id)
        if not interaction:
            return False

        self.db.delete(interaction)
        self.db.commit()
        return True

    def get_interaction_timeline(
        self, hcp_id: int
    ) -> List[Interaction]:
        """Get chronological timeline of interactions for an HCP."""
        return (
            self.db.query(Interaction)
            .options(joinedload(Interaction.hcp))
            .filter(Interaction.hcp_id == hcp_id)
            .order_by(Interaction.meeting_date.asc())
            .all()
        )