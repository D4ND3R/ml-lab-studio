import { Command, HardDrive, Play, Save, Server, Zap } from "lucide-react";

import type { BackendHealth, DeviceStatus, ProjectRecord } from "../../lib/types";

type Props = {
  project: ProjectRecord;
  health: BackendHealth | null;
  device: DeviceStatus | null;
  busy: boolean;
  onSave: () => void;
  onCommand: () => void;
};

export function TopBar({ project, health, device, busy, onSave, onCommand }: Props) {
  return (
    <header className="topbar">
      <div className="topbar-project">
        <HardDrive size={18} aria-hidden="true" />
        <div>
          <span className="muted">Current project</span>
          <strong>{project.name}</strong>
        </div>
      </div>
      <div className="status-strip">
        <span className={busy ? "status-pill active" : "status-pill"}>
          <Play size={14} aria-hidden="true" />
          {busy ? "Running" : "Idle"}
        </span>
        <span className={health?.ok ? "status-pill ok" : "status-pill danger"}>
          <Server size={14} aria-hidden="true" />
          {health?.ok ? "Backend online" : "Backend offline"}
        </span>
        <span className={device?.torch_available ? "status-pill ok" : "status-pill warn"}>
          <Zap size={14} aria-hidden="true" />
          {device?.active ?? "CPU"}
        </span>
      </div>
      <div className="topbar-actions">
        <button className="icon-button" title="Command palette" onClick={onCommand}>
          <Command size={18} aria-hidden="true" />
        </button>
        <button className="primary-button" onClick={onSave}>
          <Save size={16} aria-hidden="true" />
          Save
        </button>
      </div>
    </header>
  );
}
