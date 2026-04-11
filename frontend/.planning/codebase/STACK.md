# Technology Stack

**Analysis Date:** 2025-05-14

## Languages

**Primary:**
- TypeScript - Primary language for application logic and components.

**Secondary:**
- CSS - Global styles and Tailwind overrides.
- HTML - Base entry point `index.html`.

## Runtime

**Environment:**
- Browser - Client-side execution.
- Node.js - Development and build environment.

**Package Manager:**
- pnpm - Package manager (defined in `pnpm-workspace.yaml`).
- Lockfile: `package-lock.json` (Note: package.json mentions pnpm, but a package-lock.json exists, suggesting npm might have been used or it's a hybrid setup).

## Frameworks

**Core:**
- React 18.3.1 - Component-based UI library.
- React Router 7.13.0 - Application routing.

**UI & Styling:**
- Tailwind CSS 4.1.12 - Styling framework.
- Radix UI - Headless UI primitives (multiple `@radix-ui/react-*` packages).
- MUI (Material UI) 7.3.5 - Component library and icons.
- Lucide React 0.487.0 - Icon library.
- Framer Motion (via `motion`) - Animation library.
- Sonner - Toast notifications.
- Vaul - Drawer components.

**Data & Utils:**
- Recharts 2.15.2 - Charting and data visualization.
- date-fns 3.6.0 - Date manipulation.
- react-hook-form 7.55.0 - Form management.
- react-dnd 16.0.1 - Drag and drop functionality.
- cmdk 1.1.1 - Command menu primitive.

**Build/Dev:**
- Vite 6.4.2 - Build tool and development server.
- PostCSS - CSS processing.

## Key Dependencies

**Critical:**
- `react-router` - Handles navigation between project list and workspace.
- `ProjectContext` - Custom context in `src/app/contexts/ProjectContext.tsx` for state management.

**Infrastructure:**
- `@tailwindcss/vite` - Vite plugin for Tailwind CSS integration.

## Configuration

**Environment:**
- Browser-based - No server-side environment detected.

**Build:**
- `vite.config.ts` - Vite configuration with a custom `figmaAssetResolver` plugin.
- `postcss.config.mjs` - PostCSS configuration.
- `package.json` - Build scripts and dependency definitions.

## Platform Requirements

**Development:**
- Node.js and pnpm/npm.

**Production:**
- Static site hosting (e.g., Vercel, Netlify, GitHub Pages).

---

*Stack analysis: 2025-05-14*
