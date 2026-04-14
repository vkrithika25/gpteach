import { useParams, useNavigate } from 'react-router';
import { useEffect } from 'react';
import { useProjects } from '../contexts/ProjectContext';
import { createSession } from '../lib/api';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from './ui/resizable';
import { SpecViewer } from './SpecViewer';
import { DiagramCanvas } from './DiagramCanvas';
import { DeadlineCalendar } from './DeadlineCalendar';
import { ChatBot } from './ChatBot';
import { ArrowLeft } from 'lucide-react';

export function ProjectWorkspace() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { projects, setCurrentProject, currentProject, isLoaded, backendSessionId, setBackendSessionId } = useProjects();

  useEffect(() => {
    if (projectId) {
      setCurrentProject(projectId);
    }
  }, [projectId, setCurrentProject]);

  // Create a backend session when the project loads
  useEffect(() => {
    if (!currentProject || backendSessionId) return;

    createSession({
      project_spec_text: currentProject.spec,
      title: currentProject.name,
      assignment_name: currentProject.name,
    })
      .then((session) => setBackendSessionId(session.id))
      .catch((err) => console.error('Failed to create backend session:', err));
  }, [currentProject, backendSessionId, setBackendSessionId]);

  // Clear backend session when leaving the workspace
  useEffect(() => {
    return () => setBackendSessionId(null);
  }, [setBackendSessionId]);

  // Redirect if project not found after loading
  useEffect(() => {
    if (isLoaded && projectId && !projects.find((p) => p.id === projectId)) {
      navigate('/');
    }
  }, [isLoaded, projectId, projects, navigate]);

  if (!currentProject) {
    return (
      <div className="size-full flex items-center justify-center bg-zinc-950">
        <div className="text-center">
          <p className="text-zinc-400 mb-4">Loading project...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="size-full flex flex-col bg-zinc-950">
      {/* Header */}
      <div className="px-4 pt-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-md text-zinc-300 hover:text-zinc-100 hover:bg-zinc-900 transition-colors"
            aria-label="Back to projects"
          >
            <ArrowLeft className="size-4" />
          </button>
          <header className="inline-flex items-center rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5">
            <h1 className="text-sm font-semibold text-zinc-100">{currentProject.name}</h1>
          </header>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* Left Panel - Spec Viewer */}
          <ResizablePanel defaultSize={25} minSize={20}>
            <SpecViewer />
          </ResizablePanel>

          <ResizableHandle />

          {/* Middle Panel - Canvas */}
          <ResizablePanel defaultSize={40} minSize={30}>
            <DiagramCanvas />
          </ResizablePanel>

          <ResizableHandle />

          {/* Right Panel - Calendar and Chat */}
          <ResizablePanel defaultSize={35} minSize={25}>
            <ResizablePanelGroup direction="vertical">
              <ResizablePanel defaultSize={40} minSize={30}>
                <DeadlineCalendar />
              </ResizablePanel>

              <ResizableHandle />

              <ResizablePanel defaultSize={60} minSize={40}>
                <ChatBot />
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
