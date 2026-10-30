# Lore Atlas

**Build your own universe of knowledge.**

Lore Atlas is a personal knowledge management platform for fictional universes. It provides a space to collect, organize, and explore information about existing fictional worlds and original creations.

## Features

- **Universes** — Create and manage your own knowledge bases.
- **Entities** — Document characters, locations, organizations, events, objects, and concepts.
- **Relationships** — Connect entities and explore how they relate to each other.
- **Knowledge Graph** — Visualize connections between different elements of a universe.
- **Flexible Editor** — Combine structured properties with rich-text content.
- **Spoiler Management** — Manually mark and identify spoiler-containing content.
- **Media Support** — Add images using local files or external URLs.

## Vision

Turn scattered pieces of lore into an interconnected world of knowledge.

## Project Status

Early development — currently in the concept and planning stage.

## Tech stack

- React + TypeScript
- Vite
- pnpm
- CSS Modules
- React Router
- Zustand
- Zod
- Jest + Testing Library
- ESLint + Prettier

## Requirements

- Node.js 22.12 or newer
- pnpm 10 or newer

## Getting started

```bash
git clone <repository-url>
cd lore-atlas
pnpm install
cp .env.example .env
pnpm dev
```

Open the local URL printed by Vite (usually `http://localhost:5173`).

## Available scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the development server |
| `pnpm build` | Type-check and create a production build |
| `pnpm preview` | Preview the production build locally |
| `pnpm test` | Run Jest tests |
| `pnpm test:watch` | Run Jest in watch mode |
| `pnpm lint` | Run ESLint |
| `pnpm format` | Format project files |
| `pnpm format:check` | Check formatting |

## Environment variables

Copy `.env.example` to `.env` and adjust values as needed.
Only variables prefixed with `VITE_` are exposed to client-side code.
Never put secrets in `VITE_` variables.

## Project structure

```text
src/
  app/          Application shell and routing
  assets/       Static assets
  components/   Shared UI and layout components
  features/     Domain features (universes, entities, timeline, graph)
  pages/        Route-level pages
  services/     Persistence and external-service abstractions
  stores/       Client-side state
  test/         Test setup
  types/        Shared TypeScript types
  utils/        General utilities
  styles/       Global styles and design tokens
```

Feature-specific components and logic should live inside their feature directory.
Keep `components/` for genuinely reusable UI.

## Quality checks

Before opening a pull request, run:

```bash
pnpm lint
pnpm test
pnpm build
pnpm format:check
```