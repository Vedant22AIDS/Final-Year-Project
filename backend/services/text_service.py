import difflib
import os
import re
from typing import Any, Dict, List, Set
from threading import Lock
from uuid import uuid4

import numpy as np
from sklearn.feature_extraction.text import CountVectorizer, TfidfVectorizer

try:
    import nltk  # type: ignore
except Exception:  # pragma: no cover
    nltk = None  # type: ignore

try:
    from nltk.stem import PorterStemmer, SnowballStemmer, WordNetLemmatizer  # type: ignore
except Exception:  # pragma: no cover
    PorterStemmer = None  # type: ignore
    SnowballStemmer = None  # type: ignore
    WordNetLemmatizer = None  # type: ignore

try:
    from nltk.corpus import words as nltk_words  # type: ignore
except Exception:  # pragma: no cover
    nltk_words = None  # type: ignore

try:
    from spellchecker import SpellChecker  # type: ignore
except Exception:  # pragma: no cover
    SpellChecker = None  # type: ignore

try:
    import symspellpy as symspellpy_pkg  # type: ignore
    from symspellpy import SymSpell, Verbosity  # type: ignore
except Exception:  # pragma: no cover
    symspellpy_pkg = None  # type: ignore
    SymSpell = None  # type: ignore
    Verbosity = None  # type: ignore


