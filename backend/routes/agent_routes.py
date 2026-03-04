from fastapi import APIRouter
from controllers.agent_controller import AgentController
from pydantic import BaseModel, Field
from typing import Any, Dict, Optional
from utils.response_helper import standardize_response

router = APIRouter(prefix="/api/agent", tags=["agent"])

class RecommendRequest(BaseModel):
    dataset_type: str = Field(..., pattern="^(structured|unstructured)$")
    summary: Dict[str, Any]

class AskRequest(BaseModel):
    dataset_type: str = Field(..., pattern="^(structured|unstructured)$")
    summary: Dict[str, Any]
    question: str


class ChatRequest(BaseModel):
    dataset_type: str = Field("structured", pattern="^(structured|unstructured)$")
    summary: Dict[str, Any] = {}
    question: str = ""
    agent_mode: Any = True
    model: Optional[str] = None


@router.post("/chat")
async def chat(request: ChatRequest):
    try:
        data = await AgentController.chat(
            dataset_type=request.dataset_type,
            summary=request.summary,
            question=request.question,
            agent_mode=request.agent_mode,
            model=request.model,
        )
        return standardize_response(True, data, "Agent response generated")
    except ValueError as e:
        return standardize_response(False, error=str(e), status_code=400)
    except Exception as e:
        return standardize_response(False, error=str(e), status_code=500)


@router.post("/recommend")
async def recommend(request: RecommendRequest):
    try:
        text_output = await AgentController.recommend(request.dataset_type, request.summary)
        return standardize_response(True, {"reply": text_output}, "Agent recommendation generated")
    except Exception as e:
        return standardize_response(False, error=str(e), status_code=500)

@router.post("/ask")
async def ask(request: AskRequest):
    try:
        text_output = await AgentController.ask(request.dataset_type, request.summary, request.question)
        return standardize_response(True, {"reply": text_output}, "Agent answer generated")
    except Exception as e:
        return standardize_response(False, error=str(e), status_code=500)
