import { PlugZap, Save } from "lucide-react";
import { useState } from "react";

import { getBackendUrl, setBackendUrl } from "../lib/api";
import type { DeviceStatus } from "../lib/types";

type Props = {
  device: DeviceStatus | null;
  onReconnect: () => void;
};

export function SettingsPage({ device, onReconnect }: Props) {
  const [url, setUrl] = useState(getBackendUrl());
  return (
    <div className="page-grid">
      <section className="panel">
        <h1>Settings</h1>
        <div className="form-stack">
          <label>
            Python backend URL
            <input value={url} onChange={(event) => setUrl(event.target.value)} />
          </label>
          <button
            className="primary-button"
            onClick={() => {
              setBackendUrl(url);
              onReconnect();
            }}
          >
            <Save size={15} aria-hidden="true" />
            Save and reconnect
          </button>
        </div>
      </section>
      <section className="panel">
        <h2>Python backend</h2>
        <div className="summary-grid single">
          <div>
            <strong>Desktop startup</strong>
            <span>The packaged app starts the bundled backend sidecar automatically.</span>
          </div>
          <div>
            <strong>Developer command</strong>
            <code>npm run backend</code>
          </div>
          <div>
            <strong>Trusted code warning</strong>
            <span>Notebook code executes locally in a persistent Python namespace. Use notebooks and code you trust.</span>
          </div>
        </div>
      </section>
      <section className="panel">
        <h2>Deep learning</h2>
        <div className="summary-grid single">
          <div>
            <strong>Active device</strong>
            <span>{device?.active ?? "CPU"}</span>
          </div>
          <div>
            <strong>Torch status</strong>
            <span>{device?.torch_available ? "Installed" : "Not installed"}</span>
          </div>
          <div>
            <strong>Install command</strong>
            <code>{device?.install_command ?? "pip install torch torchvision torchaudio"}</code>
          </div>
          <button onClick={onReconnect}>
            <PlugZap size={15} aria-hidden="true" />
            Recheck devices
          </button>
        </div>
      </section>
    </div>
  );
}
