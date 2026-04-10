# Codebase Concerns

**Analysis Date:** 2025-02-26

## Tech Debt

**Mock-heavy implementation:**
- Issue: The core features of the application (AI chat, AI feedback on diagrams, AI annotations on specs) are currently implemented using hardcoded mock responses and `Math.random()`.
- Files: `src/app/components/ChatBot.tsx`, `src/app/components/DiagramCanvas.tsx`, `src/app/components/SpecViewer.tsx`, `src/app/components/DeadlineCalendar.tsx`
- Impact: The application is currently a static prototype/demo. None of the AI features actually work with a real LLM.
- Fix approach: Integrate with an AI service (e.g., OpenAI, Anthropic) or a backend proxy that handles LLM calls.

**Canvas State Management:**
- Issue: `DiagramCanvas.tsx` uses `getImageData` and `putImageData` to preserve canvas content during window resizing. This is inefficient for large canvases and does not handle high-DPI (Retina) displays correctly.
- Files: `src/app/components/DiagramCanvas.tsx`
- Impact: Potential performance lag and blurry rendering on high-resolution screens.
- Fix approach: Use an off-screen canvas to store drawing state or transition to a vector-based library (e.g., Konva, Fabric.js) or SVG.

**Monolithic UI Components:**
- Issue: Several components are reaching high complexity with hundreds of lines of code and many `useState` hooks managing independent state.
- Files: `src/app/components/SpecViewer.tsx` (469 lines), `src/app/components/DeadlineCalendar.tsx` (298 lines), `src/app/components/DiagramCanvas.tsx` (277 lines).
- Impact: Increasing difficulty in maintenance, testing, and debugging.
- Fix approach: Refactor into smaller sub-components and extract business logic into custom hooks (e.g., `useCanvas`, `useAnnotations`, `useChat`).

## Known Bugs

**Overlapping Highlights:**
- Symptoms: The `renderTextWithHighlights` function in `SpecViewer.tsx` sorts annotations by start offset but does not explicitly handle cases where highlights might overlap or nest.
- Files: `src/app/components/SpecViewer.tsx`
- Trigger: Create two annotations that share some text characters.
- Workaround: Avoid overlapping highlights.

## Security Considerations

**Unprotected Environment Variables:**
- Risk: While no real API keys are currently used, the project structure lacks a clear strategy for managing secrets when AI/backend integration is added.
- Files: `package.json` (no `.env` management visible in scripts)
- Current mitigation: None (only mock data used currently).
- Recommendations: Add `dotenv` or ensure Vite environment variable patterns are followed (`VITE_*`) and `.env` files are properly gitignored.

## Performance Bottlenecks

**Annotation Rendering:**
- Problem: `renderTextWithHighlights` performs string manipulation and array mapping on every render for every section of the specification.
- Files: `src/app/components/SpecViewer.tsx`
- Cause: React component re-renders trigger expensive text processing.
- Improvement path: Use `useMemo` to cache the rendered highlights based on the `annotations` and `text` content.

## Fragile Areas

**Text Selection Logic:**
- Files: `src/app/components/SpecViewer.tsx`
- Why fragile: Uses native `window.getSelection()` and `Range` APIs which can be inconsistent across browsers and are difficult to map back to React's virtual DOM structure reliably, especially when text is already wrapped in highlight tags.
- Safe modification: Ensure tests are added for various selection scenarios (start/end in different nodes).
- Test coverage: 0%

**Canvas Resizing:**
- Files: `src/app/components/DiagramCanvas.tsx`
- Why fragile: The `updateCanvasSize` effect re-initializes context and attempts to restore state via `putImageData`, which is prone to race conditions and loss of state if the resize event isn't handled perfectly.
- Safe modification: Move canvas sizing logic into a dedicated hook and use a more robust drawing state representation (e.g., an array of paths).

## Scaling Limits

**No State Persistence:**
- Current capacity: Memory-only (lost on refresh).
- Limit: User loses all work (diagrams, annotations, chat history, deadlines) if the page is reloaded.
- Scaling path: Integrate with local storage (browser) or a persistent database (PostgreSQL/Supabase/Firebase).

## Missing Critical Features

**Lack of Backend/API Integration:**
- Problem: Entirely client-side with no networking.
- Blocks: Collaborative features, persistent saving, real AI processing.

**Test Suite:**
- Problem: No automated tests (unit, integration, or E2E).
- Blocks: Confidence in refactoring and long-term stability.

## Test Coverage Gaps

**Entire Codebase:**
- What's not tested: Every component and utility.
- Files: `src/**/*.tsx`, `src/**/*.ts`
- Risk: Regressions are inevitable as the project grows; logic bugs in complex components like `SpecViewer` or `DiagramCanvas` will go unnoticed.
- Priority: High

---

*Concerns audit: 2025-02-26*
