# Coding Conventions

## Overview
The project follows modern React and TypeScript best practices, focusing on component-based architecture and type safety.

## General Principles
- **Type Safety**: TypeScript is used extensively. Avoid using `any`; define interfaces or types for all data structures and component props.
- **Component-Driven Development**: UI components are built using Radix UI primitives and styled with Tailwind CSS.
- **State Management**: Use React Context for global or shared state (e.g., `ProjectContext.tsx`).
- **File Naming**: 
  - Components: PascalCase (e.g., `ChatBot.tsx`).
  - Styles/Utils: lowercase or kebab-case (e.g., `utils.ts`, `index.css`).
  - Contexts: PascalCase with 'Context' suffix (e.g., `ProjectContext.tsx`).

## Styling
- **Tailwind CSS**: Use utility classes for styling. Follow the `tailwind-merge` and `clsx` pattern for dynamic classes.
- **Themes**: Theme-related variables are stored in `src/styles/theme.css`.

## Directory Structure
- `src/app/components/ui`: Shared, low-level UI components (shadcn/ui style).
- `src/app/components`: Feature-specific or complex components.
- `src/app/contexts`: Shared state logic.
- `src/styles`: Global styles and configuration.
