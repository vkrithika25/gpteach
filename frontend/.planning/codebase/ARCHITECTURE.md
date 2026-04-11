# Architecture

**Analysis Date:** 2025-03-05

## Pattern Overview

**Overall:** Client-side Single Page Application (SPA).

**Key Characteristics:**
- **Component-Based UI:** Modular, reusable UI built with React components.
- **Centralized State Management:** Global project data and application state managed via React Context.
- **Client-Side Persistence:** Project data is persisted to the browser's `localStorage`.
- **Responsive Workspace Layout:** Flexible, multi-panel interface using resizable panels.

## Layers

**Presentation Layer:**
- Purpose: Renders the user interface and handles user interactions.
- Location: `src/app/components/`
- Contains: React components, hooks, and local UI state.
- Depends on: UI components from `src/app/components/ui/` and global state from `src/app/contexts/`.
- Used by: The root application in `src/app/App.tsx`.

**State Management Layer:**
- Purpose: Manages global application state and business logic related to projects.
- Location: `src/app/contexts/`
- Contains: `ProjectContext.tsx` providing project data and update functions.
- Depends on: Browser `localStorage` for persistence.
- Used by: Most presentation components to access or modify project data.

**UI Library Layer:**
- Purpose: Provides low-level, reusable UI primitives.
- Location: `src/app/components/ui/`
- Contains: Shadcn UI components (built on Radix UI).
- Depends on: Tailwind CSS for styling and `lucide-react` for icons.
- Used by: All components in the presentation layer.

## Data Flow

**Project Initialization:**
1. `ProjectProvider` in `src/app/contexts/ProjectContext.tsx` initializes on mount.
2. It attempts to load projects from `localStorage`.
3. If no projects are found, it populates the state with default projects.
4. The `projects` state is provided to the entire component tree.

**Project Workspace Interaction:**
1. User selects a project from `ProjectList.tsx`, which navigates to `/project/:projectId`.
2. `ProjectWorkspace.tsx` reads the `projectId` from the URL.
3. It calls `setCurrentProject` from `ProjectContext` to set the active project.
4. Workspace sub-components (`SpecViewer`, `DiagramCanvas`, etc.) consume the `currentProject` data from the context.

**Project Data Updates:**
1. A component (e.g., `SpecViewer.tsx`) triggers an update via `updateProjectSpec` from `ProjectContext`.
2. The context updates its internal `projects` state.
3. An `useEffect` in the context detects the state change and persists the updated data to `localStorage`.

## Key Abstractions

**Project:**
- Purpose: Represents the core data entity of the application.
- Examples: Defined as an interface in `src/app/contexts/ProjectContext.tsx`.
- Pattern: Simple data object with properties like `id`, `name`, `spec`, and timestamps.

**ProjectContext:**
- Purpose: Acts as a central repository for project data and operations.
- Examples: `src/app/contexts/ProjectContext.tsx`.
- Pattern: Provider pattern using React Context and hooks (`useProjects`).

**Resizable Workspace:**
- Purpose: Provides a flexible layout for multiple tools.
- Examples: `src/app/components/ProjectWorkspace.tsx`.
- Pattern: Uses `react-resizable-panels` to manage a multi-pane interface.

## Entry Points

**Main Entry Point:**
- Location: `src/main.tsx`
- Triggers: Browser loading `index.html`.
- Responsibilities: Renders the root `App` component into the DOM.

**App Root:**
- Location: `src/app/App.tsx`
- Triggers: Rendered by `main.tsx`.
- Responsibilities: Wraps the application in `ProjectProvider` and sets up the `RouterProvider`.

**Router Configuration:**
- Location: `src/app/routes.tsx`
- Triggers: `RouterProvider` in `App.tsx`.
- Responsibilities: Defines mapping between URL paths and top-level components (`ProjectList`, `ProjectWorkspace`).

## Error Handling

**Strategy:** Localized error handling within components and basic 404 routing.

**Patterns:**
- **404 Route:** A catch-all route in `src/app/routes.tsx` for undefined paths.
- **Context Error:** A check in `useProjects` hook to ensure it's used within a provider.
- **LocalStorage Error Handling:** Try-catch block in `ProjectContext.tsx` when parsing JSON from storage.

## Cross-Cutting Concerns

**Logging:** Uses standard `console.error` for persistence failures in `src/app/contexts/ProjectContext.tsx`.
**Validation:** Basic ID-based checks in `ProjectWorkspace.tsx` to redirect if a project is not found.
**Authentication:** Not currently implemented (application is local-only).
**Styling:** Global styles managed through Tailwind CSS in `src/styles/` and component-level classes.

---

*Architecture analysis: 2025-03-05*
