import pytest
from pytest_asyncio import fixture
from httpx import AsyncClient, ASGITransport
from motor.motor_asyncio import AsyncIOMotorClient

from app.main import app
from app.db.mongodb import get_database
from app.services.security import get_current_username


# ---------- Fixtures ----------
@fixture
async def test_db():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["test_db"]

    # ایجاد کاربر تستی که jwt بهش ارجاع می‌ده
    await db["users"].insert_one({
        "_id": "000000000000000000000001",  # معادل ObjectId("000...001")
        "username": "testuser"
    })

    yield db
    await client.drop_database("test_db")


@fixture(autouse=True)
async def override_db(test_db):
    app.dependency_overrides[get_database] = lambda: test_db


@fixture(autouse=True)
def override_user_auth():
    async def fake_get_current_username(token: str = None, db=None):
        return "testuser"

    app.dependency_overrides[get_current_username] = fake_get_current_username


# ---------- Test ----------
@pytest.mark.asyncio
async def test_create_folder():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test/api/v1") as ac:
        response = await ac.post(
            "/folders",
            json={"name": "Test Folder", "parent_id": None},
            headers={"Authorization": "Bearer faketoken"}  # مقدارش مهم نیست چون override شده
        )

    print(response.status_code)
    print(response.text)

    assert response.status_code == 201
    data = response.json()
    assert data["message"] == "Folder Created"
    assert "folder" in data

@pytest.mark.asyncio
async def test_list_folders():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test/api/v1") as ac:
        response = await ac.get("/folders?skip=0&limit=20", headers={"Authorization": "Bearer fake"})
    assert response.status_code == 200
    data = response.json()
    assert "folders" in data
    assert isinstance(data["folders"], list)


@pytest.mark.asyncio
async def test_get_folder(test_db):
    transport = ASGITransport(app=app)
    db = test_db
    col = db["folders"]
    folder = {"username": "testuser", "name": "Folder 1", "parent_id": None, "is_active": True}
    result = await col.insert_one(folder)
    async with AsyncClient(transport=transport, base_url="http://test/api/v1") as ac:
        response = await ac.get(f"/folders/{str(result.inserted_id)}", headers={"Authorization": "Bearer fake"})
    assert response.status_code == 200
    assert "folder" in response.json()


@pytest.mark.asyncio
async def test_update_folder(test_db):
    transport = ASGITransport(app=app)
    db = test_db
    col = db["folders"]
    folder = {"username": "testuser", "name": "Old Name", "parent_id": None, "is_active": True}
    result = await col.insert_one(folder)

    async with AsyncClient(transport=transport, base_url="http://test/api/v1") as ac:
        response = await ac.put(
            f"/folders/{str(result.inserted_id)}",
            json={"name": "Updated Name", "is_active": True},
            headers={"Authorization": "Bearer fake"}
        )
    assert response.status_code == 201
    assert response.json()["message"] == "Folder Updated"


@pytest.mark.asyncio
async def test_delete_folder(test_db):
    transport = ASGITransport(app=app)
    db = test_db
    col = db["folders"]
    folder = {"username": "testuser", "name": "To Delete", "parent_id": None, "is_active": True}
    result = await col.insert_one(folder)

    async with AsyncClient(transport=transport, base_url="http://test/api/v1") as ac:
        response = await ac.delete(f"/folders?folder_id={str(result.inserted_id)}", headers={"Authorization": "Bearer fake"})
    assert response.status_code == 204

    updated = await col.find_one({"_id": result.inserted_id})
    assert updated["is_active"] is False
