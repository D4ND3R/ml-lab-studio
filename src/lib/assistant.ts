import type { DatasetRecord, NetworkArchitecture, TrainingResult } from "./types";

export type AssistantSuggestion = {
  title: string;
  detail: string;
  severity: "info" | "warning" | "success";
  code?: string;
};

export function buildAssistantSuggestions(
  dataset: DatasetRecord | null,
  architecture: NetworkArchitecture,
  training: TrainingResult | null
): AssistantSuggestion[] {
  const suggestions: AssistantSuggestion[] = [];

  if (!dataset) {
    return [
      {
        title: "Start with a dataset",
        detail: "Open the Iris demo or import a CSV to unlock schema checks, plots, model suggestions, and notebook templates.",
        severity: "info"
      },
      {
        title: "Use a small classical model first",
        detail: "For tabular MVP work, train LogisticRegression or RandomForest before trying a neural network.",
        severity: "info"
      }
    ];
  }

  const numericColumns = dataset.schema.filter((column) => column.semantic_type === "numeric");
  const categoricalColumns = dataset.schema.filter((column) => column.semantic_type === "categorical");
  const missingColumns = dataset.missing.filter((column) => column.missing > 0);
  const rowCount = dataset.rows;

  suggestions.push({
    title: "Dataset is ready for exploration",
    detail: `${dataset.name} has ${rowCount.toLocaleString()} rows and ${dataset.columns.length} columns. ${numericColumns.length} numeric columns are available for plots and models.`,
    severity: "success"
  });

  if (missingColumns.length > 0) {
    suggestions.push({
      title: "Missing values detected",
      detail: `${missingColumns.length} columns contain missing values. Impute numeric columns with medians and categorical columns with modes before training.`,
      severity: "warning",
      code: `numeric_columns = df.select_dtypes(include="number").columns
categorical_columns = df.select_dtypes(exclude="number").columns
df[numeric_columns] = df[numeric_columns].fillna(df[numeric_columns].median())
for column in categorical_columns:
    df[column] = df[column].fillna(df[column].mode().iloc[0])`
    });
  }

  if (dataset.duplicate_rows > 0) {
    suggestions.push({
      title: "Duplicate rows",
      detail: `${dataset.duplicate_rows.toLocaleString()} duplicate rows were detected. Review them before splitting train and test sets.`,
      severity: "warning",
      code: "df = df.drop_duplicates()"
    });
  }

  const targetLike = dataset.columns.find((column) => /target|label|class|species|outcome/i.test(column));
  if (targetLike) {
    suggestions.push({
      title: "Likely target column",
      detail: `${targetLike} looks like a target column. Use stratified train/test split for classification when classes are imbalanced.`,
      severity: "info"
    });
  }

  const firstCategorical = categoricalColumns[0]?.name;
  if (firstCategorical && dataset.class_distribution[firstCategorical]) {
    const counts = Object.values(dataset.class_distribution[firstCategorical]);
    const max = Math.max(...counts);
    const min = Math.min(...counts);
    if (min > 0 && max / min > 2) {
      suggestions.push({
        title: "Possible class imbalance",
        detail: `${firstCategorical} has a largest-to-smallest class ratio of ${(max / min).toFixed(1)}. Track F1 and confusion matrix, not just accuracy.`,
        severity: "warning"
      });
    }
  }

  if (rowCount < 1000) {
    suggestions.push({
      title: "Small dataset",
      detail: "Classical ML is likely a stronger baseline than deep learning here. Use the neural network builder for learning or quick experiments.",
      severity: "info"
    });
  }

  if (architecture.inputSize !== numericColumns.length && numericColumns.length > 0) {
    suggestions.push({
      title: "Architecture input check",
      detail: `The current neural network expects ${architecture.inputSize} inputs, while the active dataset has ${numericColumns.length} numeric columns.`,
      severity: "warning"
    });
  }

  if (training?.metrics?.accuracy !== undefined) {
    suggestions.push({
      title: "Training run available",
      detail: `Latest neural network accuracy is ${training.metrics.accuracy.toFixed(3)}. Compare it against LogisticRegression before adding complexity.`,
      severity: "success"
    });
  }

  return suggestions.slice(0, 7);
}
