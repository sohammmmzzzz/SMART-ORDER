import sqlite3
from contextlib import contextmanager
from typing import Optional, List, Dict, Any
import json
import uuid

class Database:
    """Database connection manager for SQLite"""

    _db_path: str = "smart_pantry.db"

    @classmethod
    def set_db_path(cls, path: str):
        """Set the database file path"""
        cls._db_path = path

    @classmethod
    @contextmanager
    def get_connection(cls):
        """Get a database connection"""
        conn = sqlite3.connect(cls._db_path)
        conn.row_factory = sqlite3.Row  # Return rows as dictionaries
        try:
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()

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
            cursor = conn.cursor()
            cursor.execute(query, params or ())

            if fetch_one:
                result = cursor.fetchone()
                return dict(result) if result else None
            elif fetch_all:
                results = cursor.fetchall()
                return [dict(row) for row in results]
            else:
                return cursor.rowcount


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
        # SQLite doesn't support PostgreSQL-style joins in select
        # Extract just the columns, ignore the join syntax
        if "!" in columns:
            # For now, just select everything and we'll handle joins differently
            self._select_cols = "*"
        else:
            self._select_cols = columns
        return self

    def eq(self, column: str, value: Any):
        """Add equality filter"""
        self._where_clauses.append(f"{column} = ?")
        self._where_params.append(value)
        return self

    def neq(self, column: str, value: Any):
        """Add not equal filter"""
        self._where_clauses.append(f"{column} != ?")
        self._where_params.append(value)
        return self

    def gt(self, column: str, value: Any):
        """Add greater than filter"""
        self._where_clauses.append(f"{column} > ?")
        self._where_params.append(value)
        return self

    def gte(self, column: str, value: Any):
        """Add greater than or equal filter"""
        self._where_clauses.append(f"{column} >= ?")
        self._where_params.append(value)
        return self

    def lt(self, column: str, value: Any):
        """Add less than filter"""
        self._where_clauses.append(f"{column} < ?")
        self._where_params.append(value)
        return self

    def lte(self, column: str, value: Any):
        """Add less than or equal filter"""
        self._where_clauses.append(f"{column} <= ?")
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

        # Handle JSON columns - parse them back to dicts/lists
        if data:
            for row in data:
                # Parse JSON columns if they exist
                if 'items' in row and isinstance(row['items'], str):
                    try:
                        row['items'] = json.loads(row['items'])
                    except:
                        pass

        return {"data": data or [], "count": len(data) if data else 0}

    def insert(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Insert a record"""
        columns = list(data.keys())
        values = list(data.values())

        # Convert dict/list to JSON string for JSON columns
        values = [
            json.dumps(v) if isinstance(v, (dict, list)) else v
            for v in values
        ]

        # Add UUID if not provided
        if 'id' not in columns:
            columns.insert(0, 'id')
            values.insert(0, str(uuid.uuid4()))

        placeholders = ", ".join(["?"] * len(values))
        columns_str = ", ".join(columns)

        query = f"""
            INSERT INTO {self.table_name} ({columns_str})
            VALUES ({placeholders})
        """

        with Database.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query, tuple(values))

            # Get the inserted row
            last_id = cursor.lastrowid
            cursor.execute(f"SELECT * FROM {self.table_name} WHERE rowid = ?", (last_id,))
            result = cursor.fetchone()

            if result:
                result_dict = dict(result)
                # Parse JSON columns
                if 'items' in result_dict and isinstance(result_dict['items'], str):
                    try:
                        result_dict['items'] = json.loads(result_dict['items'])
                    except:
                        pass
                return {"data": [result_dict]}

        return {"data": []}

    def update(self, data: Dict[str, Any]):
        """Update records"""
        set_clauses = []
        params = []

        for key, value in data.items():
            set_clauses.append(f"{key} = ?")
            # Convert dict/list to JSON string
            if isinstance(value, (dict, list)):
                params.append(json.dumps(value))
            else:
                params.append(value)

        query = f"UPDATE {self.table_name} SET {', '.join(set_clauses)}"

        if self._where_clauses:
            query += " WHERE " + " AND ".join(self._where_clauses)
            params.extend(self._where_params)

        with Database.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query, tuple(params))

            # Get updated rows
            if self._where_clauses:
                select_query = f"SELECT * FROM {self.table_name} WHERE " + " AND ".join(self._where_clauses)
                cursor.execute(select_query, tuple(self._where_params))
            else:
                cursor.execute(f"SELECT * FROM {self.table_name}")

            results = cursor.fetchall()
            result_list = []
            for row in results:
                row_dict = dict(row)
                # Parse JSON columns
                if 'items' in row_dict and isinstance(row_dict['items'], str):
                    try:
                        row_dict['items'] = json.loads(row_dict['items'])
                    except:
                        pass
                result_list.append(row_dict)

            return {"data": result_list}

    def delete(self) -> Dict[str, Any]:
        """Delete records"""
        query = f"DELETE FROM {self.table_name}"

        if self._where_clauses:
            query += " WHERE " + " AND ".join(self._where_clauses)

        with Database.get_connection() as conn:
            cursor = conn.cursor()

            # Get rows before deleting
            if self._where_clauses:
                select_query = f"SELECT * FROM {self.table_name} WHERE " + " AND ".join(self._where_clauses)
                cursor.execute(select_query, tuple(self._where_params))
            else:
                cursor.execute(f"SELECT * FROM {self.table_name}")

            results = cursor.fetchall()
            result_list = [dict(row) for row in results]

            # Now delete
            cursor.execute(query, tuple(self._where_params))

            return {"data": result_list}


def get_db():
    """Dependency for getting database connection (for compatibility)"""
    return DatabaseClient()


class DatabaseClient:
    """Database client with table() method for compatibility"""

    def table(self, table_name: str) -> Table:
        """Get a table query builder"""
        return Table(table_name)
