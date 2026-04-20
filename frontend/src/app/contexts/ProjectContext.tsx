import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

export interface Project {
  id: string;
  name: string;
  spec: string;
  createdAt: string;
  lastModified: string;
}

interface ProjectContextType {
  projects: Project[];
  currentProject: Project | null;
  addProject: (name: string, spec: string) => Project;
  deleteProject: (id: string) => void;
  setCurrentProject: (id: string | null) => void;
  updateProjectSpec: (id: string, spec: string) => void;
  backendSessionId: string | null;
  setBackendSessionId: (id: string | null) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

const STORAGE_KEY = 'cs-tutor-projects';

const defaultProjects: Project[] = [
  {
    id: '1',
    name: 'Data Structures Assignment',
    spec: `# Data Structures Programming Assignment

## Objective
Implement a Red-Black Tree data structure in Java with full insert, delete, and search operations.

## Requirements
1. Implement the RedBlackTree class with proper balancing
2. Support generic types using Java Generics
3. Include comprehensive unit tests with JUnit
4. Time complexity: O(log n) for all operations
5. Space complexity: O(n)

## Deliverables
- Source code with documentation
- Test suite with >90% coverage
- Performance analysis report

## Due Date
April 25, 2026`,
    createdAt: '2026-03-15T10:00:00Z',
    lastModified: '2026-04-08T14:30:00Z',
  },
  {
    id: '2',
    name: 'Web Server Project',
    spec: `# HTTP Web Server Implementation

## Overview
Build a multi-threaded HTTP/1.1 web server in C++ that can serve static files and handle concurrent connections.

## Core Features
1. Parse HTTP requests (GET, POST, HEAD)
2. Serve static HTML, CSS, JS, and image files
3. Thread pool for concurrent request handling
4. Basic security (path traversal prevention)
5. Logging system for all requests

## Technical Requirements
- Use POSIX sockets
- Implement thread pooling (min 4, max 16 threads)
- Support Keep-Alive connections
- Handle at least 100 concurrent connections
- Proper error handling and status codes

## Bonus Features
- CGI script support
- Virtual hosting
- HTTPS support with OpenSSL

## Testing
Provide load testing results using Apache Bench or similar tools.`,
    createdAt: '2026-03-20T09:00:00Z',
    lastModified: '2026-04-09T16:45:00Z',
  },
];

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [currentProject, setCurrentProjectState] = useState<Project | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [backendSessionId, setBackendSessionId] = useState<string | null>(null);

  // Load projects from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setProjects(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to load projects:', e);
        setProjects(defaultProjects);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultProjects));
        } catch (storageErr) {
          console.error('Failed to save default projects to localStorage:', storageErr);
        }
      }
    } else {
      setProjects(defaultProjects);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultProjects));
      } catch (storageErr) {
        console.error('Failed to save default projects to localStorage:', storageErr);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save projects to localStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
      } catch (e) {
        console.error('Failed to save projects to localStorage:', e);
        if (e instanceof DOMException && e.name === 'QuotaExceededError') {
          alert('Storage quota exceeded! Could not save project. Try removing some projects.');
        }
      }
    }
  }, [projects, isLoaded]);

  // Sync currentProject whenever projects or currentProjectId changes
  useEffect(() => {
    if (currentProjectId) {
      const project = projects.find((p) => p.id === currentProjectId);
      setCurrentProjectState(project || null);
    } else {
      setCurrentProjectState(null);
    }
  }, [projects, currentProjectId]);

  const addProject = useCallback((name: string, spec: string): Project => {
    const newProject: Project = {
      id: Date.now().toString(),
      name,
      spec,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    };
    setProjects((prev) => [...prev, newProject]);
    return newProject;
  }, []);

  const deleteProject = useCallback((id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    if (currentProjectId === id) {
      setCurrentProjectId(null);
    }
  }, [currentProjectId]);

  const setCurrentProject = useCallback((id: string | null) => {
    setCurrentProjectId(id);
  }, []);

  const updateProjectSpec = useCallback((id: string, spec: string) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, spec, lastModified: new Date().toISOString() } : p
      )
    );
  }, []);

  return (
    <ProjectContext.Provider
      value={{
        projects,
        currentProject,
        addProject,
        deleteProject,
        setCurrentProject,
        updateProjectSpec,
        isLoaded,
        backendSessionId,
        setBackendSessionId,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjects() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  return context;
}
