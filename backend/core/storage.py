import threading
from typing import Any, Dict


class DatasetStorage:
    """Thread-safe in-memory storage for datasets and processing state."""

    def __init__(self) -> None:
        self.datasets: Dict[str, Dict[str, Any]] = {}
        self.processing_status: Dict[str, Dict[str, Any]] = {}
        self.lock = threading.Lock()


dataset_storage = DatasetStorage()

