"""
LangGraph Workflow for HCP Interaction Data Extraction.
Implements a stateful graph-based AI workflow using LangGraph + Groq LLM.

Workflow:
START → Validate Input → Context Builder → Prompt Builder → Groq LLM → JSON Extractor → Validation → END
"""
import json
import logging
import re
from datetime import datetime, timedelta
from typing import Any, Dict, Optional, TypedDict, List
from dotenv import load_dotenv

load_dotenv()

# LangGraph imports
from langgraph.graph import StateGraph, END
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage

from backend.prompts.extraction_prompt import SYSTEM_PROMPT, USER_MESSAGE_TEMPLATE

logger = logging.getLogger(__name__)


class WorkflowState(TypedDict):
    """TypedDict defining the state schema for the LangGraph workflow."""
    user_message: str
    conversation_id: Optional[str]
    is_valid: bool
    validation_error: Optional[str]
    context: Dict[str, Any]
    prompt: str
    llm_response: Optional[str]
    extracted_data: Optional[Dict[str, Any]]
    extraction_error: Optional[str]
    is_retry: bool
    retry_count: int
    timestamp: str


class HCPExtractionWorkflow:
    """
    LangGraph-based workflow for extracting structured HCP interaction data
    from natural language messages using Groq LLM.
    """

    MAX_RETRIES = 2

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        """Initialize the workflow with LLM configuration."""
        import os

        self.api_key = api_key or os.getenv("GROQ_API_KEY", "")
        self.model = model or os.getenv("GROQ_MODEL", "gemma2-9b-it")

        if not self.api_key:
            logger.warning("GROQ_API_KEY not set. LLM calls will fail.")

        self.llm = ChatGroq(
            api_key=self.api_key,
            model=self.model,
            temperature=0.1,
            max_tokens=1024,
        )

        self.graph = self._build_graph()

    def _validate_input_node(self, state: WorkflowState) -> Dict[str, Any]:
        """Validate the user input message."""
        message = state.get("user_message", "").strip()

        if not message:
            return {
                "is_valid": False,
                "validation_error": "Message cannot be empty"
            }

        if len(message) < 2:
            return {
                "is_valid": False,
                "validation_error": "Message is too short. Please provide more details."
            }

        if len(message) > 2000:
            return {
                "is_valid": False,
                "validation_error": "Message exceeds maximum length of 2000 characters."
            }

        return {
            "is_valid": True,
            "validation_error": None
        }

    def _context_builder_node(self, state: WorkflowState) -> Dict[str, Any]:
        """Build context for the LLM based on message content."""
        message = state["user_message"]
        context = {
            "message_length": len(message),
            "contains_doctor_title": bool(
                re.search(r'(dr\.|doctor|physician|specialist)', message, re.IGNORECASE)
            ),
            "contains_hospital": bool(
                re.search(r'(hospital|clinic|medical center|healthcare)', message, re.IGNORECASE)
            ),
            "contains_date": bool(
                re.search(
                    r'(\d{4}-\d{2}-\d{2}|today|yesterday|tomorrow|'
                    r'monday|tuesday|wednesday|thursday|friday|'
                    r'saturday|sunday|next|last)',
                    message,
                    re.IGNORECASE
                )
            ),
            "contains_products": bool(
                re.search(r'(discussed|talked about|presented|showcased)', message, re.IGNORECASE)
            ),
            "contains_samples": bool(
                re.search(r'(sample|trial|freebie)', message, re.IGNORECASE)
            ),
            "contains_followup": bool(
                re.search(r'(follow.up|next visit|again|next time)', message, re.IGNORECASE)
            ),
        }
        return {"context": context}

    def _prompt_builder_node(self, state: WorkflowState) -> Dict[str, Any]:
        """Build the complete prompt for the LLM."""
        user_prompt = USER_MESSAGE_TEMPLATE.format(
            user_message=state["user_message"]
        )
        return {"prompt": user_prompt}

    def _demo_llm_response(self, state: WorkflowState) -> Dict[str, Any]:
        """Generate demo/fallback response when LLM is unavailable."""
        import re
        message = state["user_message"].lower()
        
        # Extract common keywords from user message
        demo_data = {
            "doctor_name": "Dr. Unknown",
            "hospital": "Unknown Hospital",
            "specialization": "General Physician",
            "meeting_date": datetime.now().isoformat(),
            "products_discussed": ["Product A"],
            "samples_given": 0,
            "sentiment": "neutral",
            "outcome": "neutral",
            "follow_up_date": None,
            "summary": state["user_message"][:200],
            "confidence_score": 0.5
        }
        
        # Extract doctor name if present (Dr. + name)
        names = re.findall(r'dr\.?\s+(\w+)', message, re.IGNORECASE)
        if names:
            demo_data["doctor_name"] = f"Dr. {names[0].capitalize()}"
        
        # Extract hospital - look for pattern: at + name + (hospital|clinic|etc.)
        hospital_patterns = [
            r'at\s+([A-Za-z\s]+?)\s+(?:hospital|clinic|center|healthcare)',  # at [Name] hospital
            r'(?:hospital|clinic|center):\s+([A-Za-z\s]+)',  # hospital: [Name]
            r'at\s+([A-Za-z\s]+?)(?:\s+(?:hospital|clinic|center)|,|\.|today|yesterday|tomorrow)',
        ]
        for pattern in hospital_patterns:
            hospitals = re.findall(pattern, message, re.IGNORECASE)
            if hospitals:
                hospital_name = hospitals[0].strip()
                # Add "Hospital" suffix if not present
                if not any(suffix in hospital_name.lower() for suffix in ['hospital', 'clinic', 'center', 'healthcare']):
                    hospital_name += " Hospital"
                demo_data["hospital"] = hospital_name.title()
                break
        
        # Extract products if mentioned (look for predefined product names or general keywords)
        known_products = ["CardioPlus", "NeuroMax", "RespiraClear", "DermCare", "GastroShield", "OrthoFlex", "OncoGuard", "PediatriCare"]
        products = []
        for product in known_products:
            if product.lower() in message:
                products.append(product)
        
        if not products and any(word in message for word in ["product", "medicine", "drug", "medication"]):
            products = ["Product A"]
        
        if products:
            demo_data["products_discussed"] = products
        
        # Extract samples if mentioned (e.g., "5 samples" or "took 3 samples")
        samples = re.findall(r'(\d+)\s+sample', message, re.IGNORECASE)
        if samples:
            demo_data["samples_given"] = int(samples[0])
        
        # Determine sentiment and outcome
        positive_words = ["interested", "positive", "good", "great", "excellent", "impressed", "enthusiastic", "keen"]
        negative_words = ["not interested", "declined", "rejected", "negative"]
        followup_words = ["follow", "later", "next", "meeting", "revisit"]
        
        if any(word in message for word in negative_words):
            demo_data["sentiment"] = "not_interested"
            demo_data["outcome"] = "neutral"
        elif any(word in message for word in positive_words):
            demo_data["sentiment"] = "interested"
            demo_data["outcome"] = "positive"
            if any(word in message for word in followup_words):
                demo_data["outcome"] = "follow_up_required"
        
        logger.info(f"Using demo extraction (confidence: {demo_data['confidence_score']})")
        
        # Return as JSON string (as LLM would)
        demo_response = json.dumps(demo_data)
        return {"llm_response": demo_response, "extraction_error": None}

    def _llm_call_node(self, state: WorkflowState) -> Dict[str, Any]:
        """Call the Groq LLM with system prompt and user message."""
        try:
            # Check if API key is valid (not a placeholder)
            if not self.api_key or "your_groq_api_key" in self.api_key.lower():
                logger.warning("Groq API key is not set or is a placeholder. Using demo extraction mode.")
                return self._demo_llm_response(state)
            
            messages = [
                SystemMessage(content=SYSTEM_PROMPT),
                HumanMessage(content=state["prompt"]),
            ]

            response = self.llm.invoke(messages)
            llm_response = response.content.strip()

            logger.debug(f"LLM response received: {llm_response[:200]}...")

            return {"llm_response": llm_response, "extraction_error": None}

        except Exception as e:
            error_msg = f"LLM call failed: {str(e)}"
            logger.error(f"{error_msg} - Falling back to demo mode")
            return self._demo_llm_response(state)

    def _json_extractor_node(self, state: WorkflowState) -> Dict[str, Any]:
        """Extract and parse JSON from LLM response."""
        if state.get("extraction_error"):
            return {"extracted_data": None}

        llm_response = state.get("llm_response", "")

        if not llm_response:
            return {
                "extracted_data": None,
                "extraction_error": "No response from LLM"
            }

        try:
            # Clean response - remove markdown code blocks if present
            cleaned = llm_response.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            elif cleaned.startswith("```"):
                cleaned = cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]

            cleaned = cleaned.strip()

            # Parse JSON
            extracted = json.loads(cleaned)

            # Validate structure
            if not isinstance(extracted, dict):
                raise ValueError("Response is not a JSON object")

            return {
                "extracted_data": extracted,
                "extraction_error": None
            }

        except json.JSONDecodeError as e:
            error_msg = f"Failed to parse JSON: {str(e)}"
            logger.error(f"{error_msg}. Response was: {llm_response}")
            return {
                "extracted_data": None,
                "extraction_error": error_msg
            }
        except Exception as e:
            error_msg = f"Extraction failed: {str(e)}"
            logger.error(error_msg)
            return {
                "extracted_data": None,
                "extraction_error": error_msg
            }

    def _validation_node(self, state: WorkflowState) -> Dict[str, Any]:
        """Validate and normalize the extracted data."""
        data = state.get("extracted_data")
        if not data:
            return {"extracted_data": data}

        # Ensure required fields
        validated = {
            "doctor_name": self._safe_string(data.get("doctor_name")),
            "hospital": self._safe_string(data.get("hospital")),
            "specialization": self._safe_string(data.get("specialization")),
            "meeting_date": self._normalize_date(
                data.get("meeting_date"),
                default_today=True
            ),
            "products_discussed": self._normalize_list(
                data.get("products_discussed", [])
            ),
            "samples_given": self._safe_int(data.get("samples_given"), default=0),
            "sentiment": self._validate_enum(
                data.get("sentiment"),
                ["very_interested", "interested", "neutral", "not_interested", "declined"],
                "neutral"
            ),
            "outcome": self._validate_enum(
                data.get("outcome"),
                ["positive", "neutral", "follow_up_required", "sample_requested", "prescription_commitment"],
                "neutral"
            ),
            "follow_up_date": self._normalize_date(data.get("follow_up_date")),
            "summary": self._safe_string(data.get("summary")),
            "confidence_score": self._safe_float(
                data.get("confidence_score"), default=0.8
            ),
        }

        return {"extracted_data": validated}

    def _should_retry(self, state: WorkflowState) -> str:
        """Determine if the workflow should retry or end."""
        if state.get("extraction_error") and state.get("retry_count", 0) < self.MAX_RETRIES:
            if state.get("is_retry"):
                return "retry"
            return "retry"
        return "end"

    def _build_graph(self) -> StateGraph:
        """Build the LangGraph state graph."""
        workflow = StateGraph(WorkflowState)

        # Add nodes
        workflow.add_node("validate_input", self._validate_input_node)
        workflow.add_node("context_builder", self._context_builder_node)
        workflow.add_node("prompt_builder", self._prompt_builder_node)
        workflow.add_node("llm_call", self._llm_call_node)
        workflow.add_node("json_extractor", self._json_extractor_node)
        workflow.add_node("validation", self._validation_node)

        # Define edges
        workflow.set_entry_point("validate_input")

        workflow.add_conditional_edges(
            "validate_input",
            self._validation_router,
            {
                "context_builder": "context_builder",
                "end": END,
            }
        )

        workflow.add_edge("context_builder", "prompt_builder")
        workflow.add_edge("prompt_builder", "llm_call")
        workflow.add_edge("llm_call", "json_extractor")
        workflow.add_edge("json_extractor", "validation")

        workflow.add_conditional_edges(
            "validation",
            self._retry_router,
            {
                "end": END,
                "retry": "validate_input",
            }
        )

        return workflow.compile()

    def _validation_router(self, state: WorkflowState) -> str:
        """Route based on input validation."""
        if state.get("is_valid"):
            return "context_builder"
        return "end"

    def _retry_router(self, state: WorkflowState) -> str:
        """Route based on extraction success and retry logic."""
        if state.get("extraction_error") and state.get("retry_count", 0) < self.MAX_RETRIES:
            return "retry"
        return "end"

    def run(self, user_message: str, conversation_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Execute the LangGraph workflow for HCP data extraction.

        Args:
            user_message: Natural language description of the interaction
            conversation_id: Optional conversation identifier

        Returns:
            Dict containing extracted data and workflow metadata
        """
        initial_state: WorkflowState = {
            "user_message": user_message.strip(),
            "conversation_id": conversation_id,
            "is_valid": True,
            "validation_error": None,
            "context": {},
            "prompt": "",
            "llm_response": None,
            "extracted_data": None,
            "extraction_error": None,
            "is_retry": False,
            "retry_count": 0,
            "timestamp": datetime.utcnow().isoformat(),
        }

        try:
            final_state = self.graph.invoke(initial_state)

            return {
                "success": (
                    final_state.get("is_valid", False)
                    and final_state.get("extracted_data") is not None
                    and final_state.get("extraction_error") is None
                ),
                "extracted_data": final_state.get("extracted_data"),
                "error": (
                    final_state.get("validation_error")
                    or final_state.get("extraction_error")
                ),
                "raw_response": final_state.get("llm_response"),
                "conversation_id": conversation_id or f"conv_{datetime.utcnow().timestamp()}",
            }

        except Exception as e:
            logger.error(f"Workflow execution failed: {str(e)}", exc_info=True)
            return {
                "success": False,
                "extracted_data": None,
                "error": f"Workflow execution failed: {str(e)}",
                "raw_response": None,
                "conversation_id": conversation_id or f"conv_{datetime.utcnow().timestamp()}",
            }

    def run_with_retry(
        self, user_message: str, conversation_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Run workflow with automatic retry on failure."""
        result = self.run(user_message, conversation_id)

        retry_count = 0
        while (
            not result["success"]
            and result.get("error")
            and retry_count < self.MAX_RETRIES
        ):
            logger.info(f"Retrying workflow (attempt {retry_count + 1}/{self.MAX_RETRIES})")
            result = self.run(user_message, conversation_id)
            retry_count += 1

        return result

    @staticmethod
    def _safe_string(value: Any) -> Optional[str]:
        """Safely convert a value to string or return None."""
        if value is None:
            return None
        value = str(value).strip()
        return value if value else None

    @staticmethod
    def _safe_int(value: Any, default: int = 0) -> int:
        """Safely convert a value to int."""
        if value is None:
            return default
        try:
            return int(value)
        except (ValueError, TypeError):
            return default

    @staticmethod
    def _safe_float(value: Any, default: float = 0.0) -> float:
        """Safely convert a value to float."""
        if value is None:
            return default
        try:
            return float(value)
        except (ValueError, TypeError):
            return default

    @staticmethod
    def _normalize_list(value: Any) -> List[str]:
        """Normalize a value to a list of strings."""
        if not value:
            return []
        if isinstance(value, list):
            return [str(item).strip() for item in value if item]
        return [str(value).strip()]

    @staticmethod
    def _normalize_date(value: Any, default_today: bool = False) -> Optional[str]:
        """Normalize a date value to YYYY-MM-DD format."""
        if not value:
            if default_today:
                return datetime.utcnow().strftime("%Y-%m-%d")
            return None

        value = str(value).strip()

        # Handle relative dates
        today = datetime.utcnow()
        value_lower = value.lower()

        if value_lower == "today":
            return today.strftime("%Y-%m-%d")
        elif value_lower == "yesterday":
            return (today - timedelta(days=1)).strftime("%Y-%m-%d")
        elif value_lower == "tomorrow":
            return (today + timedelta(days=1)).strftime("%Y-%m-%d")
        elif "next" in value_lower:
            # Try to parse "next monday", "next tuesday", etc.
            days_map = {
                "monday": 0, "tuesday": 1, "wednesday": 2,
                "thursday": 3, "friday": 4, "saturday": 5, "sunday": 6
            }
            for day_name, day_num in days_map.items():
                if day_name in value_lower:
                    days_ahead = day_num - today.weekday()
                    if days_ahead <= 0:
                        days_ahead += 7
                    return (today + timedelta(days=days_ahead + 7)).strftime("%Y-%m-%d")

        # Try to parse standard date formats
        for fmt in ["%Y-%m-%d", "%d-%m-%Y", "%m/%d/%Y", "%d/%m/%Y", "%Y/%m/%d"]:
            try:
                return datetime.strptime(value, fmt).strftime("%Y-%m-%d")
            except (ValueError, TypeError):
                continue

        if default_today:
            return today.strftime("%Y-%m-%d")
        return value

    @staticmethod
    def _validate_enum(
        value: Any, valid_values: List[str], default: str
    ) -> str:
        """Validate a value against an enum of allowed values."""
        if not value:
            return default
        value_str = str(value).strip().lower()
        return value_str if value_str in valid_values else default