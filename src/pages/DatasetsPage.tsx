import { Download, FilePlus2, TableProperties } from "lucide-react";

import { DatasetGrid } from "../components/data-grid/DatasetGrid";
import type { DatasetRecord } from "../lib/types";

type Props = {
  datasets: DatasetRecord[];
  activeDataset: DatasetRecord | null;
  onSelect: (datasetId: string) => void;
  onImport: (file: File) => void;
  onLoadSample: () => void;
  onSaveRows: (rows: Record<string, unknown>[]) => void;
  onExport: (format: "csv" | "json" | "jsonl" | "parquet") => void;
};

export function DatasetsPage({ datasets, activeDataset, onSelect, onImport, onLoadSample, onSaveRows, onExport }: Props) {
  return (
    <div className="page-grid">
      <section className="panel span-2">
        <div className="panel-title">
          <h1>Dataset Manager</h1>
          <div className="toolbar">
            <label className="file-button">
              <FilePlus2 size={15} aria-hidden="true" />
              Import dataset
              <input
                type="file"
                accept=".csv,.tsv,.json,.jsonl,.xlsx,.parquet,.feather"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    onImport(file);
                  }
                }}
              />
            </label>
            <button onClick={onLoadSample}>
              <TableProperties size={15} aria-hidden="true" />
              Open Iris demo
            </button>
            <button onClick={() => onExport("csv")}>
              <Download size={15} aria-hidden="true" />
              CSV
            </button>
            <button onClick={() => onExport("parquet")}>
              <Download size={15} aria-hidden="true" />
              Parquet
            </button>
          </div>
        </div>
        {activeDataset ? (
          <>
            <div className="dataset-spotlight">
              <div>
                <span>Rows</span>
                <strong>{activeDataset.rows.toLocaleString()}</strong>
              </div>
              <div>
                <span>Columns</span>
                <strong>{activeDataset.columns.length}</strong>
              </div>
              <div>
                <span>Missing cells</span>
                <strong>{activeDataset.missing.reduce((sum, item) => sum + item.missing, 0).toLocaleString()}</strong>
              </div>
              <div>
                <span>Duplicates</span>
                <strong>{activeDataset.duplicate_rows}</strong>
              </div>
            </div>
            <DatasetGrid key={activeDataset.id} dataset={activeDataset} onSave={onSaveRows} />
          </>
        ) : (
          <div className="empty-state">
            <TableProperties size={38} aria-hidden="true" />
            <strong>No dataset loaded</strong>
            <span>Open the Iris demo or import CSV, TSV, JSON, JSONL, Excel, Parquet, Feather, SQLite tables, or image folders.</span>
          </div>
        )}
      </section>

      <section className="panel">
        <h2>Datasets</h2>
        <div className="dataset-list">
          {datasets.map((dataset) => (
            <button key={dataset.id} className={activeDataset?.id === dataset.id ? "selected-card" : ""} onClick={() => onSelect(dataset.id)}>
              <strong>{dataset.name}</strong>
              <span>{dataset.rows.toLocaleString()} rows, {dataset.columns.length} columns</span>
              <small>{dataset.format}</small>
            </button>
          ))}
          {datasets.length === 0 ? <p className="empty-note">Supported imports include CSV, TSV, JSON, JSONL, Excel, Parquet, Feather, SQLite tables, and image folders.</p> : null}
        </div>
      </section>

      {activeDataset ? (
        <section className="panel span-3">
          <h2>Quality summary</h2>
          <div className="summary-grid">
            <div>
              <strong>Missing values</strong>
              {activeDataset.missing.map((item) => (
                <span key={item.column}>{item.column}: {item.percent}%</span>
              ))}
            </div>
            <div>
              <strong>Duplicate rows</strong>
              <span>{activeDataset.duplicate_rows}</span>
            </div>
            <div>
              <strong>Column types</strong>
              {activeDataset.schema.map((column) => (
                <span key={column.name}>{column.name}: {column.semantic_type}</span>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
