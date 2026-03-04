import json
import os
from typing import Any, Dict, Optional
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.1:8b")
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://127.0.0.1:11434/api/generate")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434")
DEFAULT_AGENT_PROMPT = (
    "Provide a concise initial analysis and 3 to 6 high-impact preprocessing recommendations "
    "based only on the dataset summary."
)

SYSTEM_PROMPT = '''
You are DATABits AI, an intelligent data preprocessing and analysis assistant.

Your responsibilities:
1. Analyze uploaded dataset summaries (structured or unstructured).
2. Recommend appropriate preprocessing actions.
3. Answer user questions about the dataset analytically.

You will receive:
- dataset_type (structured or unstructured)
- dataset_summary (not raw data)
- task_type (RECOMMENDATION or QUESTION)
- optional user_question

IMPORTANT RULES:
- You will NOT receive raw dataset.
- Base reasoning ONLY on provided dataset_summary.
- Do NOT hallucinate.
- Do NOT invent columns, values, or statistics.
- Do NOT return JSON.
- Do NOT use markdown formatting.
- Return clean, readable plain text only.
- Always use structured point-wise output.

------------------------------------------------
IF dataset_type = structured
------------------------------------------------

When analyzing structured dataset summaries, consider:

- Missing values
- Data types (numerical, categorical, datetime)
- Class imbalance
- Outliers
- Constant columns
- Correlation between features
- Feature scaling differences
- Cardinality of categorical columns

------------------------------------------------
IF dataset_type = unstructured
------------------------------------------------

When analyzing unstructured dataset summaries, consider:

- Total documents
- Word count
- Vocabulary size
- Stopword percentage
- Special characters or noise
- Sentence length
- Text cleanliness
- Repetitive patterns
- Presence of URLs, HTML, emails

Possible preprocessing techniques for unstructured data:

- Basic cleaning (remove HTML, URLs, special characters)
- Lowercasing
- Stopword removal
- Tokenization
- Lemmatization or stemming
- N-gram generation
- TF-IDF or Bag-of-Words
- Word embeddings
- Dimensionality reduction (if vectorized)

------------------------------------------------
IF TASK TYPE = RECOMMENDATION
------------------------------------------------

Generate 3 to 6 preprocessing recommendations.

Each recommendation must:
- Be concise
- Include short reasoning
- Mention priority if critical
- Be formatted as one bullet point per line using "- "

Example format:

- Remove missing values from income column (High priority: significant data loss risk)
- Apply SMOTE to balance target classes
- Normalize numerical features to ensure consistent scale

For unstructured data example:

- Remove stopwords to reduce noise in text data
- Apply TF-IDF vectorization to convert text into numerical features
- Perform basic cleaning to remove special characters

------------------------------------------------
IF TASK TYPE = QUESTION
------------------------------------------------

Answer the user question clearly and analytically using the same bullet format.

Rules:
- Use only dataset summary
- Be factual
- Provide reasoning
- Do not repeat entire summary
- Return plain text in bullet points
- Keep it structured in 3 to 6 short points
- Start each line with "- "

Examples:

If asked "Is my dataset imbalanced?"
Explain class distribution clearly.

If asked "Is my text data clean?"
Analyze based on stopword %, noise indicators, etc.

------------------------------------------------
END OF INSTRUCTIONS
------------------------------------------------
'''

