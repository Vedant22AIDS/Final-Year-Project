from typing import Any, Dict, Optional
from services.agent_service import agent_service

class AgentController:
    @staticmethod
    async def chat(
        dataset_type: str,
        summary: Dict[str, Any],
        question: str,
        agent_mode: Any,
        model: Optional[str] = None,
    ) -> Dict[str, Any]:
        return await agent_service.chat(
            dataset_type=dataset_type,
            summary=summary,
            question=question,
            agent_mode=agent_mode,
            model=model,
        )

    @staticmethod
    async def recommend(dataset_type: str, summary: Dict[str, Any]) -> str:
        return await agent_service.get_recommendation(dataset_type, summary)

    @staticmethod
    async def ask(dataset_type: str, summary: Dict[str, Any], question: str) -> str:
        return await agent_service.answer_question(dataset_type, summary, question)
