import { useParams, useNavigate } from 'react-router';
import { useEffect, useMemo, useState } from 'react';
import { useProjects } from '../contexts/ProjectContext';
import { createSession } from '../lib/api';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from './ui/resizable';
import { SpecViewer } from './SpecViewer';
import { DiagramCanvas } from './DiagramCanvas';
import { DeadlineCalendar } from './DeadlineCalendar';
import { ChatBot } from './ChatBot';
import { ArrowLeft, Calendar, FileText, MessageSquareText, Presentation } from 'lucide-react';

export function ProjectWorkspace() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { projects, setCurrentProject, currentProject, isLoaded, backendSessionId, setBackendSessionId } = useProjects();
  const [showSpec, setShowSpec] = useState(true);
  const [showCanvas, setShowCanvas] = useState(true);
  const [showCalendar, setShowCalendar] = useState(true);
  const [showChat, setShowChat] = useState(true);

  const showRight = showCalendar || showChat;
  const showAnyMain = showSpec || showCanvas || showRight;

  // Never allow hiding everything; keep canvas as the "anchor" pane.
  useEffect(() => {
    if (!showAnyMain) setShowCanvas(true);
  }, [showAnyMain]);

  const headerToggleButtonClass = (active: boolean) =>
    `inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs transition-colors ${
      active
        ? 'border-zinc-700 bg-zinc-800 text-zinc-100'
        : 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800/60 hover:text-zinc-100'
    }`;

  const mainLayout = useMemo(() => {
    const left = showSpec;
    const middle = showCanvas;
    const right = showRight;

    const count = [left, middle, right].filter(Boolean).length;
    const sizes =
      count === 1
        ? { left: 100, middle: 100, right: 100 }
        : count === 2
          ? { left: 45, middle: 55, right: 45 }
          : { left: 25, middle: 40, right: 35 };

    return { left, middle, right, sizes };
  }, [showSpec, showCanvas, showRight]);

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

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              className={headerToggleButtonClass(showSpec)}
              onClick={() => setShowSpec((v) => !v)}
              aria-pressed={showSpec}
              title="Toggle spec"
            >
              <FileText className="size-3.5" />
              Spec
            </button>
            <button
              type="button"
              className={headerToggleButtonClass(showCanvas)}
              onClick={() => setShowCanvas((v) => !v)}
              aria-pressed={showCanvas}
              title="Toggle canvas"
            >
              <Presentation className="size-3.5" />
              Canvas
            </button>
            <button
              type="button"
              className={headerToggleButtonClass(showCalendar)}
              onClick={() => setShowCalendar((v) => !v)}
              aria-pressed={showCalendar}
              title="Toggle calendar"
            >
              <Calendar className="size-3.5" />
              Calendar
            </button>
            <button
              type="button"
              className={headerToggleButtonClass(showChat)}
              onClick={() => setShowChat((v) => !v)}
              aria-pressed={showChat}
              title="Toggle chat"
            >
              <MessageSquareText className="size-3.5" />
              Chat
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* Left Panel - Spec Viewer */}
          {mainLayout.left && (
            <ResizablePanel defaultSize={mainLayout.sizes.left} minSize={20}>
              <SpecViewer />
            </ResizablePanel>
          )}

          {mainLayout.left && mainLayout.middle && <ResizableHandle />}

          {/* Middle Panel - Canvas */}
          {mainLayout.middle && (
            <ResizablePanel defaultSize={mainLayout.sizes.middle} minSize={30}>
              <DiagramCanvas />
            </ResizablePanel>
          )}

          {(mainLayout.left || mainLayout.middle) && mainLayout.right && <ResizableHandle />}

          {/* Right Panel - Calendar and Chat */}
          {mainLayout.right && (
            <ResizablePanel defaultSize={mainLayout.sizes.right} minSize={25}>
              {showCalendar && showChat ? (
                <ResizablePanelGroup direction="vertical">
                  <ResizablePanel defaultSize={40} minSize={30}>
                    <DeadlineCalendar />
                  </ResizablePanel>

                  <ResizableHandle />

                  <ResizablePanel defaultSize={60} minSize={40}>
                    <ChatBot />
                  </ResizablePanel>
                </ResizablePanelGroup>
              ) : showCalendar ? (
                <DeadlineCalendar />
              ) : (
                <ChatBot />
              )}
            </ResizablePanel>
          )}
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
