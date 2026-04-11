# Codebase Concerns

**Analysis Date:** 2025-02-13

## Tech Debt

**Rule-based "AI" Simulation:**
- Issue: The ChatBot, Diagram Canvas feedback, and Spec Viewer annotations use hardcoded rules or random mock responses instead of a real LLM integration.
- Files: `src/app/components/ChatBot.tsx`, `src/app/components/DiagramCanvas.tsx`, `src/app/components/SpecViewer.tsx`
- Impact: The core value proposition (AI tutoring) is simulated and non-functional for real-world scenarios.
- Fix approach: Integrate with an LLM API (e.g., OpenAI, Anthropic) via a secure backend or client-side SDK.

**Inconsistent State Persistence:**
- Issue: Only projects and specs are persisted in `localStorage`. Chat history, diagrams, annotations, and deadlines are stored in component state and lost on refresh.
- Files: `src/app/contexts/ProjectContext.tsx`, `src/app/components/SpecViewer.tsx`, `src/app/components/DiagramCanvas.tsx`, `src/app/components/DeadlineCalendar.tsx`
- Impact: Poor user experience as progress is lost frequently.
- Fix approach: Centralize state management and implement a robust persistence layer (e.g., IndexedDB or a backend database).

**Fragile Annotation Selection:**
- Issue: `SpecViewer` relies on calculated text offsets and `data-section-id` for annotations.
- Files: `src/app/components/SpecViewer.tsx`
- Impact: Editing the project specification will likely shift text and break existing annotations or make them point to the wrong text.
- Fix approach: Implement a more robust anchoring system for annotations (e.g., using unique IDs for segments or fuzzy matching).

## Security Considerations

**Lack of Authentication:**
- Risk: No user accounts or authentication. All data is stored in the browser's `localStorage` and is accessible to anyone using the same browser profile.
- Files: `src/app/contexts/ProjectContext.tsx`
- Current mitigation: None.
- Recommendations: Implement a proper authentication system and store data in a secure per-user database.

**Client-side Data Storage:**
- Risk: Storing project specs and potential user-sensitive data in `localStorage` without encryption.
- Files: `src/app/contexts/ProjectContext.tsx`
- Current mitigation: None.
- Recommendations: If staying client-side, consider encrypting sensitive data before storage.

## Performance Bottlenecks

**LocalStorage Size Limits:**
- Problem: `localStorage` is typically limited to ~5MB. Large project specifications or many projects could exceed this limit.
- Files: `src/app/contexts/ProjectContext.tsx`
- Cause: Storing all project data as a JSON string in a single `localStorage` key.
- Improvement path: Migrate to `IndexedDB` (via `dexie` or `idb`) for higher capacity and better performance with structured data.

**Canvas Resize Handling:**
- Problem: `DiagramCanvas` redrawing on resize might be inefficient or lose fidelity if the aspect ratio changes significantly.
- Files: `src/app/components/DiagramCanvas.tsx`
- Cause: Direct use of `getImageData` and `putImageData` without scaling logic.
- Improvement path: Use a vector-based drawing approach or a library like `react-konva` or `fabric.js`.

## Fragile Areas

**Markdown Parsing Logic:**
- Files: `src/app/components/SpecViewer.tsx`
- Why fragile: Uses simple regex-based line parsing for headings and lists instead of a full markdown parser.
- Safe modification: Be careful when adding support for more markdown features (tables, code blocks, etc.).
- Test coverage: None detected.

## Scaling Limits

**Single-User / Single-Device:**
- Current capacity: One user per browser.
- Limit: No synchronization across devices or collaboration features.
- Scaling path: Implement a backend API with a database and user accounts.

## Missing Critical Features

**Undo/Redo in Canvas:**
- Problem: No way to undo mistakes in the Diagram Canvas.
- Blocks: Users from making complex diagrams easily.

**Date Validation and Sorting:**
- Problem: Deadlines use plain strings for dates.
- Blocks: Automated sorting, notifications, or calendar integrations.

**Chat History Per Project:**
- Problem: Chat messages are global and not associated with a specific project.
- Blocks: Context-aware assistance when switching between different projects.

## Test Coverage Gaps

**Context and Core Logic:**
- What's not tested: `ProjectContext` state transitions, markdown parsing in `SpecViewer`, and deadline management logic.
- Files: `src/app/contexts/ProjectContext.tsx`, `src/app/components/SpecViewer.tsx`, `src/app/components/DeadlineCalendar.tsx`
- Risk: Regressions in project management or data corruption in `localStorage` might go unnoticed.
- Priority: Medium

---

*Concerns audit: 2025-02-13*
