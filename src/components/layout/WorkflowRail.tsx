import { BarChart3, BrainCircuit, Database, FlaskConical, NotebookTabs, Workflow } from "lucide-react";

type Props = {
  datasetCount: number;
  modelCount: number;
  runCount: number;
};

const steps = [
  { label: "Import", icon: Database },
  { label: "Explore", icon: BarChart3 },
  { label: "Notebook", icon: NotebookTabs },
  { label: "Build NN", icon: BrainCircuit },
  { label: "Model", icon: Workflow },
  { label: "Track", icon: FlaskConical }
];

export function WorkflowRail({ datasetCount, modelCount, runCount }: Props) {
  return (
    <div className="workflow-rail">
      {steps.map((step, index) => {
        const Icon = step.icon;
        const active =
          (index === 0 && datasetCount > 0) ||
          (index === 4 && modelCount > 0) ||
          (index === 5 && runCount > 0) ||
          (index > 0 && index < 4 && datasetCount > 0);
        return (
          <div key={step.label} className={active ? "workflow-step active" : "workflow-step"}>
            <Icon size={16} aria-hidden="true" />
            <span>{step.label}</span>
          </div>
        );
      })}
    </div>
  );
}
