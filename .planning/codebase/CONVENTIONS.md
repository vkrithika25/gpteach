# Coding Conventions

**Analysis Date:** 2025-02-17

## Naming Patterns

**Files:**
- React components: PascalCase with `.tsx` extension (e.g., `src/app/components/ChatBot.tsx`, `src/app/components/SpecViewer.tsx`).
- Utility files: camelCase with `.ts` extension (e.g., `src/app/components/ui/utils.ts`).
- Styles: Mostly CSS files in `src/styles/` (e.g., `index.css`, `theme.css`).

**Functions:**
- Components: PascalCase named exports (e.g., `export function ChatBot()`).
- Internal helper functions: camelCase (e.g., `generateBotResponse`).
- Event handlers: `handle` prefix followed by the event (e.g., `handleSend`, `handleTextSelect`).

**Variables:**
- State and local variables: camelCase (e.g., `messages`, `input`, `isTyping`).
- Constants: camelCase or UPPER_CASE for configuration-like arrays (e.g., `colors`, `highlightColors` in `src/app/components/SpecViewer.tsx`).

**Types:**
- Interfaces: PascalCase (e.g., `interface ChatMessage`, `interface Annotation`).
- Type aliases: PascalCase (e.g., `type Tool = 'pen' | 'eraser' | ...`).

## Code Style

**Formatting:**
- Not explicitly configured (no `.prettierrc`), but follows standard Prettier-like defaults (2-space indentation, semicolons used).

**Linting:**
- Not explicitly configured (no `.eslintrc`), but TypeScript is used for type safety.

## Import Organization

**Order:**
1. React hooks and core libraries (`react`).
2. UI components from `src/app/components/ui/`.
3. Icons from `lucide-react`.
4. Other local components.
5. Styles and assets.

**Path Aliases:**
- `@/` maps to `src/` as defined in `vite.config.ts`.
  - Example: `import { cn } from "@/app/components/ui/utils"` (though most local imports use relative paths like `./ui/button`).

## Error Handling

**Patterns:**
- Primarily defensive programming with early returns (e.g., `if (!input.trim()) return;`).
- Basic validation before state updates.

## Logging

**Framework:** `console` (not explicitly used in components, but available).

**Patterns:**
- No formal logging pattern observed in the UI components.

## Comments

**When to Comment:**
- Section headers in large components (e.g., `{/* Header */}` in `src/app/App.tsx`).
- Explaining complex logic (e.g., text selection offset calculation in `src/app/components/SpecViewer.tsx`).

**JSDoc/TSDoc:**
- Minimal usage; types are primarily defined via TypeScript interfaces.

## Function Design

**Size:**
- Components tend to be somewhat large (200-400 lines), containing both UI and internal logic/mock data generators.

**Parameters:**
- React props for components (though many main components currently take no props).
- Standard TypeScript parameter typing.

**Return Values:**
- JSX for components.
- Explicit return types for helper functions when possible.

## Module Design

**Exports:**
- Primarily named exports for components (`export function Component()`).
- `export default` is used for the main entry point `src/app/App.tsx`.

**Barrel Files:**
- Not used; components are imported directly from their respective files.

---

*Convention analysis: 2025-02-17*
