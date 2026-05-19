import pytest
import io


@pytest.mark.asyncio
async def test_upload_invalid_format(client, user_token):
    response = await client.post(
        "/api/transcription/upload",
        files={"file": ("test.txt", b"hello", "text/plain")},
        data={"language": "auto"},
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_upload_valid(client, user_token):
    response = await client.post(
        "/api/transcription/upload",
        files={"file": ("test.mp3", io.BytesIO(b"fake audio content"), "audio/mpeg")},
        data={"language": "auto"},
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "task_id" in data
    assert data["status"] == "uploaded"


@pytest.mark.asyncio
async def test_list_tasks(client, user_token):
    response = await client.get("/api/transcription/tasks", headers={"Authorization": f"Bearer {user_token}"})
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data


@pytest.mark.asyncio
async def test_get_task_not_found(client, user_token):
    response = await client.get("/api/transcription/tasks/9999", headers={"Authorization": f"Bearer {user_token}"})
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_export_no_auth(client):
    response = await client.get("/api/export/1/txt")
    assert response.status_code == 401
