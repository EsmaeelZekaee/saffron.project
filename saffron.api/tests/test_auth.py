import pytest
from httpx import AsyncClient, ASGITransport
from bson import ObjectId
from app.main import app  # یا هرجایی که FastAPI app شما تعریف شده
from datetime import datetime
from pytest_asyncio import fixture
# conftest.py
import pytest
from app.db.mongodb import get_database

@fixture
def test_db():
    import motor.motor_asyncio
    client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["test_db"]
    # تزریق به FastAPI
    from app.main import app
    app.dependency_overrides[get_database] = lambda: db
    return db


@pytest.mark.asyncio
async def test_register_and_login_and_me(test_db):
    client = AsyncClient(transport=ASGITransport(app=app), base_url="http://test")

    # Override دیتابیس
    db = test_db
    users = db["users"]

    # پاک کردن کاربر قبلی
    await users.delete_many({"username": "testuser"})

    # --- Test Register ---
    res = await client.post("/register", json={
        "username": "testuser",
        "password": "testpass"
    })
    assert res.status_code == 200
    assert res.json()["message"] == "User registered successfully"

    # --- Test Login ---
    res = await client.post("/login", json={
        "username": "testuser",
        "password": "testpass"
    })
    assert res.status_code == 200
    data = res.json()
    assert "token" in data
    token = data["token"]

    # --- Test /me ---
    res = await client.get("/me", headers={
        "Authorization": f"Bearer {token}"
    })
    assert res.status_code == 200
    me_data = res.json()
    assert me_data["username"] == "testuser"
    assert "_id" in me_data
    assert "password" not in me_data
