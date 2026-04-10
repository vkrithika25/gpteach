# Testing Patterns

**Analysis Date:** 2025-02-17

## Test Framework

**Runner:**
- **Not detected.** There is no test runner (like Vitest or Jest) configured in `package.json` or `vite.config.ts`.

**Assertion Library:**
- **Not detected.**

**Run Commands:**
```bash
# No testing commands found in package.json
```

## Test File Organization

**Location:**
- **Not detected.** No test files (`.test.ts`, `.spec.ts`, etc.) were found in the `src/` directory.

**Naming:**
- Recommended: `[filename].test.tsx` or `[filename].spec.tsx` located alongside the source file.

## Test Structure

**Suite Organization:**
```typescript
// Recommended pattern for future use (using Vitest/React Testing Library)
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    // expectations...
  });
});
```

## Mocking

**Framework:** None.

**What to Mock:**
- External API calls (none currently implemented).
- Complex canvas operations if needed for `DiagramCanvas.tsx`.

## Fixtures and Factories

**Test Data:**
- Mock data currently exists inline within components (e.g., `defaultResponses` in `src/app/components/ChatBot.tsx`).

**Location:**
- Inline in components. Recommended to move to `src/tests/fixtures/` or similar.

## Coverage

**Requirements:** None enforced.

## Test Types

**Unit Tests:**
- Recommended for utility functions like `cn` in `src/app/components/ui/utils.ts`.
- Recommended for helper functions like `generateBotResponse` in `src/app/components/ChatBot.tsx`.

**Integration Tests:**
- Recommended for testing component interactions (e.g., sending a chat message and seeing the bot response).

**E2E Tests:**
- Not used.

## Common Patterns

**Async Testing:**
- Recommended for testing the simulated bot typing delay in `ChatBot.tsx`.

**Error Testing:**
- Recommended for edge cases in text selection in `SpecViewer.tsx`.

---

*Testing analysis: 2025-02-17*
