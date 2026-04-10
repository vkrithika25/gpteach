# Architecture

**Analysis Date:** 2025-02-14

## Pattern Overview

**Overall:** Component-based Single Page Application (SPA)

**Key Characteristics:**
- **Panel-based Layout:** Uses `react-resizable-panels` to create a multi-pane workspace (`src/app/App.tsx`).
- **Component-Driven Development:** Each major feature (Chat, Canvas, Spec Viewer, Calendar) is encapsulated in its own component in `src/app/components/`.
- **Local State Management:** Components primarily use React `useState` and `useRef` for internal state.
- **AI-Augmented UX:** Features mocked AI interactions integrated directly into functional components (e.g., `SpecViewer.tsx`, `DiagramCanvas.tsx`, `ChatBot.tsx`).

## Layers

**UI Layer:**
- Purpose: Reusable, low-level UI primitives.
- Location: `src/app/components/ui/`
- Contains: Buttons, Cards, Inputs, Resizable panels, etc.
- Depends on: `lucide-react` for icons, `clsx` and `tailwind-merge` for styling.
- Used by: All feature components in `src/app/components/`.

**Feature Layer:**
- Purpose: High-level functional modules of the application.
- Location: `src/app/components/`
- Contains: `ChatBot.tsx`, `DeadlineCalendar.tsx`, `DiagramCanvas.tsx`, `SpecViewer.tsx`.
- Depends on: UI Layer.
- Used by: `src/app/App.tsx`.

**Application Layer:**
- Purpose: Root component and layout orchestration.
- Location: `src/app/App.tsx`, `src/main.tsx`.
- Contains: Layout structure and global styles.
- Depends on: Feature Layer, UI Layer.
- Used by: Browser/DOM.

## Data Flow

**Internal Component Flow:**

1. **User Interaction:** User interacts with a specific tool (e.g., selects text in `SpecViewer.tsx` or draws on `DiagramCanvas.tsx`).
2. **State Update:** Component updates local state (e.g., `setAnnotations`, `setIsDrawing`).
3. **AI Mocking:** Component triggers a mock AI response (e.g., `generateMockResponse` in `SpecViewer.tsx` or `getFeedback` in `DiagramCanvas.tsx`).
4. **Re-render:** UI updates to reflect new state or AI feedback.

**State Management:**
- **Local State:** Heavily used for UI-specific data (drawing coordinates, chat messages, active selections).
- **No Global Store:** Currently, there is no detected global state (e.g., Redux, Zustand) or Context API usage for cross-component communication.

## Key Abstractions

**Annotations:**
- Purpose: Represents a user-added question and AI answer tied to a specific section of the specification.
- Examples: `Annotation` interface in `src/app/components/SpecViewer.tsx`.

**Chat Messages:**
- Purpose: Represents a conversation history between the user and the AI.
- Examples: `ChatMessage` interface in `src/app/components/ChatBot.tsx`.

**Deadlines:**
- Purpose: Represents a project task with a due date and completion status.
- Examples: `Deadline` interface in `src/app/components/DeadlineCalendar.tsx`.

## Entry Points

**Main Entry Point:**
- Location: `src/main.tsx`
- Triggers: Browser page load.
- Responsibilities: Renders the `App` component into the root DOM element and imports global styles.

**App Root:**
- Location: `src/app/App.tsx`
- Triggers: Rendered by `main.tsx`.
- Responsibilities: Defines the high-level resizable layout and mounts the four main feature components.

## Error Handling

**Strategy:** Defensive programming and UI-level feedback.

**Patterns:**
- **Null Checks:** Used when accessing refs or context (e.g., `canvasRef.current`, `canvas.getContext('2d')` in `DiagramCanvas.tsx`).
- **Input Validation:** Simple checks for empty strings before processing chat or deadline additions.

## Cross-Cutting Concerns

**Logging:** Currently uses standard `console.log` (if any, though none was prominent in the core logic).
**Validation:** Basic client-side validation for forms and inputs.
**Authentication:** Not detected in the current scope.

---

*Architecture analysis: 2025-02-14*
