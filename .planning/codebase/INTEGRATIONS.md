# External Integrations

**Analysis Date:** 2025-05-13

## APIs & External Services

**Chat Service (Simulated):**
- Mock implementation: `src/app/components/ChatBot.tsx`
  - Logic: Client-side keyword-based responses with simulated delays.
  - SDK/Client: Custom React hooks and `setTimeout`.

**AI Feedback (Simulated):**
- Mock implementation: `src/app/components/DiagramCanvas.tsx`
  - Logic: Random selection from a hardcoded array of feedback strings.
- Mock implementation: `src/app/components/SpecViewer.tsx`
  - Logic: Random selection from a hardcoded array of response strings for annotations.

## Data Storage

**Databases:**
- None detected.
- State management: `useState` (React) and local component states.
- Persistence: None (data is lost on page refresh).

**File Storage:**
- Local assets only (e.g., SVG as base64 in `src/app/components/figma/ImageWithFallback.tsx`).

**Caching:**
- Browser-native only.

## Authentication & Identity

**Auth Provider:**
- Custom (Mock): No actual login or authentication system is currently implemented.

## Monitoring & Observability

**Error Tracking:**
- Custom fallback UI: `src/app/components/figma/ImageWithFallback.tsx` handles image loading errors.

**Logs:**
- Console logging (if any).

## CI/CD & Deployment

**Hosting:**
- Not explicitly configured in the codebase. Standard static site deployment for Vite applications.

**CI Pipeline:**
- None detected.

## Environment Configuration

**Required env vars:**
- None detected in code.

**Secrets location:**
- Not applicable.

## Webhooks & Callbacks

**Incoming:**
- None.

**Outgoing:**
- None.

---

*Integration audit: 2025-05-13*
