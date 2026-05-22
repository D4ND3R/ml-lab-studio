# ML Lab Studio

ML Lab Studio is a desktop MVP for local machine learning work: dataset editing, notebook-style Python execution, model visualization, experiment tracking, neural network building, perceptron visualization, and 2D/3D analysis.

The app uses Tauri v2, React, TypeScript, Vite, and a Python FastAPI sidecar. Notebook code runs locally in a trusted Python session. Do not run untrusted notebooks or code.

## Screenshots

Screenshots will be added as the UI stabilizes:

- Dataset Manager
- Notebook Lab
- Data Explorer
- Deep Learning Studio
- Experiment Tracker

## Tech Stack

- Desktop shell: Tauri v2
- Frontend: React, TypeScript, Vite
- Code editor: Monaco Editor
- Visualization: Plotly.js
- Neural network visualization: SVG
- Backend: FastAPI, pandas, NumPy, scikit-learn, matplotlib, Plotly
- Local storage target: DuckDB/SQLite-ready project structure
- Optional deep learning: PyTorch

## Project Format

Each ML Lab Studio project uses:

```text
.mlstudio/
  project.json
datasets/
notebooks/
models/
exports/
runs/
architectures/
```

## Installation

```bash
npm install
python -m pip install -r backend/requirements.txt
```

PyTorch is optional and intentionally not installed by default:

```bash
pip install torch torchvision torchaudio
```

## Development on Windows

Install:

- Node.js 20 or newer
- Python 3.10 or newer
- Rust stable, required for Tauri desktop builds
- Microsoft Visual Studio Build Tools with C++ workload

Run the backend:

```bash
npm run backend
```

Run the frontend:

```bash
npm run dev
```

Run the desktop shell:

```bash
npm run tauri dev
```

## Development on macOS

Install:

- Node.js 20 or newer
- Python 3.10 or newer
- Rust stable
- Xcode command line tools

Run:

```bash
npm run backend
npm run dev
npm run tauri dev
```

On Apple Silicon, PyTorch can use MPS when your installed PyTorch build supports it.

## Python Backend Setup

The backend is a FastAPI sidecar listening on `http://127.0.0.1:8765`.

```bash
python -m pip install -r backend/requirements.txt
npm run backend
```

Health check:

```bash
curl http://127.0.0.1:8765/health
```

## Running the App

Use two terminals for MVP development:

```bash
npm run backend
npm run dev
```

Then open the Vite URL, usually:

```text
http://127.0.0.1:5173
```

For Tauri:

```bash
npm run tauri dev
```

## Building the App

Frontend build:

```bash
npm run build
```

Desktop packaging:

```bash
npm run tauri build
```

Windows and macOS packaging require Rust and each platform's native build toolchain.

## Current MVP Features

- Tauri v2-ready desktop scaffold
- React dark-mode-first application shell
- Python backend health check and status indicator
- Local project metadata and recent project list
- CSV dataset import through FastAPI
- Dataset table preview and editable cells
- Add/delete rows and add/rename columns in the grid
- Dataset missing-value, duplicate, schema, statistics, class balance, and correlation summaries
- Data Explorer with Plotly 2D/3D plot requests
- Notebook Lab with multiple code and markdown cells
- Monaco Editor for Python cells
- Persistent Python session per notebook
- stdout, stderr, returned values, pandas DataFrames, Plotly figures, matplotlib images, and tracebacks
- Save/export notebook as `.mlnb.json`, `.py`, and `.ipynb`
- Classical ML templates and PyTorch templates
- LogisticRegression training helper
- Decision boundary endpoint and UI
- Model Manager with model card storage path
- Experiment Tracker with local run logging
- Iris dataset demo and sample notebooks

## Deep Learning Features

- Deep Learning Studio main sidebar entry
- Visual MLP builder with layer controls
- SVG neural network visualizer with perceptron and collapsed-layer behavior
- PyTorch code generation endpoint and UI
- Optional torch detection with install instructions
- Direct Iris MLP training when torch is installed
- Training dashboard with loss, validation loss, accuracy, F1, confusion matrix, and checkpoint controls
- Weight summary inspection after PyTorch training
- Perceptron Visualizer with live inputs, weights, bias, activations, formula, and 2D decision boundary
- Neural network internals viewer placeholders for activations, gradients, dead ReLUs, convolution filters, feature maps, and Grad-CAM

## Initial Sample Workflow

1. Start the backend with `npm run backend`.
2. Start the frontend with `npm run dev` or `npm run tauri dev`.
3. Open Projects and create the Iris demo project.
4. Open Datasets and click Open Iris demo.
5. Open Data Explorer and plot `sepal_length` versus `sepal_width`, colored by `species`.
6. Open Notebook Lab and run the Iris LogisticRegression notebook.
7. Use the Decision Boundary panel with model variable `model`.
8. Open Deep Learning Studio.
9. Use the Builder to inspect or edit the Iris MLP.
10. Generate PyTorch code and insert it into Notebook Lab.
11. If PyTorch is installed, train the MLP and inspect training curves, confusion matrix, and weights.
12. Save the trained model from the Models page.

## Roadmap

- Real Tauri-managed Python sidecar lifecycle
- File-system project open/save through Tauri plugins
- DuckDB/SQLite persistence for metadata, notebooks, runs, and model cards
- Large dataset virtualization and streaming previews
- Dataset versioning
- More image dataset tools
- PCA and embedding viewers backed by server-side transforms
- Robust notebook interruption through worker processes or Jupyter kernels
- Model checkpoint compatibility checks
- HTML and Markdown experiment report export
- AI Helper rule expansion

## Deep Learning Roadmap

- Visual neural network builder
- Perceptron simulator
- MLP/CNN/RNN/Transformer templates
- PyTorch training dashboard
- Live training curves
- Weight/gradient/activation inspection
- Decision boundaries for neural networks
- Model checkpoint manager
- Apple Silicon MPS / NVIDIA CUDA detection
- TensorBoard-like experiment comparison

## Known Limitations

- Notebook execution uses trusted local `exec` in an isolated namespace, not a hardened sandbox.
- Timeout protection reports long-running cells but cannot always kill a running Python thread immediately.
- The Tauri app is scaffolded for v2, but this MVP starts the Python backend manually with `npm run backend`.
- Torch is optional; deep learning training is disabled until PyTorch is installed.
- SQLite table import and image folder import are implemented backend capabilities but need fuller UI file/folder pickers.
- Frontend persistence is localStorage-first until Tauri filesystem plugins are added.
- Advanced model internals such as live activations and gradients are visible placeholders in this MVP.

## GitHub Repo Setup

If GitHub CLI is authenticated, from this repo root run:

```bash
git init
git add .
git commit -m "Initial MVP for ML Lab Studio"
gh repo create ml-lab-studio --public --source=. --remote=origin --push
```

If `gh` is not authenticated, authenticate first:

```bash
gh auth login
gh repo create ml-lab-studio --public --source=. --remote=origin --push
```
