import psycopg2
from psycopg2.extras import RealDictCursor, Json
from psycopg2.pool import SimpleConnectionPool
from contextlib import contextmanager
from config import get_settings
from typing import Optional, List, Dict, Any
import json

settings = get_settings()


class Database:
    """Database connection manager for PostgreSQL"""

    _pool: Optional[SimpleConnectionPool] = None

    @classmethod
    def get_pool(cls) -> SimpleConnectionPool:
        """Get or create connection pool"""
        if cls._pool is None:
            cls._pool = SimpleConnectionPool(
                1,  # min connections
                10,  # max connections
                settings.database_url
            )
        return cls._pool

    @classmethod
    @contextmanager
    def get_connection(cls):
        """Get a database connection from the pool"""
        pool = cls.get_pool()
        conn = pool.getconn()
        try:
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            pool.putconn(conn)

    @classmethod
    def execute_query(
        cls,
        query: str,
        params: tuple = None,
        fetch_one: bool = False,
        fetch_all: bool = False
    ) -> Optional[Any]:
        """Execute a SQL query and return results"""
        with cls.get_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute(query, params or ())

                if fetch_one:
                    result = cursor.fetchone()
                    return dict(result) if result else None
                elif fetch_all:
                    results = cursor.fetchall()
                    return [dict(row) for row in results]
                else:
                    return cursor.rowcount

    @classmethod
    def close_pool(cls):
        """Close all connections in the pool"""
        if cls._pool:
            cls._pool.closeall()
            cls._pool = None


# Table helper class for query building
class Table:
    """Helper class for building database queries"""

    def __init__(self, table_name: str):
        self.table_name = table_name
        self._select_cols = "*"
        self._where_clauses = []
        self._where_params = []
        self._order_by = None
        self._limit_val = None
        self._offset_val = None

    def select(self, columns: str = "*"):
        """Set columns to select"""
        self._select_cols = columns
        return self

    def eq(self, column: str, value: Any):
        """Add equality filter"""
        self._where_clauses.append(f"{column} = %s")
        self._where_params.append(value)
        return self

    def neq(self, column: str, value: Any):
        """Add not equal filter"""
        self._where_clauses.append(f"{column} != %s")
        self._where_params.append(value)
        return self

    def gt(self, column: str, value: Any):
        """Add greater than filter"""
        self._where_clauses.append(f"{column} > %s")
        self._where_params.append(value)
        return self

    def gte(self, column: str, value: Any):
        """Add greater than or equal filter"""
        self._where_clauses.append(f"{column} >= %s")
        self._where_params.append(value)
        return self

    def lt(self, column: str, value: Any):
        """Add less than filter"""
        self._where_clauses.append(f"{column} < %s")
        self._where_params.append(value)
        return self

    def lte(self, column: str, value: Any):
        """Add less than or equal filter"""
        self._where_clauses.append(f"{column} <= %s")
        self._where_params.append(value)
        return self

    def order(self, column: str, desc: bool = False):
        """Set order by clause"""
        direction = "DESC" if desc else "ASC"
        self._order_by = f"{column} {direction}"
        return self

    def limit(self, count: int):
        """Set limit"""
        self._limit_val = count
        return self

    def offset(self, count: int):
        """Set offset"""
        self._offset_val = count
        return self

    def range(self, start: int, end: int):
        """Set range (limit and offset)"""
        self._limit_val = end - start + 1
        self._offset_val = start
        return self

    def execute(self) -> Dict[str, Any]:
        """Execute the query and return results"""
        # Build query
        query = f"SELECT {self._select_cols} FROM {self.table_name}"

        if self._where_clauses:
            query += " WHERE " + " AND ".join(self._where_clauses)

        if self._order_by:
            query += f" ORDER BY {self._order_by}"

        if self._limit_val:
            query += f" LIMIT {self._limit_val}"

        if self._offset_val:
            query += f" OFFSET {self._offset_val}"

        # Execute query
        data = Database.execute_query(query, tuple(self._where_params), fetch_all=True)

        return {"data": data or [], "count": len(data) if data else 0}

    def insert(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Insert a record"""
        columns = list(data.keys())
        values = list(data.values())

        # Convert dict/list to JSON for JSONB columns
        values = [
            Json(v) if isinstance(v, (dict, list)) else v
            for v in values
        ]

        placeholders = ", ".join(["%s"] * len(values))
        columns_str = ", ".join(columns)

        query = f"""
            INSERT INTO {self.table_name} ({columns_str})
            VALUES ({placeholders})
            RETURNING *
        """

        result = Database.execute_query(query, tuple(values), fetch_one=True)
        return {"data": [result] if result else []}

    def update(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Update records"""
        set_clauses = []
        params = []

        for key, value in data.items():
            set_clauses.append(f"{key} = %s")
            # Convert dict/list to JSON for JSONB columns
            if isinstance(value, (dict, list)):
                params.append(Json(value))
            else:
                params.append(value)

        query = f"UPDATE {self.table_name} SET {', '.join(set_clauses)}"

        if self._where_clauses:
            query += " WHERE " + " AND ".join(self._where_clauses)
            params.extend(self._where_params)

        query += " RETURNING *"

        result = Database.execute_query(query, tuple(params), fetch_all=True)
        return {"data": result or []}

    def delete(self) -> Dict[str, Any]:
        """Delete records"""
        query = f"DELETE FROM {self.table_name}"

        if self._where_clauses:
            query += " WHERE " + " AND ".join(self._where_clauses)

        query += " RETURNING *"

        result = Database.execute_query(query, tuple(self._where_params), fetch_all=True)
        return {"data": result or []}


def get_db():
    """Dependency for getting database connection (for compatibility)"""
    return DatabaseClient()


class DatabaseClient:
    """Database client with table() method for compatibility"""

    def table(self, table_name: str) -> Table:
        """Get a table query builder"""
        return Table(table_name)
