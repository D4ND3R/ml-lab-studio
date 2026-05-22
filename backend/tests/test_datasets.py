from fastapi.testclient import TestClient

from app.main import app


def test_import_csv() -> None:
    client = TestClient(app)
    files = {"file": ("tiny.csv", b"a,b,target\n1,2,A\n3,4,B\n", "text/csv")}
    response = client.post("/datasets/import", files=files)
    assert response.status_code == 200
    body = response.json()
    assert body["rows"] == 2
    assert body["columns"] == ["a", "b", "target"]
