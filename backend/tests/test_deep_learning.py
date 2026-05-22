import importlib.util

from fastapi.testclient import TestClient

from app.main import app


def test_architecture_validation() -> None:
    client = TestClient(app)
    response = client.post(
        "/deep-learning/architectures/validate",
        json={"architecture": {"inputSize": 4, "outputSize": 3, "layers": [{"type": "linear", "units": 8}, {"type": "relu"}, {"type": "linear", "units": 3}]}},
    )
    assert response.status_code == 200
    assert response.json()["valid"] is True


def test_torch_detection() -> None:
    client = TestClient(app)
    response = client.get("/deep-learning/devices")
    assert response.status_code == 200
    assert "torch_available" in response.json()


def test_pytorch_mlp_training_only_if_torch_is_installed() -> None:
    if importlib.util.find_spec("torch") is None:
        return
    client = TestClient(app)
    csv = (
        b"f1,f2,target\n"
        b"0,0,A\n0,1,A\n1,0,B\n1,1,B\n0.1,0.2,A\n1.1,0.9,B\n"
        b"0.2,0.1,A\n0.9,1.2,B\n"
    )
    dataset_id = client.post("/datasets/import", files={"file": ("xor.csv", csv, "text/csv")}).json()["id"]
    response = client.post(
        "/deep-learning/train",
        json={
            "dataset_id": dataset_id,
            "architecture": {"inputSize": 2, "outputSize": 2, "layers": [{"type": "linear", "units": 6}, {"type": "relu"}, {"type": "linear", "units": 2}]},
            "target_column": "target",
            "feature_columns": ["f1", "f2"],
            "epochs": 2,
            "batch_size": 2,
        },
    )
    assert response.status_code == 200
    assert response.json()["ok"] is True
