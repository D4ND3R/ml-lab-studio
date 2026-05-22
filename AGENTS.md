# AGENTS.md

Guidance for future Codex agents working on ML Lab Studio:

- Keep the app cross-platform for Windows and macOS.
- Do not hardcode Windows-only paths.
- Keep the Python backend separated from the frontend.
- Keep the default developer experience desktop-first. `npm run dev` should open Tauri, not ask the user to open a browser tab.
- Vite is allowed as Tauri's internal development server, but browser-only workflows must stay secondary.
- Avoid unsafe execution beyond the local notebook sandbox.
- Add tests for backend logic.
- Prefer TypeScript types over `any`.
- Keep the MVP usable before adding advanced features.
- Every feature must have a visible UI entry point.
- Do not remove existing functionality when refactoring.
- Use "neural network," not "neuronal network," in code, UI, and README.
- Torch must remain optional unless explicitly enabled.
- Classical ML features must work even if PyTorch is not installed.
