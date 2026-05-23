#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::{
    fs::{create_dir_all, OpenOptions},
    net::TcpStream,
    path::{Path, PathBuf},
    process::{Child, Command, Stdio},
    sync::Mutex,
    thread::sleep,
    time::{Duration, SystemTime, UNIX_EPOCH},
};

use tauri::Manager;

struct BackendProcess(Mutex<Option<Child>>);

impl Drop for BackendProcess {
    fn drop(&mut self) {
        if let Ok(mut child) = self.0.lock() {
            if let Some(mut process) = child.take() {
                let _ = process.kill();
            }
        }
    }
}

fn backend_is_running() -> bool {
    "127.0.0.1:8765"
        .parse()
        .ok()
        .and_then(|address| TcpStream::connect_timeout(&address, Duration::from_millis(250)).ok())
        .is_some()
}

fn backend_dir(app: &tauri::App) -> PathBuf {
    if let Ok(resource_dir) = app.path().resource_dir() {
        for bundled_backend in [
            resource_dir.join("backend"),
            resource_dir.join("_up_").join("backend"),
        ] {
            if bundled_backend.exists() {
                return bundled_backend;
            }
        }
    }

    std::env::current_dir()
        .map(|cwd| cwd.join("backend"))
        .unwrap_or_else(|_| PathBuf::from("backend"))
}

fn backend_sidecar(app: &tauri::App) -> Option<PathBuf> {
    let executable = if cfg!(target_os = "windows") {
        "ml-lab-studio-backend.exe"
    } else {
        "ml-lab-studio-backend"
    };

    let mut candidates = vec![PathBuf::from("sidecars").join(executable)];

    if let Ok(current_dir) = std::env::current_dir() {
        candidates.push(current_dir.join("sidecars").join(executable));
    }

    if let Ok(resource_dir) = app.path().resource_dir() {
        candidates.extend([
            resource_dir.join("sidecars").join(executable),
            resource_dir.join("_up_").join("sidecars").join(executable),
        ]);
    }

    candidates
        .into_iter()
        .find(|path| path.exists())
        .map(|path| path.canonicalize().unwrap_or(path))
}

fn backend_log_file(app: &tauri::App) -> Stdio {
    let log_dir = app
        .path()
        .app_log_dir()
        .unwrap_or_else(|_| std::env::temp_dir().join("ML Lab Studio").join("logs"));
    let _ = create_dir_all(&log_dir);
    let log_path = log_dir.join("backend.log");

    OpenOptions::new()
        .create(true)
        .append(true)
        .open(log_path)
        .map(Stdio::from)
        .unwrap_or_else(|_| Stdio::null())
}

fn backend_working_dir(app: &tauri::App) -> PathBuf {
    let mut candidates = Vec::new();

    if let Ok(resource_dir) = app.path().resource_dir() {
        candidates.push(resource_dir.join("_up_"));
        candidates.push(resource_dir);
    }

    if let Ok(current_dir) = std::env::current_dir() {
        candidates.push(current_dir);
    }

    candidates
        .into_iter()
        .find(|path| path.join("sample_project").exists())
        .unwrap_or_else(|| std::env::current_dir().unwrap_or_else(|_| PathBuf::from(".")))
}

fn backend_data_dir(app: &tauri::App) -> PathBuf {
    let data_dir = app
        .path()
        .app_data_dir()
        .unwrap_or_else(|_| std::env::temp_dir().join("ML Lab Studio").join("data"));
    let _ = create_dir_all(&data_dir);
    data_dir
}

fn backend_started(child: &mut Child) -> bool {
    for _ in 0..40 {
        if backend_is_running() {
            return true;
        }

        if matches!(child.try_wait(), Ok(Some(_))) {
            return false;
        }

        sleep(Duration::from_millis(250));
    }

    true
}

fn spawn_backend_command(app: &tauri::App, executable: &Path, args: &[&str]) -> Option<Child> {
    let stdout = backend_log_file(app);
    let stderr = backend_log_file(app);
    let working_dir = backend_working_dir(app);
    let data_dir = backend_data_dir(app);
    let matplotlib_dir = data_dir.join("matplotlib");
    let _ = create_dir_all(&matplotlib_dir);

    Command::new(executable)
        .args(args)
        .current_dir(working_dir)
        .env("ML_LAB_BACKEND_HOST", "127.0.0.1")
        .env("ML_LAB_BACKEND_PORT", "8765")
        .env("MLSTUDIO_HOME", data_dir)
        .env("MPLBACKEND", "Agg")
        .env("MPLCONFIGDIR", matplotlib_dir)
        .env(
            "ML_LAB_BACKEND_STARTED_AT",
            SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .map(|duration| duration.as_secs().to_string())
                .unwrap_or_default(),
        )
        .stdin(Stdio::null())
        .stdout(stdout)
        .stderr(stderr)
        .spawn()
        .ok()
        .and_then(|mut child| {
            if backend_started(&mut child) {
                Some(child)
            } else {
                None
            }
        })
}

fn spawn_python_backend(app: &tauri::App) -> Option<Child> {
    if backend_is_running() {
        return None;
    }

    if let Some(sidecar) = backend_sidecar(app) {
        if let Some(child) = spawn_backend_command(app, &sidecar, &[]) {
            return Some(child);
        }
    }

    let python = PathBuf::from(if cfg!(target_os = "windows") {
        "python"
    } else {
        "python3"
    });
    let backend_path = backend_dir(app).to_string_lossy().to_string();

    spawn_backend_command(
        app,
        &python,
        &[
            "-m",
            "uvicorn",
            "app.main:app",
            "--app-dir",
            &backend_path,
            "--host",
            "127.0.0.1",
            "--port",
            "8765",
        ],
    )
}

fn main() {
    tauri::Builder::default()
        .manage(BackendProcess(Mutex::new(None)))
        .setup(|app| {
            if let Some(child) = spawn_python_backend(app) {
                let state = app.state::<BackendProcess>();
                *state.0.lock().expect("backend process mutex poisoned") = Some(child);
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running ML Lab Studio");
}
