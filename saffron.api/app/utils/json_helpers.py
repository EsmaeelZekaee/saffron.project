from datetime import date
from bson import ObjectId
from typing import Any

def serialize_mongo(data: Any) -> Any:
    """Convert MongoDB-specific types like ObjectId to a serializable format"""
    if isinstance(data, list):
        return [serialize_mongo(item) for item in data]
    elif isinstance(data, dict):
        return {key: serialize_mongo(value) for key, value in data.items()}
    elif isinstance(data, ObjectId):
        return str(data)  # Convert ObjectId to string
    elif isinstance(data, date):
        return str(data)  
    return data
