import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const sidecarName = "ml-lab-studio-backend";
const pyInstallerArgs = [
  "-m",
  "PyInstaller",
  "--noconfirm",
  "--clean",
  "--onefile",
  "--name",
  sidecarName,
  "--distpath",
  "sidecars",
  "--workpath",
  "build/pyinstaller",
  "--specpath",
  "build/pyinstaller",
  "--paths",
  "backend",
  "--hidden-import",
  "sklearn.ensemble._forest",
  "--hidden-import",
  "sklearn.ensemble._gb",
  "--hidden-import",
  "sklearn.linear_model._base",
  "--hidden-import",
  "sklearn.linear_model._logistic",
  "--hidden-import",
  "sklearn.metrics._classification",
  "--hidden-import",
  "sklearn.metrics._regression",
  "--hidden-import",
  "sklearn.model_selection._split",
  "--hidden-import",
  "sklearn.neighbors._classification",
  "--hidden-import",
  "sklearn.preprocessing._data",
  "--hidden-import",
  "sklearn.preprocessing._label",
  "--hidden-import",
  "sklearn.svm._classes",
  "--exclude-module",
  "matplotlib.tests",
  "--exclude-module",
  "plotly.tests",
  "--exclude-module",
  "pytest",
  "--exclude-module",
  "sklearn.tests",
  "--exclude-module",
  "torch",
  "--exclude-module",
  "torchaudio",
  "--exclude-module",
  "torchvision",
  "backend/runner.py",
];

rmSync("sidecars", { recursive: true, force: true });
mkdirSync("sidecars", { recursive: true });
writeFileSync("sidecars/.gitkeep", "");
mkdirSync("build/pyinstaller-cache", { recursive: true });
mkdirSync("build/pyinstaller-cache/matplotlib", { recursive: true });

const candidates = [];

if (process.env.PYTHON) {
  candidates.push({ command: process.env.PYTHON, args: [] });
}

if (process.platform === "win32") {
  candidates.push({ command: "python", args: [] });
  candidates.push({ command: "python3", args: [] });
  candidates.push({ command: "py", args: ["-3"] });
} else {
  candidates.push({ command: "python3", args: [] });
  candidates.push({ command: "python", args: [] });
}

let result = null;
for (const candidate of candidates) {
  result = spawnSync(candidate.command, [...candidate.args, ...pyInstallerArgs], {
    env: {
      ...process.env,
      MPLBACKEND: "Agg",
      MPLCONFIGDIR: "build/pyinstaller-cache/matplotlib",
      PYINSTALLER_CONFIG_DIR: "build/pyinstaller-cache",
    },
    stdio: "inherit",
  });

  if (result.error?.code === "ENOENT") {
    continue;
  }

  break;
}

if (!result) {
  console.error("Could not find a Python interpreter. Install Python 3 or set the PYTHON environment variable.");
  process.exit(1);
}

if (result.error) {
  console.error(`Failed to run PyInstaller: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 0);
