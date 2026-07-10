"""
FastAPI API routes for the Pharma CRM HCP Interaction Module.
Handles chat, interaction, and HCP endpoints.
"""
import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..database.config import get_db
from ..schemas.chat import ChatRequestSchema, ChatResponseSchema, AIExtractedData
from ..schemas.interaction import (
    InteractionCreateSchema,
    InteractionResponseSchema,
    InteractionSchema,
    InteractionHistorySchema,
)
from ..schemas.hcp import HCPSchema, HCPSearchSchema
from ..services.hcp_service import HCPService
from ..services.interaction_service import InteractionService
from ..ai_workflow.workflow import HCPExtractionWorkflow

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["CRM HCP API"])

# Initialize LangGraph workflow (singleton)
_workflow: Optional[HCPExtractionWorkflow] = None


def get_workflow() -> HCPExtractionWorkflow:
    """Get or create the LangGraph workflow singleton."""
    global _workflow
    if _workflow is None:
        _workflow = HCPExtractionWorkflow()
    return _workflow


# ============================================================
# Chat / AI Endpoints
# ============================================================

@router.post(
    "/chat",
    response_model=ChatResponseSchema,
    summary="Process natural language interaction via AI",
    description="Send a natural language message describing an HCP interaction. "
                "The AI extracts structured data using LangGraph + Groq LLM.",
)
async def process_chat_message(
    request: ChatRequestSchema,
    workflow: HCPExtractionWorkflow = Depends(get_workflow),
):
    """
    Accept a natural language message from the user.
    Runs the LangGraph workflow to extract structured HCP interaction data.
    Returns the extracted data for form population.
    """
    logger.info(f"Processing chat message (len={len(request.message)})")

    result = workflow.run_with_retry(
        user_message=request.message,
        conversation_id=request.conversation_id,
    )

    if not result["success"]:
        logger.warning(f"Chat processing failed: {result.get('error')}")
        return ChatResponseSchema(
            success=False,
            message=result.get("error", "Failed to process message"),
            extracted_data=None,
            raw_response=result.get("raw_response"),
            conversation_id=result.get("conversation_id"),
        )

    extracted = result["extracted_data"]
    if extracted:
        extracted_data = AIExtractedData(
            doctor_name=extracted.get("doctor_name"),
            hospital=extracted.get("hospital"),
            specialization=extracted.get("specialization"),
            meeting_date=extracted.get("meeting_date"),
            products_discussed=extracted.get("products_discussed", []),
            samples_given=extracted.get("samples_given", 0),
            sentiment=extracted.get("sentiment"),
            outcome=extracted.get("outcome"),
            follow_up_date=extracted.get("follow_up_date"),
            summary=extracted.get("summary"),
            confidence_score=extracted.get("confidence_score", 0.8),
        )
    else:
        extracted_data = None

    return ChatResponseSchema(
        success=True,
        message="Message processed successfully",
        extracted_data=extracted_data,
        raw_response=result.get("raw_response"),
        conversation_id=result.get("conversation_id"),
    )


# ============================================================
# Interaction Endpoints
# ============================================================

@router.post(
    "/interaction",
    response_model=InteractionResponseSchema,
    summary="Save a new interaction",
    description="Create a new HCP interaction record. "
                "Auto-creates or finds the HCP by name and hospital.",
    status_code=201,
)
async def create_interaction(
    interaction: InteractionCreateSchema,
    db: Session = Depends(get_db),
):
    """Save a new interaction to the database."""
    try:
        service = InteractionService(db)
        result = service.create_interaction(interaction)

        return InteractionResponseSchema(
            success=True,
            message="Interaction saved successfully",
            data=InteractionSchema.model_validate(result.to_dict()),
        )
    except Exception as e:
        logger.error(f"Failed to create interaction: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save interaction: {str(e)}",
        )


