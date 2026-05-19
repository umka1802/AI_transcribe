import pytest


@pytest.mark.asyncio
async def test_admin_users(client, admin_token):
    response = await client.get("/api/admin/users", headers={"Authorization": f"Bearer {admin_token}"})
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 2


@pytest.mark.asyncio
async def test_admin_users_forbidden(client, user_token):
    response = await client.get("/api/admin/users", headers={"Authorization": f"Bearer {user_token}"})
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_admin_dashboard(client, admin_token):
    response = await client.get("/api/admin/dashboard", headers={"Authorization": f"Bearer {admin_token}"})
    assert response.status_code == 200
    data = response.json()
    assert "total_users" in data
    assert "total_tasks" in data


@pytest.mark.asyncio
async def test_admin_settings(client, admin_token):
    response = await client.get("/api/admin/settings", headers={"Authorization": f"Bearer {admin_token}"})
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_admin_logs(client, admin_token):
    response = await client.get("/api/admin/logs", headers={"Authorization": f"Bearer {admin_token}"})
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_admin_task_stats(client, admin_token):
    response = await client.get("/api/admin/tasks/stats", headers={"Authorization": f"Bearer {admin_token}"})
    assert response.status_code == 200
    data = response.json()
    assert "total" in data
    assert "by_status" in data


@pytest.mark.asyncio
async def test_admin_update_user(client, admin_token):
    response = await client.patch("/api/admin/users/2", json={"is_active": False}, headers={"Authorization": f"Bearer {admin_token}"})
    assert response.status_code == 200
    assert response.json()["is_active"] is False
