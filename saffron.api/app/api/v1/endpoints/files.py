import os
import uuid
import datetime
from typing import Optional, List

from fastapi import APIRouter, File, UploadFile, Form, Depends, HTTPException, Query
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from bson import ObjectId
from pymongo.collection import Collection
from datetime import datetime, timezone
from app.services.security import get_current_username
from app.db.mongodb import get_database
from app.utils.json_helpers import serialize_mongo
import hashlib

UPLOAD_ROOT = "static/forms"
ALLOWED_EXTENSIONS = {"pdf", "jpg", "png"}

router = APIRouter(prefix="/media", tags=["Files"])


def allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


class FileItem(BaseModel):
    id: str
    original_filename: str
    saved_filename: str
    title: Optional[str]
    uploaded_at: str
    download_url: str


@router.post("/files", response_model=dict)
async def create_file(
    title: str = Form(...),
    folder_id: str = Form(...),
    file: UploadFile = File(...),
    db=Depends(get_database),
    username: str = Depends(get_current_username),
):
    files_col = db["files"]

    if not allowed_file(file.filename):
        raise HTTPException(status_code=400, detail="File type not allowed")

    if not title:
        raise HTTPException(status_code=400, detail="Empty title not allowed")

    try:
        folder_oid = ObjectId(folder_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid folder ID")

    user_folder = os.path.join(UPLOAD_ROOT, username)
    os.makedirs(user_folder, exist_ok=True)

    file_contents = file.file.read()
    checksum = hashlib.sha256(file_contents).hexdigest()
    existing_file = await files_col.find_one(
        {"checksum": checksum, "username": username}
    )
    if existing_file:
        raise HTTPException(status_code=409, detail="Duplicate file upload detected.")

    ext = file.filename.rsplit(".", 1)[1].lower()
    saved_name = f"{uuid.uuid4()}.{ext}"
    save_path = os.path.join(user_folder, saved_name)

    with open(save_path, "wb") as buffer:
        buffer.write(file_contents)

    record = {
        "username": username,
        "folder_id": folder_oid,
        "original_filename": file.filename,
        "saved_filename": saved_name,
        "upload_path": save_path,
        "title": title,
        "checksum": checksum,
        "uploaded_at": datetime.now(timezone.utc),
    }

    result = await files_col.insert_one(record)
    created = await files_col.find_one({"_id": result.inserted_id})

    return JSONResponse(
        content={"message": "File uploaded", "file": serialize_mongo(created)},
        status_code=201,
    )


@router.get("/files", response_model=dict)
async def list_files(
    folder_id: str = Query(),
    skip: int = Query(0, ge=0),
    limit: int = Query(500, gt=0, le=500),
    db=Depends(get_database),
    username: str = Depends(get_current_username),
):

    try:
        folder_oid = ObjectId(folder_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid folder ID")

    files_col = db["files"]
    query = {"username": username, "folder_id": folder_oid}

    cursor = files_col.find(query).sort("uploaded_at", -1).limit(skip).limit(limit)
    files = await cursor.to_list(length=limit)
    total = await files_col.count_documents(query)
    return JSONResponse(
        content={
            "message": "User Folders Scanned",
            "files": serialize_mongo(files),
            "total": total,
            "skip": skip,
            "limit": limit,
        },
        status_code=200,
    )


@router.get("/files/last", response_model=dict)
async def list_files(
    folder_id: str = Query(),
    db=Depends(get_database),
    username: str = Depends(get_current_username),
):

    try:
        folder_oid = ObjectId(folder_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid folder ID")

    files_col = db["files"]
    query = {"username": username, "folder_id": folder_oid}

    last_file = await files_col.find_one(query, sort=[("uploaded_at", -1)])

    return JSONResponse(
        content={
            "message": "Last file version",
            "file": serialize_mongo(last_file),
        },
        status_code=200,
    )


@router.get("/files/download/{username}/{filename}")
def download_file(filename: str, username: str):
    file_path = os.path.join(UPLOAD_ROOT, username, filename)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    response = FileResponse(
        path=file_path,
        filename=filename,
        media_type="application/octet-stream"
    )
    
    response.headers["Access-Control-Allow-Origin"] = "*"
    return response
    
