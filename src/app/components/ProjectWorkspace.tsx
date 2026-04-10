import { useParams, useNavigate } from 'react-router';
import { useEffect } from 'react';
import { useProjects } from '../contexts/ProjectContext';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from './ui/resizable';
import { SpecViewer } from './SpecViewer';
import { DiagramCanvas } from './DiagramCanvas';
import { DeadlineCalendar } from './DeadlineCalendar';
import { ChatBot } from './ChatBot';
import { GraduationCap, ArrowLeft } from 'lucide-react';

export function ProjectWorkspace() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { projects, setCurrentProject, currentProject } = useProjects();

  useEffect(() => {
    if (projectId) {
      setCurrentProject(projectId);
    }
  }, [projectId, setCurrentProject]);

  // Redirect if project not found
  useEffect(() => {
    if (projectId && !projects.find((p) => p.id === projectId)) {
      navigate('/');
    }
  }, [projectId, projects, navigate]);

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
      <header className="border-b border-zinc-800 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Back to projects"
          >
            <ArrowLeft className="size-5" />
          </button>
          <GraduationCap className="size-8" />
          <div className="flex-1">
            <h1 className="text-xl font-bold">{currentProject.name}</h1>
            <p className="text-sm text-blue-100">Your intelligent companion for tackling complex projects</p>
          </div>
        </div>
      </header>

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
