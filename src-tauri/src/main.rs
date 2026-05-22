#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::{
    net::TcpStream,
    path::PathBuf,
    process::{Child, Command, Stdio},
    sync::Mutex,
    time::Duration,
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
        let bundled_backend = resource_dir.join("backend");
        if bundled_backend.exists() {
            return bundled_backend;
        }
    }

    std::env::current_dir()
        .map(|cwd| cwd.join("backend"))
        .unwrap_or_else(|_| PathBuf::from("backend"))
}

fn spawn_python_backend(app: &tauri::App) -> Option<Child> {
    if backend_is_running() {
        return None;
    }

    let python = if cfg!(target_os = "windows") {
        "python"
    } else {
        "python3"
    };
    let backend_path = backend_dir(app).to_string_lossy().to_string();

    Command::new(python)
        .args([
            "-m",
            "uvicorn",
            "app.main:app",
            "--app-dir",
            &backend_path,
            "--host",
            "127.0.0.1",
            "--port",
            "8765",
        ])
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn()
        .ok()
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
