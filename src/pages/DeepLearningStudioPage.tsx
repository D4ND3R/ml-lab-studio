import { useState } from "react";

import { ActivationViewer } from "../components/deep-learning/ActivationViewer";
import { ArchitectureCodeGenerator } from "../components/deep-learning/ArchitectureCodeGenerator";
import { NetworkBuilder } from "../components/deep-learning/NetworkBuilder";
import { NetworkVisualizer } from "../components/deep-learning/NetworkVisualizer";
import { PerceptronVisualizer } from "../components/deep-learning/PerceptronVisualizer";
import { TrainingDashboard } from "../components/deep-learning/TrainingDashboard";
import { WeightsViewer } from "../components/deep-learning/WeightsViewer";
import type { DatasetRecord, DeviceStatus, NetworkArchitecture, TrainingResult } from "../lib/types";

type Tab = "builder" | "visualizer" | "perceptron" | "training" | "internals" | "code";

type Props = {
  architecture: NetworkArchitecture;
  dataset: DatasetRecord | null;
  device: DeviceStatus | null;
  generatedCode: string;
  trainingResult: TrainingResult | null;
  onArchitectureChange: (architecture: NetworkArchitecture) => void;
  onGenerateCode: () => void;
  onTrain: () => void;
  onInsertCode: () => void;
};

const tabs: { id: Tab; label: string }[] = [
  { id: "builder", label: "Builder" },
  { id: "visualizer", label: "Visualizer" },
  { id: "perceptron", label: "Perceptron" },
  { id: "training", label: "Training" },
  { id: "internals", label: "Internals" },
  { id: "code", label: "Code" }
];

export function DeepLearningStudioPage({
  architecture,
  dataset,
  device,
  generatedCode,
  trainingResult,
  onArchitectureChange,
  onGenerateCode,
  onTrain,
  onInsertCode
}: Props) {
  const [tab, setTab] = useState<Tab>("builder");

  return (
    <div className="deep-learning-page">
      <section className="panel">
        <div className="panel-title">
          <h1>Deep Learning Studio</h1>
          <div className="status-strip">
            <span className={device?.torch_available ? "status-pill ok" : "status-pill warn"}>
              PyTorch {device?.torch_available ? "available" : "optional"}
            </span>
            <span className="status-pill">Dataset: {dataset?.name ?? "none"}</span>
            <span className="status-pill">Device: {device?.active ?? "CPU"}</span>
          </div>
        </div>
        {!device?.torch_available ? (
          <div className="warning-banner">
            PyTorch is optional. Install it with: <code>{device?.install_command ?? "pip install torch torchvision torchaudio"}</code>
          </div>
        ) : null}
        <div className="segmented">
          {tabs.map((item) => (
            <button key={item.id} className={tab === item.id ? "selected" : ""} onClick={() => setTab(item.id)}>
              {item.label}
            </button>
          ))}
        </div>
      </section>

      {tab === "builder" ? (
        <NetworkBuilder architecture={architecture} onChange={onArchitectureChange} onGenerateCode={onGenerateCode} onTrain={onTrain} />
      ) : null}
      {tab === "visualizer" ? (
        <section className="panel">
          <NetworkVisualizer architecture={architecture} />
        </section>
      ) : null}
      {tab === "perceptron" ? <PerceptronVisualizer /> : null}
      {tab === "training" ? <TrainingDashboard result={trainingResult} /> : null}
      {tab === "internals" ? (
        <div className="page-grid">
          <WeightsViewer result={trainingResult} />
          <ActivationViewer />
        </div>
      ) : null}
      {tab === "code" ? <ArchitectureCodeGenerator code={generatedCode} onInsert={onInsertCode} /> : null}
    </div>
  );
}
