import type { ProjectRecord } from "./types";

const PROJECTS_KEY = "mlstudio.projects";
const ACTIVE_KEY = "mlstudio.activeProject";

export function createProject(name = "Iris Demo Project", path = "sample_project"): ProjectRecord {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name,
    path,
    createdAt: now,
    updatedAt: now,
    settings: {
      trustedLocalCode: true,
      projectFormat: ".mlstudio/project.json"
    }
  };
}

export function loadProjects(): ProjectRecord[] {
  const raw = localStorage.getItem(PROJECTS_KEY);
  if (!raw) {
    return [];
  }
  try {
    return JSON.parse(raw) as ProjectRecord[];
  } catch {
    return [];
  }
}

export function saveProjects(projects: ProjectRecord[]): void {
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

export function setActiveProject(project: ProjectRecord): void {
  localStorage.setItem(ACTIVE_KEY, JSON.stringify(project));
  const projects = loadProjects().filter((item) => item.id !== project.id);
  saveProjects([project, ...projects].slice(0, 12));
}

export function getActiveProject(): ProjectRecord {
  const raw = localStorage.getItem(ACTIVE_KEY);
  if (raw) {
    try {
      return JSON.parse(raw) as ProjectRecord;
    } catch {
      localStorage.removeItem(ACTIVE_KEY);
    }
  }
  const project = createProject();
  setActiveProject(project);
  return project;
}
