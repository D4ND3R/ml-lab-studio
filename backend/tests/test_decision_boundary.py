from fastapi.testclient import TestClient

from app.main import app


def test_decision_boundary_with_sklearn_logistic_regression() -> None:
    client = TestClient(app)
    csv = (
        b"x,y,target\n"
        b"1.0,1.1,A\n1.2,0.9,A\n1.1,1.3,A\n"
        b"4.0,4.2,B\n4.1,3.9,B\n3.8,4.0,B\n"
    )
    dataset_id = client.post("/datasets/import", files={"file": ("points.csv", csv, "text/csv")}).json()["id"]
    session_id = client.post("/sessions", json={"name": "boundary"}).json()["session_id"]
    code = (
        "from sklearn.linear_model import LogisticRegression\n"
        "import pandas as pd\n"
        "df = pd.DataFrame({'x':[1.0,1.2,1.1,4.0,4.1,3.8],'y':[1.1,0.9,1.3,4.2,3.9,4.0],'target':['A','A','A','B','B','B']})\n"
        "model = LogisticRegression().fit(df[['x','y']], df['target'])"
    )
    client.post(f"/sessions/{session_id}/execute", json={"code": code, "timeout": 5})
    response = client.post(
        "/visualize/decision-boundary",
        json={
            "dataset_id": dataset_id,
            "session_id": session_id,
            "model_name": "model",
            "x_feature": "x",
            "y_feature": "y",
            "target_column": "target",
            "grid_size": 40,
        },
    )
    assert response.status_code == 200
    assert response.json()["type"] == "plotly"
