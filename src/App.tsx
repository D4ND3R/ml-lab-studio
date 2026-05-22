import { useEffect, useMemo, useRef, useState } from "react";

import { BackendClient } from "./lib/api";
import { buildAssistantSuggestions } from "./lib/assistant";
import { defaultArchitecture } from "./lib/deepLearningStore";
import { getActiveProject, loadProjects, setActiveProject } from "./lib/projectStore";
import { irisCsv } from "./lib/sampleData";
import { loadNotebook, newCell, saveNotebook } from "./lib/notebookStore";
import type {
  BackendHealth,
  DatasetRecord,
  DeviceStatus,
  ExperimentRun,
  ModelCard,
  NetworkArchitecture,
  NotebookFile,
  SectionId,
  TrainingResult,
  VariableInfo
} from "./lib/types";
import { CommandPalette } from "./components/layout/CommandPalette";
import { Inspector } from "./components/layout/Inspector";
import { Sidebar } from "./components/layout/Sidebar";
import { TopBar } from "./components/layout/TopBar";
import { DataExplorerPage } from "./pages/DataExplorerPage";
import { DatasetsPage } from "./pages/DatasetsPage";
import { DeepLearningStudioPage } from "./pages/DeepLearningStudioPage";
import { ExperimentsPage } from "./pages/ExperimentsPage";
import { ModelsPage } from "./pages/ModelsPage";
import { NotebookLabPage } from "./pages/NotebookLabPage";
import { ProjectsPage } from "./pages/ProjectsPage";
import { SettingsPage } from "./pages/SettingsPage";

