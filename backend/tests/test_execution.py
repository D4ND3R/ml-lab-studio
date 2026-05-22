from fastapi.testclient import TestClient

from app.main import app


def test_execute_simple_python_code() -> None:
    client = TestClient(app)
    session_id = client.post("/sessions", json={"name": "test"}).json()["session_id"]
    response = client.post(f"/sessions/{session_id}/execute", json={"code": "x = 2\nx + 3", "timeout": 5})
    assert response.status_code == 200
    body = response.json()
    assert body["outputs"][0]["value"] == 5


def test_execute_pandas_dataframe() -> None:
    client = TestClient(app)
    session_id = client.post("/sessions", json={"name": "df"}).json()["session_id"]
    code = "import pandas as pd\npd.DataFrame({'a': [1, 2], 'b': [3, 4]})"
    response = client.post(f"/sessions/{session_id}/execute", json={"code": code, "timeout": 5})
    assert response.status_code == 200
    output = response.json()["outputs"][0]
    assert output["type"] == "dataframe"
    assert output["shape"] == [2, 2]
