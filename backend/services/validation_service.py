from typing import Any, Dict, List

import pandas as pd

from services.dataset_service import dataset_service


def execute_validation(dataset_id: str, rules: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    df: pd.DataFrame = dataset_service.get_dataframe(dataset_id)
    results: List[Dict[str, Any]] = []

    for rule in rules:
        rule_type = rule.get("type")
        column = rule.get("column")
        rule_id = rule.get("id")

        if column not in df.columns:
            results.append(
                {
                    "ruleId": rule_id,
                    "column": column,
                    "passed": False,
                    "failedCount": len(df),
                    "totalCount": len(df),
                    "error": "Column not found",
                }
            )
            continue

        if rule_type == "not_null":
            failed = int(df[column].isnull().sum())
        elif rule_type == "unique":
            failed = int(df[column].duplicated().sum())
        elif rule_type == "range":
            min_val = rule.get("params", {}).get("min")
            max_val = rule.get("params", {}).get("max")
            failed = 0
            if min_val is not None:
                failed += int((df[column] < min_val).sum())
            if max_val is not None:
                failed += int((df[column] > max_val).sum())
        elif rule_type == "regex":
            pattern = rule.get("params", {}).get("pattern")
            failed = int((~df[column].astype(str).str.match(pattern)).sum()) if pattern else len(df)
        else:
            failed = len(df)

        results.append(
            {
                "ruleId": rule_id,
                "column": column,
                "passed": failed == 0,
                "failedCount": failed,
                "totalCount": len(df),
            }
        )

    return results

