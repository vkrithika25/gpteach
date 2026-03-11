import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from './components/ui/resizable';
import { SpecViewer } from './components/SpecViewer';
import { DiagramCanvas } from './components/DiagramCanvas';
import { DeadlineCalendar } from './components/DeadlineCalendar';
import { ChatBot } from './components/ChatBot';
import { GraduationCap } from 'lucide-react';

export default function App() {
  return (
    <div className="size-full flex flex-col bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
        <div className="flex items-center gap-3">
          <GraduationCap className="size-8" />
          <div>
            <h1 className="text-xl font-bold">CS Project Planning Workspace</h1>
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