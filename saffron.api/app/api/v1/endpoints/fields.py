# folders.py
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Dict
from app.db.mongodb import get_database
from bson import ObjectId
from app.services.security import get_current_username

router = APIRouter(prefix="/fields")

ALLOWED_TYPES = {"string", "number", "boolean", "date"}


class FieldRequest(BaseModel):
    category: str
    name: str
    type: str


class FieldResponse(BaseModel):
    category: str
    name: str
    type: str


class GroupedFieldResponse(BaseModel):
    category: str
    fields: List[Dict[str, str]]


@router.post("/", status_code=201)
async def create_field(
    field: FieldRequest,
    db=Depends(get_database),
    username: str = Depends(get_current_username),
):
    fields_col = db["fields"]

    if field.type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Invalid type")

    new_field = {"category": field.category, "name": field.name, "type": field.type}

    await fields_col.insert_one(new_field)
    return {"message": "Field created successfully"}


@router.get("/", response_model=List[GroupedFieldResponse])
async def list_fields(
    db=Depends(get_database),
    username: str = Depends(get_current_username),
):
    fields_col = db["fields"]

    pipeline = [
        {
            "$group": {
                "_id": "$category",
                "fields": {
                    "$push": {
                        "id": {"$toString": "$_id"},
                        "name": "$name",
                        "type": "$type",
                    }
                },
            }
        },
        {"$project": {"_id": 0, "category": "$_id", "fields": 1}},
    ]

    grouped_fields = await fields_col.aggregate(pipeline).to_list(length=None)
    return grouped_fields