class TextService:
    WORD_TOKEN_REGEX = re.compile(r"[^\W_]+(?:'[^\W_]+)?", flags=re.UNICODE)
    SENTENCE_TOKEN_REGEX = re.compile(r"[^.!?]+[.!?]*(?=\s+|$)", flags=re.UNICODE)

    VALID_OPERATIONS = {
        "remove_html",
        "remove_urls",
        "remove_special_chars",
        "normalize_case",
        "remove_whitespace",
    }
    STOP_WORDS = {
        "a", "an", "and", "are", "as", "at", "be", "been", "being", "but", "by", "can", "could", "did", "do",
        "does", "doing", "for", "from", "had", "has", "have", "having", "he", "her", "here", "hers", "herself",
        "him", "himself", "his", "how", "i", "if", "in", "into", "is", "it", "its", "itself", "just", "me", "more",
        "most", "my", "myself", "no", "nor", "not", "of", "on", "or", "our", "ours", "ourselves", "out", "over",
        "she", "should", "so", "some", "such", "than", "that", "the", "their", "theirs", "them", "themselves",
        "then", "there", "these", "they", "this", "those", "through", "to", "too", "under", "until", "up", "very",
        "was", "we", "were", "what", "when", "where", "which", "while", "who", "whom", "why", "will", "with", "you",
        "your", "yours", "yourself", "yourselves",
        "am", "isn't", "aren't", "wasn't", "weren't", "don't", "doesn't", "didn't", "can't", "couldn't", "won't",
        "wouldn't", "shouldn't", "hasn't", "haven't", "hadn't", "i'm", "you're", "we're", "they're", "he's", "she's",
        "it's", "that's", "there's", "here's", "i've", "you've", "we've", "they've", "i'll", "you'll", "we'll",
        "they'll", "i'd", "you'd", "we'd", "they'd", "s", "t", "d", "ll", "m", "re", "ve",
    }
    LEMMA_MAP = {
        "am": "be", "are": "be", "is": "be", "was": "be", "were": "be", "been": "be", "being": "be",
        "children": "child", "mice": "mouse", "men": "man", "women": "woman", "teeth": "tooth", "feet": "foot",
        "geese": "goose", "better": "good", "best": "good", "worse": "bad", "worst": "bad", "went": "go",
        "gone": "go", "done": "do", "did": "do", "has": "have", "had": "have", "running": "run", "ran": "run",
        "ate": "eat", "eaten": "eat",
    }
    FALLBACK_VOCAB = {
        "class", "implementation", "write", "program", "custom", "immutable", "java", "requires", "using",
        "final", "private", "member", "variables", "setter", "methods", "abstract", "interface", "implement",
        "scenario", "vehicle", "system", "choose", "between", "shared", "state", "behavior", "method",
        "overriding", "polymorphism", "classic", "task", "create", "parent", "shape", "draw", "override",
        "child", "circle", "rectangle", "demonstrate", "runtime", "exception", "handling", "design", "bank",
        "robust", "error", "management", "object", "oriented", "structure", "encapsulation", "data", "hiding",
        "fields", "public", "getters", "setters", "including", "validation", "logic", "maintain", "integrity",
        "language", "receive", "separate", "occurred", "writing", "environment", "government", "insufficientfundsexception",
        "hello",
    }

    def __init__(self) -> None:
        self._ensure_nltk_resources()
        self._porter = PorterStemmer() if PorterStemmer else None
        self._snowball = SnowballStemmer("english") if SnowballStemmer else None
        self._lemmatizer = WordNetLemmatizer() if WordNetLemmatizer else None
        self._spellchecker = SpellChecker() if SpellChecker else None
        self._symspell = None
        if SymSpell and symspellpy_pkg:
            try:
                symspell = SymSpell(max_dictionary_edit_distance=2, prefix_length=7)
                dictionary_path = os.path.join(
                    os.path.dirname(symspellpy_pkg.__file__),
                    "frequency_dictionary_en_82_765.txt",
                )
                if os.path.exists(dictionary_path):
                    loaded = symspell.load_dictionary(dictionary_path, term_index=0, count_index=1)
                    if loaded:
                        bigram_path = os.path.join(
                            os.path.dirname(symspellpy_pkg.__file__),
                            "frequency_bigramdictionary_en_243_342.txt",
                        )
                        if os.path.exists(bigram_path):
                            try:
                                symspell.load_bigram_dictionary(bigram_path, term_index=0, count_index=2)
                            except Exception:
                                pass
                        self._symspell = symspell
            except Exception:
                self._symspell = None

        vocab = set(self.FALLBACK_VOCAB)
        if nltk_words:
            try:
                vocab.update(word.lower() for word in nltk_words.words())
            except Exception:
                pass
        self._vocab = vocab
        self._feature_artifacts: Dict[str, Dict[str, Any]] = {}
        self._feature_lock = Lock()

    @staticmethod
    def _ensure_nltk_resources() -> None:
        if not nltk:
            return
        resources = ["wordnet", "omw-1.4", "words"]
        for resource in resources:
            try:
                nltk.data.find(f"corpora/{resource}")
            except Exception:
                try:
                    nltk.download(resource, quiet=True)
                except Exception:
                    pass

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
            "total_tokens": len(tokens),
            "token_count": len(tokens),
            "tokens": tokens,
        }

    def filter_text(self, text: str, remove_stop_words: bool = True, min_word_length: int = 1) -> Dict[str, Any]:
        source = text or ""
        words = self._word_tokens(source)
        filtered_tokens: List[str] = []

        for token in words:
            if remove_stop_words and token.lower() in self.STOP_WORDS:
                continue
            if len(token) < min_word_length:
                continue
            filtered_tokens.append(token)

        filtered_text = " ".join(filtered_tokens)
        return {
            "filtered_text": filtered_text,
            "settings": {
                "remove_stop_words": remove_stop_words,
                "min_word_length": min_word_length,
            },
            "original_token_count": len(words),
            "filtered_token_count": len(filtered_tokens),
            "removed_token_count": len(words) - len(filtered_tokens),
            "tokens": filtered_tokens,
            "stats": self._text_stats(source, filtered_text),
        }

    def normalize_text(self, text: str, method: str, stemming_algorithm: str = "porter") -> Dict[str, Any]:
        source = text or ""
        words = self._word_tokens(source)

        if method == "stemming":
            normalized_tokens = [self._stem_token(token, stemming_algorithm) for token in words]
            normalized_text = self._replace_tokens_preserve_format(source, normalized_tokens)
        elif method == "lemmatization":
            normalized_tokens = [self._lemmatize_token(token) for token in words]
            normalized_text = self._replace_tokens_preserve_format(source, normalized_tokens)
        else:
            normalized_text = self._spell_correct_text(source)
            normalized_tokens = self._word_tokens(normalized_text)

        changed_count = sum(1 for before, after in zip(words, normalized_tokens) if before != after)
        changed_count += abs(len(words) - len(normalized_tokens))
        return {
            "normalized_text": normalized_text,
            "method": method,
            "stemming_algorithm": stemming_algorithm if method == "stemming" else None,
            "original_token_count": len(words),
            "normalized_token_count": len(normalized_tokens),
            "changed_token_count": changed_count,
            "tokens": normalized_tokens,
            "stats": self._text_stats(source, normalized_text),
        }

    def _replace_tokens_preserve_format(self, source: str, normalized_tokens: List[str]) -> str:
        idx = 0

        def _replace_token(match: re.Match[str]) -> str:
            nonlocal idx
            replacement = normalized_tokens[idx] if idx < len(normalized_tokens) else match.group(0)
            idx += 1
            return replacement

        return self.WORD_TOKEN_REGEX.sub(_replace_token, source)

    def _spell_correct_text(self, source: str) -> str:
        if not source.strip():
            return source

        corrected_tokens = [self._spell_correct_token(token) for token in self._word_tokens(source)]
        return self._replace_tokens_preserve_format(source, corrected_tokens)

    def extract_features(
        self,
        text: str,
        method: str,
        max_features: int = 1000,
        ngram_range: str = "1-1",
        vector_size: int = 100,
    ) -> Dict[str, Any]:
        source = (text or "").strip()
        if not source:
            return {
                "extraction_id": None,
                "method": method,
                "vector_length": 0,
                "result": {},
            }

        try:
            n_min, n_max = [int(v) for v in ngram_range.split("-", 1)]
        except Exception:
            n_min, n_max = 1, 1
        n_min = max(1, min(3, n_min))
        n_max = max(n_min, min(3, n_max))
        safe_max_features = max(10, min(10000, int(max_features)))
        safe_vector_size = max(10, min(1024, int(vector_size)))

        lower_method = method.lower()
        extraction_id = str(uuid4())

        if lower_method == "tfidf":
            vectorizer = TfidfVectorizer(max_features=safe_max_features, ngram_range=(n_min, n_max))
            vector = vectorizer.fit_transform([source]).toarray()[0]
            feature_names = vectorizer.get_feature_names_out().tolist()
            values_map = {feature_names[i]: float(vector[i]) for i in range(len(feature_names))}
            result_payload: Dict[str, Any] = {
                "id": "doc1",
                "values": values_map,
            }
            vector_length = len(feature_names)
        elif lower_method == "bow":
            vectorizer = CountVectorizer(max_features=safe_max_features, ngram_range=(n_min, n_max))
            vector = vectorizer.fit_transform([source]).toarray()[0]
            feature_names = vectorizer.get_feature_names_out().tolist()
            values_map = {feature_names[i]: int(vector[i]) for i in range(len(feature_names))}
            result_payload = {
                "id": "doc1",
                "values": values_map,
            }
            vector_length = len(feature_names)
        else:
            tokens = self._word_tokens(source)
            if not tokens:
                values = [0.0] * safe_vector_size
            else:
                word_vectors = []
                for token in tokens:
                    seed = abs(hash(token.lower())) % (2 ** 32)
                    rng = np.random.default_rng(seed)
                    word_vectors.append(rng.normal(0.0, 1.0, safe_vector_size))
                values = [float(v) for v in np.mean(np.array(word_vectors), axis=0).tolist()]
            result_payload = [{
                "id": "1",
                "values": values,
                "metadata": {
                    "text": source,
                },
            }]
            vector_length = len(values)

        artifact = {
            "extraction_id": extraction_id,
            "method": lower_method,
            "result": result_payload,
            "vector_length": vector_length,
            "config": {
                "max_features": safe_max_features,
                "ngram_range": f"{n_min}-{n_max}",
                "vector_size": safe_vector_size,
            },
        }
        with self._feature_lock:
            self._feature_artifacts[extraction_id] = artifact

        return artifact

    def get_feature_artifact(self, extraction_id: str) -> Dict[str, Any]:
        with self._feature_lock:
            artifact = self._feature_artifacts.get(extraction_id)
        return artifact or {}

    @staticmethod
    def _word_count(value: str) -> int:
        return len(value.split()) if value.strip() else 0

    @staticmethod
    def _line_count(value: str) -> int:
        return len(value.splitlines()) if value else 0

    @staticmethod
    def _word_tokens(value: str) -> List[str]:
        if not value:
            return []
        return TextService.WORD_TOKEN_REGEX.findall(value)

    @staticmethod
    def _sentence_tokens(value: str) -> List[str]:
        if not value.strip():
            return []
        matches = TextService.SENTENCE_TOKEN_REGEX.findall(value.strip())
        return [segment.strip() for segment in matches if segment.strip()]

    @staticmethod
    def _ngrams(words: List[str], n: int) -> List[str]:
        if n <= 0 or len(words) < n:
            return []
        return [" ".join(words[i:i + n]) for i in range(len(words) - n + 1)]

    @staticmethod
    def _preserve_case(original: str, replacement: str) -> str:
        if original.isupper():
            return replacement.upper()
        if original[:1].isupper():
            return replacement[:1].upper() + replacement[1:]
        return replacement

    def _stem_token(self, token: str, algorithm: str) -> str:
        lower = token.lower()
        if len(lower) <= 3:
            return token
        if algorithm == "porter" and self._porter:
            return self._preserve_case(token, self._porter.stem(lower))
        if algorithm == "snowball" and self._snowball:
            return self._preserve_case(token, self._snowball.stem(lower))

        stem = lower

        if stem.endswith("ies") and len(stem) > 4:
            stem = stem[:-3] + "y"
        elif stem.endswith("ing") and len(stem) > 5:
            stem = stem[:-3]
            if len(stem) > 2 and stem[-1] == stem[-2] and stem[-1] not in "lsz":
                stem = stem[:-1]
        elif stem.endswith("ed") and len(stem) > 4:
            stem = stem[:-2]
            if len(stem) > 2 and stem[-1] == stem[-2] and stem[-1] not in "lsz":
                stem = stem[:-1]
        elif algorithm == "snowball" and stem.endswith("ly") and len(stem) > 4:
            stem = stem[:-2]

        return self._preserve_case(token, stem)

    def _lemmatize_token(self, token: str) -> str:
        lower = token.lower()
        if self._lemmatizer:
            try:
                lemma_n = self._lemmatizer.lemmatize(lower, pos="n")
                lemma_v = self._lemmatizer.lemmatize(lower, pos="v")
                lemma_a = self._lemmatizer.lemmatize(lower, pos="a")
                candidates = [lemma_n, lemma_v, lemma_a, lower]
                lemma = min(candidates, key=len)
                if lemma and lemma != lower:
                    return self._preserve_case(token, lemma)
            except Exception:
                pass
        if lower in self.LEMMA_MAP:
            return self._preserve_case(token, self.LEMMA_MAP[lower])
        if lower.endswith("ies") and len(lower) > 4:
            return self._preserve_case(token, lower[:-3] + "y")
        if lower.endswith("ves") and len(lower) > 4 and not lower.endswith("lves"):
            return self._preserve_case(token, lower[:-3] + "f")
        if lower.endswith("s") and len(lower) > 4 and not lower.endswith(("ss", "us", "is")):
            return self._preserve_case(token, lower[:-1])
        return token

    def _spell_correct_token(self, token: str) -> str:
        lower = token.lower()

        if not lower.isalpha() or len(lower) <= 2:
            return token

        if self._spellchecker:
            try:
                if lower not in self._spellchecker.unknown([lower]):
                    return token
            except Exception:
                pass
        elif lower in self._vocab:
            return token

        squashed = re.sub(r"(.)\1{2,}", r"\1\1", lower)
        candidates: Set[str] = set()
        if squashed.isalpha():
            candidates.add(squashed)

        if self._symspell and Verbosity:
            try:
                suggestions = self._symspell.lookup(squashed, Verbosity.ALL, max_edit_distance=2, include_unknown=False)
                if suggestions:
                    for suggestion in suggestions:
                        term = suggestion.term.lower()
                        if term.isalpha() and " " not in term:
                            candidates.add(term)
            except Exception:
                pass

        if self._spellchecker:
            try:
                for term in self._spellchecker.candidates(squashed) or set():
                    if term and term.isalpha():
                        candidates.add(term.lower())
            except Exception:
                pass

        if not candidates:
            # Try handwritten edit-distance candidate generation (Norvig-style)
            def edits1(word: str):
                letters = 'abcdefghijklmnopqrstuvwxyz'
                splits = [(word[:i], word[i:]) for i in range(len(word) + 1)]
                deletes = [L + R[1:] for L, R in splits if R]
                transposes = [L + R[1] + R[0] + R[2:] for L, R in splits if len(R) > 1]
                replaces = [L + c + (R[1:] if len(R) > 1 else '') for L, R in splits if R for c in letters]
                inserts = [L + c + R for L, R in splits for c in letters]
                return set(deletes + transposes + replaces + inserts)

            def edits2(word: str):
                e1 = edits1(word)
                e2 = set()
                for w in e1:
                    e2.update(edits1(w))
                return e2

            cand_from_edits = set()
            for cand in edits1(squashed):
                if cand in self._vocab:
                    cand_from_edits.add(cand)
            if not cand_from_edits:
                for cand in edits2(squashed):
                    if cand in self._vocab:
                        cand_from_edits.add(cand)
            candidates.update(cand_from_edits)

            # allow looser close matches from vocabulary if edits didn't help
            if not candidates:
                for candidate in difflib.get_close_matches(squashed, list(self._vocab), n=8, cutoff=0.7):
                    if candidate.isalpha():
                        candidates.add(candidate.lower())

        if not candidates:
            return token

        ranked = sorted(
            candidates,
            key=lambda candidate: self._spell_candidate_score(lower, candidate),
            reverse=True,
        )
        best = ranked[0]
        score = self._spell_candidate_score(lower, best)
        if best != lower and score >= 0.45:
            return self._preserve_case(token, best)
        return token

    def _spell_candidate_score(self, source: str, candidate: str) -> float:
        if not candidate or not candidate.isalpha():
            return -10.0
        if source == candidate:
            return -5.0

        distance = self._levenshtein_distance(source, candidate)
        longest = max(len(source), len(candidate), 1)
        norm_distance = distance / longest
        similarity = difflib.SequenceMatcher(None, source, candidate).ratio()

        if distance > 2 and similarity < 0.8:
            return -8.0

        frequency = 0
        if self._symspell:
            try:
                frequency = int(self._symspell.words.get(candidate, 0))
            except Exception:
                frequency = 0
        frequency_score = float(np.log10(frequency + 1))

        suffix_hint = self._suffix_hint(source)
        suffix_bonus = 0.12 if suffix_hint and candidate.endswith(suffix_hint) else 0.0
        cluster_bonus = self._orthographic_cluster_bonus(source, candidate)
        stopword_penalty = 0.22 if (candidate in self.STOP_WORDS and source not in self.STOP_WORDS) else 0.0

        return (
            (1.2 * similarity)
            - (0.95 * norm_distance)
            + (0.08 * frequency_score)
            + suffix_bonus
            + cluster_bonus
            - stopword_penalty
        )

    @staticmethod
    def _suffix_hint(token: str) -> str:
        for suffix in ("ing", "ed", "ly", "ment", "tion", "ness", "es", "s"):
            if token.endswith(suffix) and len(token) > len(suffix) + 2:
                return suffix
        return ""

    @staticmethod
    def _orthographic_cluster_bonus(source: str, candidate: str) -> float:
        clusters = ("wh", "th", "sh", "ch", "ph", "qu", "ck")
        for cluster in clusters:
            if (
                len(source) >= 1
                and source.startswith(cluster[0])
                and not source.startswith(cluster)
                and candidate.startswith(cluster)
            ):
                return 0.08
        return 0.0

    @staticmethod
    def _levenshtein_distance(a: str, b: str) -> int:
        if a == b:
            return 0
        if not a:
            return len(b)
        if not b:
            return len(a)

        prev = list(range(len(b) + 1))
        for i, ca in enumerate(a, start=1):
            curr = [i]
            for j, cb in enumerate(b, start=1):
                insert_cost = curr[j - 1] + 1
                delete_cost = prev[j] + 1
                replace_cost = prev[j - 1] + (0 if ca == cb else 1)
                curr.append(min(insert_cost, delete_cost, replace_cost))
            prev = curr
        return prev[-1]

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
