import pytest


@pytest.mark.asyncio
async def test_register(client):
    response = await client.post("/api/auth/register", json={
        "email": "new@test.com",
        "username": "newuser",
        "password": "password123",
    })
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "newuser"
    assert data["email"] == "new@test.com"
    assert data["is_admin"] is False


@pytest.mark.asyncio
async def test_register_duplicate(client):
    response = await client.post("/api/auth/register", json={
        "email": "user@example.com",
        "username": "testuser",
        "password": "test123",
    })
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_login(client):
    response = await client.post("/api/auth/login", json={
        "username": "testuser",
        "password": "test123",
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_invalid(client):
    response = await client.post("/api/auth/login", json={
        "username": "testuser",
        "password": "wrong",
    })
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_me(client, user_token):
    response = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {user_token}"})
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "testuser"


@pytest.mark.asyncio
async def test_health(client):
    response = await client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
