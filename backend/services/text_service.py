import re
from typing import Any, Dict, List


class TextService:
    VALID_OPERATIONS = {
        "remove_html",
        "remove_urls",
        "remove_special_chars",
        "normalize_case",
        "remove_whitespace",
    }

    def basic_clean(self, text: str, operations: List[str]) -> Dict[str, Any]:
        cleaned = text or ""
        changes: List[Dict[str, Any]] = []

        for operation in operations:
            before = cleaned

            if operation == "remove_html":
                cleaned = re.sub(r"<[^>]+>", " ", cleaned)
            elif operation == "remove_urls":
                cleaned = re.sub(r"https?://\S+|www\.\S+", " ", cleaned, flags=re.IGNORECASE)
                cleaned = re.sub(r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b", " ", cleaned, flags=re.IGNORECASE)
            elif operation == "remove_special_chars":
                cleaned = re.sub(r"[^\w\s]", " ", cleaned)
            elif operation == "normalize_case":
                cleaned = cleaned.lower()
            elif operation == "remove_whitespace":
                cleaned = re.sub(r"\s+", " ", cleaned).strip()

            changes.append(
                {
                    "operation": operation,
                    "changed": before != cleaned,
                    "before_chars": len(before),
                    "after_chars": len(cleaned),
                }
            )

        return {
            "cleaned_text": cleaned,
            "applied_operations": operations,
            "changes": changes,
            "stats": self._text_stats(text or "", cleaned),
        }

    def tokenize(self, text: str, token_type: str, n: int = 2) -> Dict[str, Any]:
        source = text or ""
        if token_type == "word":
            tokens = self._word_tokens(source)
        elif token_type == "sentence":
            tokens = self._sentence_tokens(source)
        else:
            words = self._word_tokens(source)
            tokens = self._ngrams(words, n)

        return {
            "token_type": token_type,
            "n": n if token_type == "ngram" else None,
            "token_count": len(tokens),
            "tokens": tokens,
        }

    @staticmethod
    def _word_count(value: str) -> int:
        return len(value.split()) if value.strip() else 0

    @staticmethod
    def _line_count(value: str) -> int:
        return len(value.splitlines()) if value else 0

    @staticmethod
    def _word_tokens(value: str) -> List[str]:
        return re.findall(r"\b\w+(?:'\w+)?\b", value, flags=re.UNICODE)

    @staticmethod
    def _sentence_tokens(value: str) -> List[str]:
        if not value.strip():
            return []
        parts = re.split(r"(?<=[.!?])\s+", value.strip())
        return [segment.strip() for segment in parts if segment.strip()]

    @staticmethod
    def _ngrams(words: List[str], n: int) -> List[str]:
        if n <= 0 or len(words) < n:
            return []
        return [" ".join(words[i:i + n]) for i in range(len(words) - n + 1)]

    def _text_stats(self, original: str, cleaned: str) -> Dict[str, Any]:
        return {
            "original": {
                "char_count": len(original),
                "word_count": self._word_count(original),
                "line_count": self._line_count(original),
            },
            "cleaned": {
                "char_count": len(cleaned),
                "word_count": self._word_count(cleaned),
                "line_count": self._line_count(cleaned),
            },
        }


text_service = TextService()
