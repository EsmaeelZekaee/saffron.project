from multiprocessing import context
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import JSONResponse
from app.services.security import get_current_username
from app.models.folder_model import FolderCreate, FolderUpdate
from app.db.mongodb import get_database
from bson import ObjectId, errors
from app.utils.json_helpers import serialize_mongo
from fastapi import Response

router = APIRouter()

ALLOWED_EXTENSIONS = {"pdf", "jpg", "png"}


# Helper function
def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@router.get("/folders", response_model=dict)
async def list_folders(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, gt=0, le=100),
    db=Depends(get_database),
    username: str = Depends(get_current_username),
):
    """List folders with pagination"""
    folders_col = db["folders"]
    cursor = (
        folders_col.find({"username": username, "is_active":True}, {"is_active": 0, "username": 0})
        # .skip(skip)
        # .limit(limit)
    )
    folders = await cursor.to_list(length=limit)

    total = await folders_col.count_documents({"username": username})

    return JSONResponse(
        content={
            "message": "User Folders Scanned",
            "folders": serialize_mongo(folders),
            "total": total,
            "skip": skip,
            "limit": limit,
        },
        status_code=200,
    )


@router.post("/folders", response_model=dict)
async def create_folder(
    data: FolderCreate,
    db=Depends(get_database),
    username: str = Depends(get_current_username),
):
    """Create a new folder"""
    folders_col = db["folders"]
    name = data.name
    parent_id = data.parent_id

    if not name:
        raise HTTPException(status_code=400, detail="Empty name not allowed")

    if parent_id:
        try:
            parent_oid = ObjectId(parent_id)
        except errors.InvalidId:
            raise HTTPException(status_code=400, detail="Invalid parent_id format")
        parent = folders_col.find_one({"_id": parent_oid, "username": username})
        if not parent:
            raise HTTPException(status_code=404, detail="Parent folder not found")
    else:
        parent_oid = None

    record = {
        "username": username,
        "name": name,
        "parent_id": parent_oid,
        "is_active": True,
    }

    result = await folders_col.insert_one(record)
    created = await folders_col.find_one({"_id": result.inserted_id})

    return JSONResponse(
        content={"message": "Folder Created", "folder": serialize_mongo(created)},
        status_code=201,
    )


@router.delete("/folders/{folder_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_folder(
    folder_id: str,
    db=Depends(get_database),
    username: str = Depends(get_current_username),
):
    """Soft delete a folder"""
    folders_col = db["folders"]

    if not folder_id:
        raise HTTPException(status_code=404, detail="Folder not found")

    try:
        oid = ObjectId(folder_id)
    except errors.InvalidId:
        raise HTTPException(status_code=400, detail="Invalid ID format")

    filter_query = {"_id": oid, "username": username}
    update_fields = {"$set": {"is_active": False}}

    result = await folders_col.update_one(filter_query, update_fields)
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Folder not found")

    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/folders/{folder_id}", response_model=dict)
async def get_folder(
    folder_id: str,
    db=Depends(get_database),
    username: str = Depends(get_current_username),
):
    """Get a folder by ID"""
    folders_col = db["folders"]

    try:
        oid = ObjectId(folder_id)
    except errors.InvalidId:
        raise HTTPException(status_code=400, detail="Invalid ID format")

    folder = await folders_col.find_one({"_id": oid, "username": username})
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    return JSONResponse(
        content={"message": "Folder found", "folder": serialize_mongo(folder)},
        status_code=200,
    )


@router.put("/folders/{folder_id}", response_model=dict)
async def update_folder(
    folder_id: str,
    data: FolderUpdate,
    db=Depends(get_database),
    username: str = Depends(get_current_username),
):
    """Update a folder"""
    folders_col = db["folders"]
    name = data.name
    is_active = data.is_active

    if not name:
        raise HTTPException(status_code=400, detail="Empty name not allowed")

    try:
        oid = ObjectId(folder_id)
    except errors.InvalidId:
        raise HTTPException(status_code=400, detail="Invalid ID format")

    filter_query = {"_id": oid, "username": username}
    update_fields = {"$set": {"name": name, "is_active": is_active}}

    result = await folders_col.update_one(filter_query, update_fields)
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Folder not found")
    return JSONResponse(
        content={"message": "Folder Updated", "modified_count": result.modified_count},
        status_code=201,
    )
