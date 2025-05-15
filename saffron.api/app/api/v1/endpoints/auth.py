from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from app.db.mongodb import get_database
from app.services.auth_service import hash_password, verify_password, create_access_token, decode_token
from bson import ObjectId
from datetime import datetime, timezone

router = APIRouter()

class RegisterRequest(BaseModel):
    username: str
    password: str

class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    token: str
    message: str

@router.post("/register")
async def register(request: RegisterRequest, db=Depends(get_database)):
    users = db['users']
    existing = await users.find_one({"username": request.username})

    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")

    hashed_pw = hash_password(request.password)
    await users.insert_one({
        "username": request.username,
        "password": hashed_pw,
        "created_at":  datetime.now(timezone.utc)
    })

    return {"message": "User registered successfully"}

@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest, db=Depends(get_database)):
    users = db['users']
    user = await users.find_one({"username": request.username})
    if not user or not verify_password(request.password, user['password']):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({
        "sub": str(user["_id"]),
        "username": user["username"]
    })

    return {"token": token, "message": "Login successful"}

@router.get("/me")
async def me(request: Request, db=Depends(get_database)):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authorization header missing or invalid")
    
    token = auth_header.split(" ")[1]
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = await db['users'].find_one({"_id": ObjectId(payload["sub"])})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user["_id"] = str(user["_id"])
    del user["password"]
    return user