function download(name: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

export default function App() {
  const [client, setClient] = useState(() => new BackendClient());
  const [activeSection, setActiveSection] = useState<SectionId>("projects");
  const [project, setProject] = useState(getActiveProject());
  const [recentProjects, setRecentProjects] = useState(loadProjects());
  const [health, setHealth] = useState<BackendHealth | null>(null);
  const [device, setDevice] = useState<DeviceStatus | null>(null);
  const [sessionId, setSessionId] = useState("");
  const sessionIdRef = useRef("");
  const [datasets, setDatasets] = useState<DatasetRecord[]>([]);
  const [activeDatasetId, setActiveDatasetId] = useState("");
  const [notebook, setNotebook] = useState<NotebookFile>(loadNotebook());
  const [variables, setVariables] = useState<VariableInfo[]>([]);
  const [architecture, setArchitecture] = useState<NetworkArchitecture>(defaultArchitecture());
  const [generatedCode, setGeneratedCode] = useState("# Generate PyTorch code from the Builder tab.");
  const [trainingResult, setTrainingResult] = useState<TrainingResult | null>(null);
  const [models, setModels] = useState<ModelCard[]>([]);
  const [runs, setRuns] = useState<ExperimentRun[]>([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [commandOpen, setCommandOpen] = useState(false);

  const activeDataset = useMemo(() => datasets.find((dataset) => dataset.id === activeDatasetId) ?? datasets[0] ?? null, [activeDatasetId, datasets]);
  const assistantSuggestions = useMemo(
    () => buildAssistantSuggestions(activeDataset, architecture, trainingResult),
    [activeDataset, architecture, trainingResult]
  );

  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  async function ensureSession(nextClient = client): Promise<string> {
    if (sessionIdRef.current) {
      return sessionIdRef.current;
    }
    const session = await nextClient.createSession("Default Notebook");
    sessionIdRef.current = session.session_id;
    setSessionId(session.session_id);
    return session.session_id;
  }

  async function reconnect(nextClient = client) {
    try {
      const nextHealth = await nextClient.health();
      setHealth(nextHealth);
      setDevice(nextHealth.torch);
      await ensureSession(nextClient);
      setNotice("Backend connected.");
    } catch (error) {
      setHealth(null);
      setDevice({ torch_available: false, devices: ["CPU"], active: "CPU", install_command: "pip install torch torchvision torchaudio" });
      setNotice(error instanceof Error ? `Backend offline: ${error.message}` : "Backend offline.");
    }
  }

  useEffect(() => {
    void reconnect();
    const id = window.setInterval(() => void reconnect(), 15000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function withBusy(action: () => Promise<void>) {
    setBusy(true);
    setNotice("");
    try {
      await action();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  async function refreshVariables() {
    if (!sessionIdRef.current) {
      return;
    }
    try {
      setVariables(await client.variables(sessionIdRef.current));
    } catch {
      setVariables([]);
    }
  }

  async function importDataset(file: File) {
    await withBusy(async () => {
      const dataset = await client.importDataset(file);
      setDatasets((current) => [dataset, ...current.filter((item) => item.id !== dataset.id)]);
      setActiveDatasetId(dataset.id);
      setNotice(`Imported ${dataset.name}.`);
    });
  }

  async function loadSampleDataset() {
    await withBusy(async () => {
      const dataset = await client.importDatasetFromText("iris.csv", irisCsv);
      setDatasets((current) => [dataset, ...current.filter((item) => item.name !== dataset.name)]);
      setActiveDatasetId(dataset.id);
      setNotice("Loaded the Iris demo dataset.");
    });
  }

  async function saveDatasetRows(rows: Record<string, unknown>[]) {
    if (!activeDataset) {
      return;
    }
    await withBusy(async () => {
      const dataset = await client.saveDataset(activeDataset.id, rows, activeDataset.name);
      setDatasets((current) => current.map((item) => (item.id === dataset.id ? dataset : item)));
      setNotice("Dataset edits saved to the backend session.");
    });
  }

  async function exportDataset(format: "csv" | "json" | "jsonl" | "parquet") {
    if (!activeDataset) {
      return;
    }
    await withBusy(async () => {
      const exported = await client.exportDataset(activeDataset.id, format);
      download(`${activeDataset.name}.${format}`, exported.content, exported.mime);
    });
  }

  async function runCell(cellId: string) {
    const cell = notebook.cells.find((item) => item.id === cellId);
    if (!cell || cell.kind !== "code") {
      return;
    }
    await withBusy(async () => {
      const activeSession = await ensureSession();
      const result = await client.execute(activeSession, cell.source, 30);
      setNotebook((current) => ({
        ...current,
        cells: current.cells.map((item) =>
          item.id === cellId
            ? {
                ...item,
                outputs: result.outputs,
                stdout: result.stdout,
                stderr: result.stderr,
                error: result.error ?? null,
                executionCount: result.execution_count,
                durationMs: result.duration_ms
              }
            : item
        )
      }));
      await refreshVariables();
    });
  }

  async function runAllCells() {
    for (const cell of notebook.cells) {
      if (cell.kind === "code") {
        await runCell(cell.id);
      }
    }
  }

  async function stopExecution() {
    if (!sessionIdRef.current) {
      return;
    }
    await withBusy(async () => {
      await client.interrupt(sessionIdRef.current);
      setNotice("Interrupt requested.");
    });
  }

  function saveCurrentNotebook() {
    saveNotebook(notebook);
    download(notebook.name, JSON.stringify(notebook, null, 2), "application/json");
    setNotice("Notebook saved locally and exported.");
  }

  function saveProjectMetadata() {
    const updated = { ...project, updatedAt: new Date().toISOString() };
    setProject(updated);
    setActiveProject(updated);
    setRecentProjects(loadProjects());
    setNotice("Project metadata saved.");
  }

  function createDemoProject() {
    const now = new Date().toISOString();
    const next = {
      ...project,
      id: crypto.randomUUID(),
      name: "Iris Demo Project",
      path: "sample_project",
      createdAt: now,
      updatedAt: now
    };
    setProject(next);
    setActiveProject(next);
    setRecentProjects(loadProjects());
    void loadSampleDataset();
  }

  async function buildPlot(payload: Record<string, unknown>) {
    return client.plot(payload);
  }

  async function decisionBoundary(payload: Record<string, unknown>) {
    return client.decisionBoundary({ ...payload, session_id: await ensureSession() });
  }

  async function trainClassifier(payload: Record<string, unknown>) {
    await withBusy(async () => {
      await client.trainModel({ ...payload, session_id: await ensureSession() });
      await refreshVariables();
      setNotice("Classifier trained and stored in notebook variables.");
    });
  }

  async function generateArchitectureCode() {
    await withBusy(async () => {
      const code = await client.generateArchitectureCode(architecture);
      setGeneratedCode(code);
      setNotice("Generated PyTorch code.");
    });
  }

  async function trainDeepLearningModel() {
    if (!activeDataset) {
      setNotice("Load the Iris dataset before training the MLP.");
      return;
    }
    const numeric = activeDataset.schema.filter((column) => column.semantic_type === "numeric").map((column) => column.name);
    const target = activeDataset.schema.find((column) => column.semantic_type === "categorical")?.name ?? activeDataset.columns[activeDataset.columns.length - 1];
    await withBusy(async () => {
      const result = await client.trainDeepLearning({
        dataset_id: activeDataset.id,
        architecture,
        target_column: target,
        feature_columns: numeric.slice(0, architecture.inputSize),
        session_id: await ensureSession(),
        model_name: "iris_mlp",
        epochs: architecture.epochs,
        learning_rate: architecture.learningRate,
        batch_size: architecture.batchSize,
        validation_split: architecture.validationSplit
      });
      setTrainingResult(result);
      if (result.ok) {
        await client.logExperiment({
          run_name: `${architecture.name} ${new Date().toLocaleTimeString()}`,
          dataset_used: activeDataset.name,
          model_type: "PyTorch MLP",
          parameters: architecture,
          metrics: result.metrics ?? {},
          architecture_json: architecture,
          generated_pytorch_code: generatedCode,
          epoch_metrics: result.history ?? [],
          device_used: result.device ?? "CPU"
        });
        await refreshVariables();
        await refreshExperiments();
      }
    });
  }

  function insertGeneratedCode() {
    const cell = newCell("code", generatedCode);
    setNotebook((current) => ({ ...current, cells: [...current.cells, cell], updatedAt: new Date().toISOString() }));
    setActiveSection("notebooks");
  }

  async function refreshModels() {
    await withBusy(async () => {
      setModels(await client.listModels());
    });
  }

  async function saveModel(modelName: string) {
    await withBusy(async () => {
      const card = await client.saveModel({
        session_id: await ensureSession(),
        model_name: modelName,
        metadata: {
          dataset: activeDataset?.name,
          features: activeDataset?.columns,
          framework: variables.find((variable) => variable.name === modelName)?.framework ?? "sklearn",
          device_used: device?.active ?? "CPU"
        }
      });
      setModels((current) => [card, ...current]);
      setNotice("Model saved and model card created.");
    });
  }

  async function refreshExperiments() {
    try {
      setRuns(await client.listExperiments());
    } catch {
      setRuns([]);
    }
  }

  async function logCurrentRun() {
    await withBusy(async () => {
      const run = await client.logExperiment({
        run_name: `Manual run ${new Date().toLocaleTimeString()}`,
        dataset_used: activeDataset?.name,
        model_type: trainingResult?.model_name ?? "notebook model",
        metrics: trainingResult?.metrics ?? {},
        parameters: architecture,
        epoch_metrics: trainingResult?.history ?? [],
        device_used: trainingResult?.device ?? device?.active ?? "CPU"
      });
      setRuns((current) => [run, ...current]);
    });
  }

  function reconnectFromSettings() {
    const next = new BackendClient();
    setClient(next);
    void reconnect(next);
  }

  let page: JSX.Element;
  if (activeSection === "projects") {
    page = (
      <ProjectsPage
        project={project}
        recent={recentProjects}
        datasetCount={datasets.length}
        modelCount={models.length}
        runCount={runs.length}
        suggestions={assistantSuggestions}
        onCreate={createDemoProject}
        onActivate={(next) => {
          setProject(next);
          setActiveProject(next);
        }}
        onSave={saveProjectMetadata}
        onNavigate={setActiveSection}
        onLoadSample={loadSampleDataset}
      />
    );
  } else if (activeSection === "datasets") {
    page = <DatasetsPage datasets={datasets} activeDataset={activeDataset} onSelect={setActiveDatasetId} onImport={importDataset} onLoadSample={loadSampleDataset} onSaveRows={saveDatasetRows} onExport={exportDataset} />;
  } else if (activeSection === "explorer") {
    page = <DataExplorerPage dataset={activeDataset} onPlot={buildPlot} />;
  } else if (activeSection === "notebooks") {
    page = (
      <NotebookLabPage
        notebook={notebook}
        datasets={datasets}
        activeDataset={activeDataset}
        variables={variables}
        onNotebookChange={setNotebook}
        onRunCell={runCell}
        onRunAll={runAllCells}
        onStop={stopExecution}
        onSave={saveCurrentNotebook}
        onDecisionBoundary={decisionBoundary}
        onTrainClassifier={trainClassifier}
      />
    );
  } else if (activeSection === "deep-learning") {
    page = (
      <DeepLearningStudioPage
        architecture={architecture}
        dataset={activeDataset}
        device={device}
        generatedCode={generatedCode}
        trainingResult={trainingResult}
        onArchitectureChange={setArchitecture}
        onGenerateCode={generateArchitectureCode}
        onTrain={trainDeepLearningModel}
        onInsertCode={insertGeneratedCode}
      />
    );
  } else if (activeSection === "models") {
    page = <ModelsPage models={models} variables={variables} onRefresh={refreshModels} onSaveModel={saveModel} />;
  } else if (activeSection === "experiments") {
    page = <ExperimentsPage runs={runs} onRefresh={() => void refreshExperiments()} onLogDemo={logCurrentRun} />;
  } else {
    page = <SettingsPage device={device} onReconnect={reconnectFromSettings} />;
  }

  return (
    <div className="app-shell">
      <Sidebar active={activeSection} onChange={setActiveSection} />
      <div className="workspace">
        <TopBar project={project} health={health} device={device} busy={busy} onSave={saveProjectMetadata} onCommand={() => setCommandOpen(true)} />
        {notice ? <div className={health?.ok ? "notice" : "notice warn"}>{notice}</div> : null}
        <main>{page}</main>
      </div>
      <Inspector dataset={activeDataset} variables={variables} architecture={architecture} training={trainingResult} />
      <CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} onSelect={setActiveSection} />
    </div>
  );
}