class AgentService:
    @staticmethod
    def _to_bool(value: Any, default: bool = False) -> bool:
        if value is None:
            return default
        if isinstance(value, bool):
            return value
        if isinstance(value, str):
            return value.strip().lower() in {"true", "1", "yes", "on"}
        return bool(value)

    async def chat(
        self,
        dataset_type: str,
        summary: Dict[str, Any],
        question: Optional[str],
        agent_mode: Any = True,
        model: Optional[str] = None,
    ) -> Dict[str, Any]:
        is_agent_mode = self._to_bool(agent_mode, default=True)
        user_question = (question or "").strip()
        used_default_prompt = (not is_agent_mode) or (not user_question)
        prompt_type = "DEFAULT_PROMPT" if used_default_prompt else "QUESTION"
        effective_prompt = DEFAULT_AGENT_PROMPT if used_default_prompt else user_question

        prompt = (
            f"dataset_type: {dataset_type}\n"
            f"dataset_summary: {summary}\n"
            f"task_type: {prompt_type}\n"
            f"user_question: {effective_prompt}\n"
        )
        text_output = await self._call_llama(prompt, model=model)
        return {
            "reply": text_output,
            "used_default_prompt": used_default_prompt,
            "prompt_type": prompt_type,
            "model": model or OLLAMA_MODEL,
        }

    async def get_recommendation(self, dataset_type: str, summary: Dict[str, Any]) -> str:
        prompt = (
            f"dataset_type: {dataset_type}\n"
            f"dataset_summary: {summary}\n"
            f"task_type: RECOMMENDATION\n"
        )
        return await self._call_llama(prompt)

    async def answer_question(self, dataset_type: str, summary: Dict[str, Any], question: str) -> str:
        prompt = (
            f"dataset_type: {dataset_type}\n"
            f"dataset_summary: {summary}\n"
            f"task_type: QUESTION\n"
            f"user_question: {question}\n"
        )
        return await self._call_llama(prompt)

    async def _call_llama(self, prompt: str, model: Optional[str] = None) -> str:
        try:
            import asyncio
            loop = asyncio.get_event_loop()
            full_prompt = f"<|system|> {SYSTEM_PROMPT}\n<|user|> {prompt}"

            def call_chat_ollama() -> str:
                try:
                    from langchain_ollama import ChatOllama
                    from langchain_core.messages import HumanMessage, SystemMessage
                except Exception as exc:
                    raise ImportError("ChatOllama package is not available") from exc

                chat = ChatOllama(model=model or OLLAMA_MODEL, base_url=OLLAMA_BASE_URL)
                response = chat.invoke([SystemMessage(content=SYSTEM_PROMPT), HumanMessage(content=prompt)])
                content = getattr(response, "content", "")
                return str(content).strip()

            def call_local_ollama() -> str:
                payload = json.dumps(
                    {
                        "model": model or OLLAMA_MODEL,
                        "prompt": full_prompt,
                        "stream": False,
                    }
                ).encode("utf-8")
                req = Request(
                    OLLAMA_URL,
                    data=payload,
                    headers={"Content-Type": "application/json"},
                    method="POST",
                )
                with urlopen(req, timeout=120) as resp:
                    body = resp.read().decode("utf-8")
                parsed = json.loads(body)
                return str(parsed.get("response", "")).strip()

            try:
                text = await loop.run_in_executor(None, call_chat_ollama)
            except Exception:
                text = await loop.run_in_executor(None, call_local_ollama)
            if not isinstance(text, str) or not text.strip():
                raise ValueError("Model returned empty or invalid response.")
            text = self._clean_text(text)
            return text.strip()
        except HTTPError as e:
            raise RuntimeError(f"Ollama HTTP error: {e.code} {e.reason}") from e
        except URLError as e:
            raise RuntimeError(
                f"Cannot reach Ollama at {OLLAMA_URL}. Ensure Ollama is running and model '{model or OLLAMA_MODEL}' is available."
            ) from e
        except Exception as e:
            raise RuntimeError(f"Ollama model error: {e}")

    def _clean_text(self, text: str) -> str:
        import re
        # Remove markdown, code blocks, and JSON-like output
        text = re.sub(r"```[\s\S]*?```", "", text)
        text = re.sub(r"\{[\s\S]*?\}", "", text)
        text = re.sub(r"\[[^\]]+\]\([^\)]+\)", "", text)
        # Preserve structured list output from the model and normalize bullet markers.
        text = re.sub(r"^\s*[•*]\s*", "- ", text, flags=re.MULTILINE)
        return text.strip()

agent_service = AgentService()

