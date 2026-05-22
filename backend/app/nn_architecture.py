from __future__ import annotations

from typing import Any


SUPPORTED_LAYER_TYPES = {
    "linear",
    "relu",
    "sigmoid",
    "tanh",
    "softmax",
    "dropout",
    "batchnorm1d",
    "flatten",
}


def validate_architecture(architecture: dict[str, Any]) -> dict[str, Any]:
    errors: list[str] = []
    warnings: list[str] = []
    input_size = architecture.get("inputSize")
    output_size = architecture.get("outputSize")
    layers = architecture.get("layers", [])

    if not isinstance(input_size, int) or input_size <= 0:
        errors.append("inputSize must be a positive integer.")
    if not isinstance(output_size, int) or output_size <= 0:
        errors.append("outputSize must be a positive integer.")
    if not isinstance(layers, list) or not layers:
        errors.append("At least one layer is required.")

    last_units = input_size if isinstance(input_size, int) else None
    linear_count = 0
    for index, layer in enumerate(layers):
        layer_type = str(layer.get("type", "")).lower()
        if layer_type not in SUPPORTED_LAYER_TYPES:
            errors.append(f"Layer {index + 1} uses unsupported type {layer_type}.")
        if layer_type == "linear":
            linear_count += 1
            units = layer.get("units")
            if not isinstance(units, int) or units <= 0:
                errors.append(f"Linear layer {index + 1} must define positive units.")
            last_units = units
        if layer_type == "dropout":
            rate = layer.get("rate", 0.2)
            if not isinstance(rate, (int, float)) or rate < 0 or rate >= 1:
                errors.append(f"Dropout layer {index + 1} must use rate between 0 and 1.")
    if linear_count == 0:
        errors.append("The MVP PyTorch generator needs at least one Linear layer.")
    if last_units and output_size and last_units != output_size:
        warnings.append("The final Linear layer units differ from outputSize; generated code will use the layer definition.")

    parameter_count = estimate_parameters(architecture)
    return {"valid": not errors, "errors": errors, "warnings": warnings, "parameter_count": parameter_count}


def estimate_parameters(architecture: dict[str, Any]) -> int:
    total = 0
    previous = architecture.get("inputSize")
    for layer in architecture.get("layers", []):
        layer_type = str(layer.get("type", "")).lower()
        if layer_type == "linear" and isinstance(previous, int):
            units = int(layer.get("units", 0))
            total += previous * units + units
            previous = units
        elif layer_type == "batchnorm1d" and isinstance(previous, int):
            total += previous * 2
    return total


def generate_pytorch_code(architecture: dict[str, Any], class_name: str = "GeneratedMLP") -> str:
    validation = validate_architecture(architecture)
    if not validation["valid"]:
        raise ValueError("; ".join(validation["errors"]))

    lines = [
        "import torch",
        "from torch import nn",
        "from torch.utils.data import DataLoader, TensorDataset",
        "",
        "",
        f"class {class_name}(nn.Module):",
        "    def __init__(self):",
        "        super().__init__()",
        "        self.net = nn.Sequential(",
    ]
    previous = architecture["inputSize"]
    for layer in architecture["layers"]:
        layer_type = str(layer["type"]).lower()
        if layer_type == "linear":
            units = int(layer["units"])
            lines.append(f"            nn.Linear({previous}, {units}),")
            previous = units
        elif layer_type == "relu":
            lines.append("            nn.ReLU(),")
        elif layer_type == "sigmoid":
            lines.append("            nn.Sigmoid(),")
        elif layer_type == "tanh":
            lines.append("            nn.Tanh(),")
        elif layer_type == "softmax":
            lines.append("            nn.Softmax(dim=1),")
        elif layer_type == "dropout":
            lines.append(f"            nn.Dropout(p={float(layer.get('rate', 0.2))}),")
        elif layer_type == "batchnorm1d":
            lines.append(f"            nn.BatchNorm1d({previous}),")
        elif layer_type == "flatten":
            lines.append("            nn.Flatten(),")
    lines.extend(
        [
            "        )",
            "",
            "    def forward(self, x):",
            "        return self.net(x)",
            "",
            "",
            "device = torch.device('cuda' if torch.cuda.is_available() else ('mps' if torch.backends.mps.is_available() else 'cpu'))",
            f"model = {class_name}().to(device)",
            "print(model)",
        ]
    )
    return "\n".join(lines)
