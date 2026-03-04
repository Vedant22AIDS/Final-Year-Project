import re
from pathlib import Path
from typing import Any, Dict, Tuple
from urllib.parse import quote_plus

import pandas as pd
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError

from services.dataset_service import dataset_service


IDENTIFIER_PATTERN = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")


class DatabaseConnectorService:
    MAX_ROWS = 100000

    def _validate_identifier(self, value: str, field_name: str) -> str:
        clean_value = (value or "").strip()
        if not clean_value:
            raise ValueError(f"{field_name} is required")
        if not IDENTIFIER_PATTERN.match(clean_value):
            raise ValueError(f"Invalid {field_name}. Use only letters, numbers, and underscore.")
        return clean_value

    def _validate_payload(self, payload: Dict[str, Any]) -> Tuple[str, Dict[str, Any]]:
        db_type = str(payload.get("db_type", "")).strip().lower()
        if db_type not in {"postgresql", "mysql", "mssql", "sqlite"}:
            raise ValueError("Unsupported database type. Supported: postgresql, mysql, mssql, sqlite")
        return db_type, payload

    def _build_connection_url(self, db_type: str, payload: Dict[str, Any]) -> str:
        if db_type == "sqlite":
            sqlite_path = (payload.get("sqlite_path") or "").strip()
            if not sqlite_path:
                raise ValueError("SQLite file path is required")
            resolved_path = Path(sqlite_path).expanduser().resolve().as_posix()
            return f"sqlite:///{resolved_path}"

        host = (payload.get("host") or "").strip()
        database = (payload.get("database") or "").strip()
        username = (payload.get("username") or "").strip()
        password = payload.get("password") or ""
        port = str(payload.get("port") or "").strip()

        if not host:
            raise ValueError("Host is required")
        if not database:
            raise ValueError("Database is required")
        if not username:
            raise ValueError("Username is required")

        if db_type == "postgresql":
            driver = "postgresql+psycopg2"
            effective_port = port or "5432"
            return f"{driver}://{quote_plus(username)}:{quote_plus(password)}@{host}:{effective_port}/{database}"

        if db_type == "mysql":
            driver = "mysql+pymysql"
            effective_port = port or "3306"
            return f"{driver}://{quote_plus(username)}:{quote_plus(password)}@{host}:{effective_port}/{database}"

        if db_type == "mssql":
            effective_port = port or "1433"
            driver_name = quote_plus("ODBC Driver 17 for SQL Server")
            return (
                f"mssql+pyodbc://{quote_plus(username)}:{quote_plus(password)}@{host}:{effective_port}/{database}"
                f"?driver={driver_name}&TrustServerCertificate=yes"
            )

        raise ValueError("Unsupported database type")

    def _build_default_query(self, db_type: str, payload: Dict[str, Any]) -> str:
        table = self._validate_identifier(payload.get("table", ""), "table name")
        schema = (payload.get("schema") or "").strip()
        if db_type != "sqlite" and schema:
            schema = self._validate_identifier(schema, "schema")
            return f"SELECT * FROM {schema}.{table}"
        return f"SELECT * FROM {table}"

    def _normalize_query(self, db_type: str, payload: Dict[str, Any]) -> str:
        query = (payload.get("query") or "").strip()
        if not query:
            return self._build_default_query(db_type, payload)

        # Enforce a single read-only query.
        query = query.rstrip(";").strip()
        if ";" in query:
            raise ValueError("Only a single SQL statement is allowed")
        if not query.lower().startswith("select"):
            raise ValueError("Only SELECT queries are allowed")
        return query

    def _format_db_error(self, error: Exception) -> str:
        text_error = str(error)
        lower_error = text_error.lower()
        if "no module named" in lower_error:
            return f"Database driver is missing: {text_error}"
        if "could not connect" in lower_error or "connection refused" in lower_error:
            return "Connection failed. Check host/port/database credentials and database availability."
        if "login failed" in lower_error or "authentication failed" in lower_error:
            return "Authentication failed. Verify username and password."
        return text_error

    def test_connection(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        db_type, normalized_payload = self._validate_payload(payload)
        query = self._normalize_query(db_type, normalized_payload)
        connection_url = self._build_connection_url(db_type, normalized_payload)

        try:
            engine = create_engine(connection_url, pool_pre_ping=True, future=True)
            with engine.connect() as connection:
                connection.execute(text(query)).fetchmany(1)
            return {"ok": True, "query": query}
        except (SQLAlchemyError, ModuleNotFoundError, ImportError, OSError) as error:
            raise ValueError(self._format_db_error(error))

    def connect_and_import(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        db_type, normalized_payload = self._validate_payload(payload)
        query = self._normalize_query(db_type, normalized_payload)
        connection_url = self._build_connection_url(db_type, normalized_payload)
        source_name = f"{db_type}_{normalized_payload.get('table', 'dataset')}.csv"

        try:
            engine = create_engine(connection_url, pool_pre_ping=True, future=True)
            with engine.connect() as connection:
                dataframe = pd.read_sql_query(text(query), connection)
        except (SQLAlchemyError, ModuleNotFoundError, ImportError, OSError) as error:
            raise ValueError(self._format_db_error(error))

        if dataframe.empty:
            raise ValueError("Query returned no data")
        if len(dataframe.index) > self.MAX_ROWS:
            raise ValueError(f"Query returned {len(dataframe.index)} rows. Maximum supported rows: {self.MAX_ROWS}")

        dataset_data = dataset_service.create_dataset_from_dataframe(source_name, dataframe)
        dataset_data["query"] = query
        return dataset_data


database_connector_service = DatabaseConnectorService()
