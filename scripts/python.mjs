import { spawnSync } from "node:child_process";

const scriptArgs = process.argv.slice(2);

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

for (const candidate of candidates) {
  const result = spawnSync(candidate.command, [...candidate.args, ...scriptArgs], {
    stdio: "inherit",
  });

  if (result.error?.code === "ENOENT") {
    continue;
  }

  if (result.error) {
    console.error(`Failed to run ${candidate.command}: ${result.error.message}`);
    process.exit(1);
  }

  process.exit(result.status ?? 0);
}

console.error(
  "Could not find a Python interpreter. Install Python 3 or set the PYTHON environment variable."
);
process.exit(1);
