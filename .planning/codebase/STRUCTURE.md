# Codebase Structure

**Analysis Date:** 2025-03-05

## Directory Layout

```
/
├── .planning/           # Analysis and planning documents
├── guidelines/          # Project guidelines
├── public/              # Static assets (implicitly used by Vite)
├── src/                 # Application source code
│   ├── app/             # Application logic and components
│   │   ├── components/  # React components
│   │   │   ├── figma/   # Figma-specific utilities
│   │   │   └── ui/      # Reusable UI primitives (Shadcn)
│   │   ├── contexts/    # React Context providers for state
│   │   ├── App.tsx      # Root component
│   │   └── routes.tsx   # Route definitions
│   ├── styles/          # Styling files (Tailwind, fonts, themes)
│   └── main.tsx         # Application entry point
├── index.html           # HTML template
├── package.json         # Project dependencies and scripts
├── postcss.config.mjs   # PostCSS configuration
├── tsconfig.json        # TypeScript configuration
└── vite.config.ts       # Vite build configuration
```

## Directory Purposes

**src/app/components:**
- Purpose: Houses the functional building blocks of the UI.
- Contains: Feature-specific components like `ChatBot.tsx`, `DiagramCanvas.tsx`, and `ProjectWorkspace.tsx`.
- Key files: `ProjectWorkspace.tsx` which orchestrates the main application view.

**src/app/components/ui:**
- Purpose: Provides a set of foundational UI components following a design system.
- Contains: Individual components like `button.tsx`, `card.tsx`, `resizable.tsx` (Shadcn components).
- Key files: `utils.ts` for styling helper functions.

**src/app/contexts:**
- Purpose: Manages global state that needs to be accessed by multiple components.
- Contains: Context providers.
- Key files: `ProjectContext.tsx` for managing project data and persistence.

**src/styles:**
- Purpose: Centralized location for application-wide styling.
- Contains: CSS files and theme definitions.
- Key files: `tailwind.css` for utility-first styles, `theme.css` for project-specific variables.

## Key File Locations

**Entry Points:**
- `src/main.tsx`: Standard React/Vite entry point.
- `src/app/App.tsx`: The root of the React component tree.

**Configuration:**
- `vite.config.ts`: Configuration for the Vite build tool and development server.
- `package.json`: Manages project dependencies and execution scripts.
- `src/app/routes.tsx`: Centralized definition of application routes.

**Core Logic:**
- `src/app/contexts/ProjectContext.tsx`: Core business logic for project management and persistence.

**Testing:**
- Not detected (no dedicated testing directory or patterns found in root or `src/`).

## Naming Conventions

**Files:**
- React Components: PascalCase (e.g., `ProjectList.tsx`).
- Context Providers: PascalCase (e.g., `ProjectContext.tsx`).
- Styles/Config: kebab-case (e.g., `tailwind.css`, `vite.config.ts`).

**Directories:**
- Feature directories: kebab-case (e.g., `components/ui`).

## Where to Add New Code

**New Feature:**
- Primary code: Create a new component in `src/app/components/` and if it needs global state, update `src/app/contexts/ProjectContext.tsx`.
- Tests: No current testing pattern established.

**New Component/Module:**
- Implementation: Add to `src/app/components/` if it's a high-level component, or `src/app/components/ui/` if it's a reusable primitive.

**Utilities:**
- Shared helpers: Create a new utility file in `src/app/lib/` or similar (directory does not currently exist).

## Special Directories

**.planning:**
- Purpose: Contains markdown files detailing the codebase analysis and implementation plans.
- Generated: No (manually maintained by AI tools).
- Committed: Yes.

**guidelines:**
- Purpose: Holds project-specific guidelines and rules.
- Committed: Yes.

---

*Structure analysis: 2025-03-05*
