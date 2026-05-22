import type { NotebookCell, NotebookFile } from "./types";

const NOTEBOOK_KEY = "mlstudio.notebook";

export function newCell(kind: "code" | "markdown", source = ""): NotebookCell {
  return {
    id: crypto.randomUUID(),
    kind,
    source,
    outputs: []
  };
}

export function defaultNotebook(): NotebookFile {
  const now = new Date().toISOString();
  return {
    name: "iris_classifier.mlnb.json",
    version: "0.1.0",
    createdAt: now,
    updatedAt: now,
    cells: [
      newCell("markdown", "# Iris classifier\nRun the cells to train a classifier and inspect its outputs."),
      newCell(
        "code",
        `import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix

df = pd.read_csv("sample_project/datasets/iris.csv")
features = ["sepal_length", "sepal_width"]
target = "species"
X_train, X_test, y_train, y_test = train_test_split(
    df[features], df[target], test_size=0.25, random_state=42, stratify=df[target]
)
model = LogisticRegression(max_iter=500)
model.fit(X_train, y_train)
predictions = model.predict(X_test)
print(classification_report(y_test, predictions))
confusion_matrix(y_test, predictions)`
      )
    ]
  };
}

export function loadNotebook(): NotebookFile {
  const raw = localStorage.getItem(NOTEBOOK_KEY);
  if (!raw) {
    return defaultNotebook();
  }
  try {
    return JSON.parse(raw) as NotebookFile;
  } catch {
    return defaultNotebook();
  }
}

export function saveNotebook(notebook: NotebookFile): void {
  localStorage.setItem(NOTEBOOK_KEY, JSON.stringify({ ...notebook, updatedAt: new Date().toISOString() }));
}

export function notebookToPython(notebook: NotebookFile): string {
  return notebook.cells
    .map((cell) => (cell.kind === "markdown" ? cell.source.split("\n").map((line) => `# ${line}`).join("\n") : cell.source))
    .join("\n\n");
}

export function notebookToIpynb(notebook: NotebookFile): Record<string, unknown> {
  return {
    cells: notebook.cells.map((cell) => ({
      cell_type: cell.kind,
      metadata: {},
      source: cell.source.split("\n").map((line) => `${line}\n`),
      outputs: [],
      execution_count: cell.kind === "code" ? cell.executionCount ?? null : undefined
    })),
    metadata: {
      kernelspec: { display_name: "Python 3", language: "python", name: "python3" },
      language_info: { name: "python", version: "3.x" }
    },
    nbformat: 4,
    nbformat_minor: 5
  };
}
