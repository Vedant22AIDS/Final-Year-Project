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

    @staticmethod
    async def filtering(text: str, remove_stop_words: bool = True, min_word_length: int = 1) -> Any:
        if not isinstance(text, str) or not text.strip():
            return standardize_response(False, error="Text is required", status_code=400)

        if not isinstance(remove_stop_words, bool):
            return standardize_response(False, error="remove_stop_words must be a boolean", status_code=400)

        if not isinstance(min_word_length, int) or min_word_length < 1 or min_word_length > 20:
            return standardize_response(False, error="min_word_length must be an integer between 1 and 20", status_code=400)

        result = text_service.filter_text(
            text=text,
            remove_stop_words=remove_stop_words,
            min_word_length=min_word_length,
        )
        return standardize_response(True, result, "Text filtering completed")

    @staticmethod
    async def normalize_text(text: str, method: str, stemming_algorithm: str = "porter") -> Any:
        if not isinstance(text, str) or not text.strip():
            return standardize_response(False, error="Text is required", status_code=400)

        if method not in {"stemming", "lemmatization", "spell-correction"}:
            return standardize_response(
                False,
                error="method must be one of: stemming, lemmatization, spell-correction",
                status_code=400,
            )

        if method == "stemming" and stemming_algorithm not in {"porter", "snowball"}:
            return standardize_response(
                False,
                error="stemming_algorithm must be one of: porter, snowball",
                status_code=400,
            )

        result = text_service.normalize_text(
            text=text,
            method=method,
            stemming_algorithm=stemming_algorithm,
        )
        return standardize_response(True, result, "Text normalization completed")

    @staticmethod
    async def feature_extraction(
        text: str,
        method: str,
        max_features: int = 1000,
        ngram_range: str = "1-1",
        vector_size: int = 100,
    ) -> Any:
        if not isinstance(text, str) or not text.strip():
            return standardize_response(False, error="Text is required", status_code=400)

        if method not in {"tfidf", "bow", "word2vec"}:
            return standardize_response(False, error="method must be one of: tfidf, bow, word2vec", status_code=400)

        if not isinstance(max_features, int) or max_features < 10 or max_features > 10000:
            return standardize_response(False, error="max_features must be an integer between 10 and 10000", status_code=400)

        if not isinstance(vector_size, int) or vector_size < 10 or vector_size > 1024:
            return standardize_response(False, error="vector_size must be an integer between 10 and 1024", status_code=400)

        if not isinstance(ngram_range, str) or "-" not in ngram_range:
            return standardize_response(False, error="ngram_range must be in format min-max, e.g., 1-2", status_code=400)

        result = text_service.extract_features(
            text=text,
            method=method,
            max_features=max_features,
            ngram_range=ngram_range,
            vector_size=vector_size,
        )
        return standardize_response(True, result, "Feature extraction completed")

    @staticmethod
    async def get_feature_extraction_result(extraction_id: str) -> Any:
        if not isinstance(extraction_id, str) or not extraction_id.strip():
            return standardize_response(False, error="extraction_id is required", status_code=400)

        result = text_service.get_feature_artifact(extraction_id.strip())
        if not result:
            return standardize_response(False, error="Feature extraction result not found", status_code=404)
        return standardize_response(True, result, "Feature extraction result fetched")
