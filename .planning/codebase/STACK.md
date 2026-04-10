# Technology Stack

**Analysis Date:** 2025-05-13

## Languages

**Primary:**
- TypeScript 5.x - Used for all source code components and logic in `src/`.
- TSX - Used for React components in `src/app/components/` and `src/app/App.tsx`.

**Secondary:**
- CSS - Used for styling in `src/styles/` including `tailwind.css` and `theme.css`.

## Runtime

**Environment:**
- Node.js (Vite development server)

**Package Manager:**
- pnpm 9.x (Based on `pnpm` override in `package.json`)
- Lockfile: `package-lock.json` (Note: `package-lock.json` exists but `package.json` has `pnpm` configuration; might be a mixed environment or transitioning)

## Frameworks

**Core:**
- React 18.3.1 - UI library used for the entire application.
- Vite 6.x - Build tool and development server.
- React Router 7.13.0 - Used for routing (installed, but currently simple SPA).

**UI Components:**
- Radix UI - Primitive UI components (Accordion, Alert Dialog, Avatar, etc.) in `src/app/components/ui/`.
- MUI Material & Icons 7.3.5 - Used for icons and some UI elements.
- Lucide React 0.487.0 - Primary icon library.
- Shadcn/UI (Pattern) - The codebase follows the shadcn/ui pattern for component organization in `src/app/components/ui/`.

**Styling:**
- Tailwind CSS 4.1.12 - Utility-first CSS framework.
- Emotion 11.x - CSS-in-JS library used primarily for MUI components.

**Charts & Data Visualization:**
- Recharts 2.15.2 - Used for data visualization.

**Animation:**
- Motion 12.x - Used for animations and transitions.

## Key Dependencies

**Critical:**
- `react-hook-form` 7.55.0 - Form state management.
- `vaul` 1.1.2 - Drawer component.
- `sonner` 2.0.3 - Toast notifications.
- `embla-carousel-react` 8.6.0 - Carousel functionality.
- `date-fns` 3.6.0 - Date manipulation.

**Infrastructure:**
- `@tailwindcss/vite` 4.1.12 - Vite plugin for Tailwind CSS integration.

## Configuration

**Environment:**
- Configured via `vite.config.ts`.
- No `.env` files detected in the root directory.

**Build:**
- `vite.config.ts` - Main build configuration.
- `postcss.config.mjs` - PostCSS configuration for Tailwind.
- `tsconfig.json` - TypeScript configuration.

## Platform Requirements

**Development:**
- Node.js environment with `pnpm` or `npm`.

**Production:**
- Standard static site hosting (Vercel, Netlify, GitHub Pages) or any environment capable of serving a SPA build output from `vite build`.

---

*Stack analysis: 2025-05-13*
