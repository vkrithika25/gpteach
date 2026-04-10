import { createBrowserRouter } from 'react-router';
import { ProjectList } from './components/ProjectList';
import { ProjectWorkspace } from './components/ProjectWorkspace';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: ProjectList,
  },
  {
    path: '/project/:projectId',
    Component: ProjectWorkspace,
  },
  {
    path: '*',
    Component: () => (
      <div className="size-full flex items-center justify-center bg-zinc-950">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">404 - Page Not Found</h1>
          <p className="text-zinc-400">The page you're looking for doesn't exist.</p>
        </div>
      </div>
    ),
  },
]);
