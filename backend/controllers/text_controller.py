from typing import Any, List

from services.text_service import text_service
from utils.response_helper import standardize_response


class TextController:
    @staticmethod
    async def tokenize(text: str, token_type: str, n: int = 2) -> Any:
        if not isinstance(text, str) or not text.strip():
            return standardize_response(False, error="Text is required", status_code=400)

        if token_type not in {"word", "sentence", "ngram"}:
            return standardize_response(False, error="token_type must be one of: word, sentence, ngram", status_code=400)

        if token_type == "ngram":
            if not isinstance(n, int) or n < 2 or n > 5:
                return standardize_response(False, error="n must be an integer between 2 and 5 for ngram tokenization", status_code=400)

        result = text_service.tokenize(text=text, token_type=token_type, n=n)
        return standardize_response(True, result, "Tokenization completed")

    @staticmethod
    async def basic_clean(text: str, operations: List[str]) -> Any:
        if not isinstance(text, str) or not text.strip():
            return standardize_response(False, error="Text is required", status_code=400)

        if not isinstance(operations, list) or len(operations) == 0:
            return standardize_response(False, error="At least one cleaning operation is required", status_code=400)

        invalid = [op for op in operations if op not in text_service.VALID_OPERATIONS]
        if invalid:
            return standardize_response(
                False,
                error=f"Invalid operation(s): {invalid}. Allowed: {sorted(text_service.VALID_OPERATIONS)}",
                status_code=400,
            )

        result = text_service.basic_clean(text, operations)
        return standardize_response(True, result, "Basic text cleaning completed")
