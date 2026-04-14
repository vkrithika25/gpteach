import { useNavigate } from 'react-router';
import { useProjects } from '../contexts/ProjectContext';
import { GraduationCap, Upload, Calendar, Trash2, FileText, X, AlertTriangle } from 'lucide-react';
import { useRef, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { formatSpecMarkdown, generateTimeline } from '../lib/api';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './ui/alert-dialog';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import pdfWorker from 'pdfjs-dist/legacy/build/pdf.worker.mjs?url';

// Set worker source for pdfjs using Vite's URL import
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

export function ProjectList() {
  const { projects, addProject, deleteProject } = useProjects();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [pendingFile, setPendingFile] = useState<{ name: string; content: string } | null>(null);
  const [projectName, setProjectName] = useState('');

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const defaultName = file.name.replace(/\.(txt|md|pdf)$/i, '');

    try {
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const typedArray = new Uint8Array(event.target?.result as ArrayBuffer);
            const pdf = await pdfjs.getDocument(typedArray).promise;
            let fullText = '';
            
            for (let i = 1; i <= pdf.numPages; i++) {
              const page = await pdf.getPage(i);
              const textContent = await page.getTextContent();
              let lastY = -1;
              let pageText = '';
              
              for (const item of textContent.items as any[]) {
                if (lastY !== -1 && Math.abs(item.transform[5] - lastY) > 5) {
                  pageText += '\n';
                }
                
                // Heuristic for headers: if it's much taller than average text
                // or if it stands alone on a line and is short
                const isHeader = item.height > 12;
                if (isHeader && (pageText.endsWith('\n') || pageText === '')) {
                  pageText += '### ' + item.str;
                } else {
                  pageText += item.str;
                }
                
                lastY = item.transform[5];
              }
              fullText += pageText + '\n\n';
            }
            
            // Post-process to detect lists and common patterns
            const processedText = fullText
              .split('\n')
              .map(line => {
                const trimmed = line.trim();
                // Detect bullet points
                if (/^[\u2022\u00b7\u25cf\u25cb]/.test(trimmed)) {
                  return '- ' + trimmed.substring(1).trim();
                }
                // Detect numbered lists
                if (/^\d+\s+/.test(trimmed)) {
                  return trimmed.replace(/^(\d+)\s+/, '$1. ');
                }
                return line;
              })
              .join('\n');

            // Ask backend/OpenAI to format into Markdown (verbatim words).
            let formatted = processedText.trim();
            try {
              const resp = await formatSpecMarkdown({ text: formatted });
              formatted = resp.markdown;
            } catch (e) {
              console.warn('Failed to format spec as markdown, using extracted text.', e);
            }

            setPendingFile({ name: defaultName, content: formatted });
            setProjectName(defaultName);
            setShowNameDialog(true);
            setUploading(false);
          } catch (err) {
            console.error('Error parsing PDF:', err);
            alert('Failed to parse PDF file');
            setUploading(false);
          }
        };
        reader.onerror = () => {
          alert('Failed to read file');
          setUploading(false);
        };
        reader.readAsArrayBuffer(file);
      } else {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          setPendingFile({ name: defaultName, content });
          setProjectName(defaultName);
          setShowNameDialog(true);
          setUploading(false);
        };
        reader.onerror = () => {
          alert('Failed to read file');
          setUploading(false);
        };
        reader.readAsText(file);
      }
    } catch (error) {
      console.error('File selection error:', error);
      alert('An error occurred during file selection');
      setUploading(false);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCreateProject = async () => {
    if (!pendingFile || !projectName.trim()) return;

    try {
      const newProject = addProject(projectName.trim(), pendingFile.content);

      // Generate and persist a timeline from the spec (best-effort).
      try {
        const resp = await generateTimeline({ spec_text: pendingFile.content });
        const colors = [
          'bg-blue-500',
          'bg-purple-500',
          'bg-green-500',
          'bg-orange-500',
          'bg-red-500',
          'bg-pink-500',
          'bg-yellow-500',
          'bg-cyan-500',
        ];
        const deadlines = (resp.tasks ?? []).slice(0, 10).map((t, idx) => ({
          id: `${Date.now()}-${idx}`,
          title: t.title,
          date: t.date,
          completed: false,
          color: colors[idx % colors.length],
        }));
        localStorage.setItem(`gpteach:timeline:v1:${newProject.id}`, JSON.stringify(deadlines));
      } catch (e) {
        console.warn('Failed to generate timeline; using default empty timeline.', e);
        localStorage.setItem(`gpteach:timeline:v1:${newProject.id}`, JSON.stringify([]));
      }

      setShowNameDialog(false);
      setPendingFile(null);
      setProjectName('');
      navigate(`/project/${newProject.id}`);
    } catch (error) {
      console.error('Failed to create project:', error);
      alert('Failed to create project. Please try again.');
      setShowNameDialog(false);
      setPendingFile(null);
      setProjectName('');
    }
  };

  const handleCancelUpload = () => {
    setShowNameDialog(false);
    setPendingFile(null);
    setProjectName('');
  };

  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  const handleDelete = (projectId: string) => {
    deleteProject(projectId);
    setProjectToDelete(null);
  };

  return (
    <div className="size-full flex flex-col bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <GraduationCap className="size-10" />
            <div>
              <h1 className="text-2xl font-bold">CS Project Tutor</h1>
              <p className="text-sm text-blue-100">Your intelligent companion for tackling complex projects</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Your Projects</h2>
              <p className="text-zinc-400">Select a project to continue or upload a new project spec</p>
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || showNameDialog}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="size-5" />
              {uploading ? 'Reading file...' : 'Upload Project Spec'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Project Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => navigate(`/project/${project.id}`)}
                className="group relative bg-zinc-900 border border-zinc-800 rounded-lg p-6 text-left hover:border-blue-500 hover:bg-zinc-800 transition-all cursor-pointer"
              >
                {/* Delete Button */}
                <AlertDialog 
                  open={projectToDelete === project.id} 
                  onOpenChange={(open) => !open && setProjectToDelete(null)}
                >
                  <AlertDialogTrigger asChild>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setProjectToDelete(project.id);
                      }}
                      className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg opacity-40 group-hover:opacity-100 transition-opacity z-10"
                      aria-label="Delete project"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-zinc-900 border-zinc-800 text-white" onClick={(e) => e.stopPropagation()}>
                    <AlertDialogHeader>
                      <div className="flex items-center gap-2 text-red-400 mb-2">
                        <AlertTriangle className="size-5" />
                        <AlertDialogTitle>Delete Project</AlertDialogTitle>
                      </div>
                      <AlertDialogDescription className="text-zinc-400">
                        Are you sure you want to delete <span className="text-white font-medium">"{project.name}"</span>? 
                        This action cannot be undone and all associated data will be permanently removed.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-4">
                      <AlertDialogCancel className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white border-0">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => handleDelete(project.id)}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        Delete Project
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                {/* Project Icon */}
                <div className="flex items-center justify-center size-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 mb-4">
                  <FileText className="size-6 text-white" />
                </div>

                {/* Project Info */}
                <h3 className="text-xl font-semibold text-white mb-2 pr-8">{project.name}</h3>

                <div className="flex items-center gap-2 text-sm text-zinc-400 mb-3">
                  <Calendar className="size-4" />
                  <span>Updated {formatDistanceToNow(new Date(project.lastModified), { addSuffix: true })}</span>
                </div>

                {/* Spec Preview */}
                <p className="text-sm text-zinc-500 line-clamp-3">
                  {project.spec.substring(0, 150)}...
                </p>

                {/* Hover Indicator */}
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex items-center gap-1 text-sm text-blue-400">
                    Open
                    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}

            {/* Empty State */}
            {projects.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
                <FileText className="size-16 text-zinc-700 mb-4" />
                <h3 className="text-xl font-semibold text-zinc-400 mb-2">No projects yet</h3>
                <p className="text-zinc-500 mb-6">Upload a project spec to get started</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
                >
                  Upload Your First Project
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Name Project Dialog */}
      {showNameDialog && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">Name Your Project</h3>
              <button
                onClick={handleCancelUpload}
                className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            <p className="text-sm text-zinc-400 mb-4">
              Give your project a descriptive name to easily identify it later.
            </p>

            <div className="space-y-4">
              <div>
                <label htmlFor="project-name" className="block text-sm font-medium text-zinc-300 mb-2">
                  Project Name
                </label>
                <Input
                  id="project-name"
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g., Database System Project"
                  className="w-full bg-zinc-800 border-zinc-700 text-white"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && projectName.trim()) {
                      handleCreateProject();
                    }
                  }}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleCreateProject}
                  disabled={!projectName.trim()}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  Create Project
                </Button>
                <Button
                  onClick={handleCancelUpload}
                  variant="outline"
                  className="flex-1 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
