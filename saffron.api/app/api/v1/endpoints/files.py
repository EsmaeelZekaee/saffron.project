import os
import uuid
import datetime
from typing import Optional, List

from fastapi import APIRouter, File, UploadFile, Form, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from pydantic import BaseModel
from bson import ObjectId
from pymongo.collection import Collection
from datetime import datetime, timezone
from app.services.security import get_current_username
from app.db.mongodb import get_database

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
def create_file(
    title: str = Form(...),
    folder_id: str = Form(...),
    file: UploadFile = File(...),
    db=Depends(get_database),
    username: str = Depends(get_current_username)
):
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

    ext = file.filename.rsplit(".", 1)[1].lower()
    saved_name = f"{uuid.uuid4()}.{ext}"
    save_path = os.path.join(user_folder, saved_name)

    with open(save_path, "wb") as buffer:
        buffer.write(file.file.read())

    record = {
        "username": username,
        "folder_id": folder_oid,
        "original_filename": file.filename,
        "saved_filename": saved_name,
        "upload_path": save_path,
        "title": title,
        "uploaded_at": datetime.now(timezone.utc)
    }

    result = db["files"].insert_one(record)
    record["_id"] = str(result.inserted_id)

    return {"message": "File uploaded", "file": record}

@router.get("/files", response_model=dict)
def list_files(
    page: int = Query(1, gt=0),
    page_size: int = Query(10, gt=0),
    search: Optional[str] = Query(None),
    sort_by: str = Query("uploaded_at"),
    sort_desc: bool = Query(False),
    db=Depends(get_database),
    username: str = Depends(get_current_username)
):
    query = {"username": username}
    if search:
        query["$or"] = [
            {"original_filename": {"$regex": search, "$options": "i"}},
            {"title": {"$regex": search, "$options": "i"}},
        ]

    sort_dir = -1 if sort_desc else 1
    skip = (page - 1) * page_size

    total = db["files"].count_documents(query)
    docs = db["files"].find(query).sort(sort_by, sort_dir).skip(skip).limit(page_size)

    items = []
    for d in docs:
        items.append({
            "id": str(d["_id"]),
            "original_filename": d["original_filename"],
            "saved_filename": d["saved_filename"],
            "title": d.get("title", ""),
            "uploaded_at": d["uploaded_at"].isoformat() + "Z",
            "download_url": f"files/download/{d['saved_filename']}"
        })

    return {"total": total, "items": items}

@router.get("/files/download/{filename}")
def download_file(
    filename: str,
    username: str = Depends(get_current_username)
):
    file_path = os.path.join(UPLOAD_ROOT, username, filename)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(path=file_path, filename=filename, media_type='application/octet-stream')
