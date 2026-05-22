import type { NetworkArchitecture } from "./types";

export function defaultArchitecture(): NetworkArchitecture {
  return {
    name: "Iris MLP",
    inputSize: 4,
    outputSize: 3,
    layers: [
      { id: crypto.randomUUID(), type: "linear", units: 12, label: "Dense 12" },
      { id: crypto.randomUUID(), type: "relu", label: "ReLU" },
      { id: crypto.randomUUID(), type: "dropout", rate: 0.1, label: "Dropout" },
      { id: crypto.randomUUID(), type: "linear", units: 3, label: "Output 3" }
    ],
    loss: "CrossEntropyLoss",
    optimizer: "Adam",
    learningRate: 0.01,
    batchSize: 16,
    epochs: 25,
    validationSplit: 0.2
  };
}

export function cloneArchitecture(architecture: NetworkArchitecture): NetworkArchitecture {
  return JSON.parse(JSON.stringify(architecture)) as NetworkArchitecture;
}
