import { Plus, Save, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import type { DatasetRecord } from "../../lib/types";

type Props = {
  dataset: DatasetRecord;
  onSave: (rows: Record<string, unknown>[]) => void;
};

export function DatasetGrid({ dataset, onSave }: Props) {
  const [rows, setRows] = useState<Record<string, unknown>[]>(dataset.preview);
  const [columns, setColumns] = useState<string[]>(dataset.columns);
  const visibleRows = useMemo(() => rows.slice(0, 500), [rows]);

  function updateCell(rowIndex: number, column: string, value: string) {
    setRows((current) => current.map((row, index) => (index === rowIndex ? { ...row, [column]: value } : row)));
  }

  function addColumn() {
    const name = `column_${columns.length + 1}`;
    setColumns((current) => [...current, name]);
    setRows((current) => current.map((row) => ({ ...row, [name]: "" })));
  }

  function renameColumn(oldName: string, newName: string) {
    if (!newName || newName === oldName) {
      return;
    }
    setColumns((current) => current.map((column) => (column === oldName ? newName : column)));
    setRows((current) =>
      current.map((row) => {
        const next = { ...row, [newName]: row[oldName] };
        delete next[oldName];
        return next;
      })
    );
  }

  function addRow() {
    setRows((current) => [...current, Object.fromEntries(columns.map((column) => [column, ""]))]);
  }

  function deleteRow(index: number) {
    setRows((current) => current.filter((_, rowIndex) => rowIndex !== index));
  }

  return (
    <div className="data-grid-shell">
      <div className="toolbar compact-toolbar">
        <button onClick={addRow}>
          <Plus size={15} aria-hidden="true" />
          Row
        </button>
        <button onClick={addColumn}>
          <Plus size={15} aria-hidden="true" />
          Column
        </button>
        <button className="primary-button" onClick={() => onSave(rows)}>
          <Save size={15} aria-hidden="true" />
          Save edits
        </button>
        <span className="muted">{dataset.rows.toLocaleString()} total rows, showing {visibleRows.length.toLocaleString()}</span>
      </div>
      <div className="grid-scroll">
        <table className="dataset-table">
          <thead>
            <tr>
              <th className="row-actions">#</th>
              {columns.map((column) => (
                <th key={column}>
                  <input
                    value={column}
                    title="Rename column"
                    onChange={(event) => renameColumn(column, event.target.value)}
                    className="column-name-input"
                  />
                </th>
              ))}
              <th className="row-actions"> </th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row, rowIndex) => (
              <tr key={`${dataset.id}-${rowIndex}`}>
                <td className="row-index">{rowIndex + 1}</td>
                {columns.map((column) => (
                  <td key={column}>
                    <input value={String(row[column] ?? "")} onChange={(event) => updateCell(rowIndex, column, event.target.value)} />
                  </td>
                ))}
                <td className="row-actions">
                  <button className="icon-button small" title="Delete row" onClick={() => deleteRow(rowIndex)}>
                    <Trash2 size={14} aria-hidden="true" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
