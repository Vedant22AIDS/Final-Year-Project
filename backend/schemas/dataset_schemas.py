from pydantic import BaseModel
from typing import Literal

class BalanceRequest(BaseModel):
    target: str
    method: Literal[
        "random_over",
        "random_under",
        "smote",
        "smote_tomek",
        "class_weight"
    ] = "random_over"
#Himanshi's contribution for class imbalance analysis and balancing