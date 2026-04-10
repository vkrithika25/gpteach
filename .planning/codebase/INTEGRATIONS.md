# External Integrations

**Analysis Date:** 2025-05-14

## APIs & External Services

**Chat Service:**
- Internal Mock - `src/app/components/ChatBot.tsx` contains hardcoded response logic based on keyword matching. No external LLM (OpenAI, Anthropic, etc.) is currently integrated.

**Figma Assets:**
- Figma Integration - `vite.config.ts` includes a `figmaAssetResolver` plugin to resolve `figma:asset/` paths to local files in `src/assets`.

## Data Storage

**Local Persistence:**
- Browser `localStorage` - Used to persist project data, including names and specifications.
  - Implementation: `src/app/contexts/ProjectContext.tsx`
  - Storage Key: `cs-tutor-projects`

**File Storage:**
- Local filesystem only - Assets are stored in `src/assets/`.

## Authentication & Identity

**Auth Provider:**
- None detected. The application currently operates as a standalone tool with no user accounts or authentication.

## Monitoring & Observability

**Error Tracking:**
- None detected.

**Logs:**
- Browser `console.log` for development.

## CI/CD & Deployment

**Hosting:**
- Not explicitly configured in the codebase (likely static hosting).

**CI Pipeline:**
- None detected.

## Environment Configuration

**Required env vars:**
- None detected.

**Secrets location:**
- Not detected. No `.env` or secret management in use.

## Webhooks & Callbacks

**Incoming:**
- None detected.

**Outgoing:**
- None detected.

---

*Integration audit: 2025-05-14*
