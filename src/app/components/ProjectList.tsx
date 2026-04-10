import { useNavigate } from 'react-router';
import { useProjects } from '../contexts/ProjectContext';
import { GraduationCap, Upload, Calendar, Trash2, FileText, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from './ui/button';
import { Input } from './ui/input';

export function ProjectList() {
  const { projects, addProject, deleteProject } = useProjects();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [pendingFile, setPendingFile] = useState<{ name: string; content: string } | null>(null);
  const [projectName, setProjectName] = useState('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const reader = new FileReader();

    reader.onload = (event) => {
      const content = event.target?.result as string;
      const defaultName = file.name.replace(/\.(txt|md|pdf)$/i, '');

      setPendingFile({ name: defaultName, content });
      setProjectName(defaultName);
      setShowNameDialog(true);
      setUploading(false);
    };

    reader.onerror = () => {
      setUploading(false);
      alert('Failed to read file');
    };

    reader.readAsText(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCreateProject = () => {
    if (!pendingFile || !projectName.trim()) return;

    const newProject = addProject(projectName.trim(), pendingFile.content);
    setShowNameDialog(false);
    setPendingFile(null);
    setProjectName('');
    navigate(`/project/${newProject.id}`);
  };

  const handleCancelUpload = () => {
    setShowNameDialog(false);
    setPendingFile(null);
    setProjectName('');
  };

  const handleDelete = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this project?')) {
      deleteProject(projectId);
    }
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
              <button
                key={project.id}
                onClick={() => navigate(`/project/${project.id}`)}
                className="group relative bg-zinc-900 border border-zinc-800 rounded-lg p-6 text-left hover:border-blue-500 hover:bg-zinc-800 transition-all"
              >
                {/* Delete Button */}
                <button
                  onClick={(e) => handleDelete(e, project.id)}
                  className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Delete project"
                >
                  <Trash2 className="size-4" />
                </button>

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
              </button>
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