# Must be before /interaction/{interaction_id} to avoid route conflict
@router.get(
    "/interaction/history",
    response_model=dict,
    summary="Get interaction history",
    description="Get paginated interaction history with optional doctor name filter.",
)
async def get_interaction_history(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    doctor_name: Optional[str] = Query(None, description="Filter by doctor name"),
    db: Session = Depends(get_db),
):
    """Get paginated interaction history."""
    service = InteractionService(db)
    results, total = service.get_interaction_history(
        page=page,
        page_size=page_size,
        doctor_name=doctor_name,
    )

    interactions = [
        InteractionSchema.model_validate(r.to_dict()) for r in results
    ]

    return {
        "success": True,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": max(1, (total + page_size - 1) // page_size),
        "interactions": [i.model_dump() for i in interactions],
    }


@router.get(
    "/interaction/{interaction_id}",
    response_model=InteractionResponseSchema,
    summary="Get interaction by ID",
    description="Retrieve a specific interaction with full details including HCP info.",
)
async def get_interaction(
    interaction_id: int,
    db: Session = Depends(get_db),
):
    """Get a specific interaction by its ID."""
    service = InteractionService(db)
    interaction = service.get_interaction_by_id(interaction_id)

    if not interaction:
        raise HTTPException(
            status_code=404,
            detail=f"Interaction with ID {interaction_id} not found",
        )

    return InteractionResponseSchema(
        success=True,
        message="Interaction retrieved successfully",
        data=InteractionSchema.model_validate(interaction.to_dict()),
    )


# ============================================================
# HCP Endpoints
# ============================================================

@router.get(
    "/hcp",
    response_model=dict,
    summary="List all HCPs",
    description="Get all Healthcare Professionals with optional search.",
)
async def list_hcps(
    query: Optional[str] = Query(None, description="Search query"),
    specialization: Optional[str] = Query(None, description="Filter by specialization"),
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """List HCPs with optional search and pagination."""
    service = HCPService(db)
    results, total = service.search_hcps(
        query=query,
        specialization=specialization,
        limit=limit,
        offset=offset,
    )

    hcps = [HCPSchema.model_validate(h.to_dict()) for h in results]

    return {
        "success": True,
        "total": total,
        "limit": limit,
        "offset": offset,
        "hcps": [h.model_dump() for h in hcps],
    }


# Must be before /hcp/{hcp_id} to avoid route conflict
@router.get(
    "/hcp/recent",
    response_model=dict,
    summary="Get recent HCPs",
    description="Get the most recently added Healthcare Professionals.",
)
async def get_recent_hcps(
    limit: int = Query(5, ge=1, le=20),
    db: Session = Depends(get_db),
):
    """Get recently added HCPs."""
    service = HCPService(db)
    hcps = service.get_recent_hcps(limit=limit)

    return {
        "success": True,
        "hcps": [
            HCPSchema.model_validate(h.to_dict()).model_dump() for h in hcps
        ],
    }


@router.get(
    "/hcp/{hcp_id}",
    response_model=dict,
    summary="Get HCP by ID",
    description="Get a specific Healthcare Professional with interaction count.",
)
async def get_hcp(
    hcp_id: int,
    db: Session = Depends(get_db),
):
    """Get a specific HCP by ID."""
    service = HCPService(db)
    hcp = service.get_hcp_by_id(hcp_id)

    if not hcp:
        raise HTTPException(
            status_code=404,
            detail=f"HCP with ID {hcp_id} not found",
        )

    return {
        "success": True,
        "hcp": HCPSchema.model_validate(hcp.to_dict()).model_dump(),
    }


@router.get(
    "/hcp/{hcp_id}/interactions",
    response_model=dict,
    summary="Get HCP interactions",
    description="Get all interactions for a specific HCP with timeline.",
)
async def get_hcp_interactions(
    hcp_id: int,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """Get all interactions for a specific HCP."""
    service = InteractionService(db)
    results, total = service.get_interactions_by_hcp_id(
        hcp_id=hcp_id,
        limit=limit,
        offset=offset,
    )

    interactions = [
        InteractionSchema.model_validate(r.to_dict()) for r in results
    ]

    return {
        "success": True,
        "total": total,
        "interactions": [i.model_dump() for i in interactions],
    }


# ============================================================
# Health Check
# ============================================================

@router.get(
    "/health",
    summary="Health check endpoint",
    description="Check if the API is running and healthy.",
)
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "Pharma CRM HCP Interaction Module",
        "version": "1.0.0",
    }