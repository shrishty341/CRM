"""
HCP Service implementing Repository Pattern.
Handles all business logic for Healthcare Professional operations.
"""
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_
from ..models.hcp import HCP
from ..schemas.hcp import HCPCreateSchema


class HCPService:
    """Repository/service for HCP database operations."""

    def __init__(self, db: Session):
        self.db = db

    def create_hcp(self, hcp_data: HCPCreateSchema) -> HCP:
        """Create a new HCP record."""
        existing = self.get_hcp_by_name_and_hospital(
            hcp_data.doctor_name, hcp_data.hospital
        )
        if existing:
            return existing

        hcp = HCP(
            doctor_name=hcp_data.doctor_name.strip(),
            hospital=hcp_data.hospital.strip(),
            specialization=hcp_data.specialization.strip() if hcp_data.specialization else None
        )
        self.db.add(hcp)
        self.db.commit()
        self.db.refresh(hcp)
        return hcp

    def get_hcp_by_id(self, hcp_id: int) -> Optional[HCP]:
        """Get HCP by primary key."""
        return self.db.query(HCP).filter(HCP.id == hcp_id).first()

    def get_hcp_by_name_and_hospital(
        self, doctor_name: str, hospital: str
    ) -> Optional[HCP]:
        """Find existing HCP by name and hospital combination."""
        return (
            self.db.query(HCP)
            .filter(
                HCP.doctor_name.ilike(doctor_name.strip()),
                HCP.hospital.ilike(hospital.strip()),
            )
            .first()
        )

    def search_hcps(
        self,
        query: Optional[str] = None,
        specialization: Optional[str] = None,
        limit: int = 10,
        offset: int = 0,
    ) -> Tuple[List[HCP], int]:
        """Search HCPs with optional filters. Returns (results, total_count)."""
        db_query = self.db.query(HCP)

        if query:
            search_term = f"%{query.strip()}%"
            db_query = db_query.filter(
                or_(
                    HCP.doctor_name.ilike(search_term),
                    HCP.hospital.ilike(search_term),
                    HCP.specialization.ilike(search_term),
                )
            )

        if specialization:
            db_query = db_query.filter(
                HCP.specialization.ilike(f"%{specialization.strip()}%")
            )

        total = db_query.count()
        results = (
            db_query.order_by(HCP.doctor_name.asc())
            .offset(offset)
            .limit(limit)
            .all()
        )

        return results, total

    def get_recent_hcps(self, limit: int = 5) -> List[HCP]:
        """Get most recently added HCPs."""
        return (
            self.db.query(HCP)
            .order_by(HCP.created_at.desc())
            .limit(limit)
            .all()
        )

    def get_all_hcps(self) -> List[HCP]:
        """Get all HCPs ordered by name."""
        return self.db.query(HCP).order_by(HCP.doctor_name.asc()).all()

    def update_hcp(
        self,
        hcp_id: int,
        doctor_name: Optional[str] = None,
        hospital: Optional[str] = None,
        specialization: Optional[str] = None,
    ) -> Optional[HCP]:
        """Update an existing HCP record."""
        hcp = self.get_hcp_by_id(hcp_id)
        if not hcp:
            return None

        if doctor_name is not None:
            hcp.doctor_name = doctor_name.strip()
        if hospital is not None:
            hcp.hospital = hospital.strip()
        if specialization is not None:
            hcp.specialization = specialization.strip() if specialization else None

        self.db.commit()
        self.db.refresh(hcp)
        return hcp

    def delete_hcp(self, hcp_id: int) -> bool:
        """Delete an HCP record by ID. Returns True if deleted."""
        hcp = self.get_hcp_by_id(hcp_id)
        if not hcp:
            return False

        self.db.delete(hcp)
        self.db.commit()
        return True