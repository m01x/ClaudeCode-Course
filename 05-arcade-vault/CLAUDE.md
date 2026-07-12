# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Critical: this is not the Next.js you know

This project pins `next@16.2.10`, a version newer than your training data. APIs, conventions, and file
structure may differ from what you expect. Before writing or editing any Next.js code, read the relevant
guide under `node_modules/next/dist/docs/` (organized into `01-app`, `02-pages`, `03-architecture`,
`04-community`) and follow any deprecation notices found there instead of assuming prior knowledge.

## Commands

```bash
npm run dev     # start dev server
npm run build   # production build
npm run start   # run production build
npm run lint    # eslint (flat config, eslint-config-next core-web-vitals + typescript)
```

There is no test script/framework configured yet.

## Project state

This is currently an unmodified `create-next-app` scaffold: App Router, TypeScript (strict), Tailwind CSS v4
(via `@tailwindcss/postcss`, imported in `app/globals.css`), ESLint 9 flat config
(`eslint.config.mjs`). The `@/*` path alias maps to the project root (`tsconfig.json`). No feature code has
been added yet — `app/page.tsx` and `app/layout.tsx` are still the default template.

## Workflow: Spec Driven Design

This project follows the spec-driven workflow from `Klerith/fernando-skills`, using the `/spec` and
`/spec-impl` slash commands (see README.md). `/spec` writes a spec document for a feature; `/spec-impl`
implements it. Sibling modules in this course repo (e.g. the arkanoid game) keep specs under a
`specs/` folder next to the code they describe and record spec status (e.g. "Implemented") — follow the
same pattern here once specs are introduced for arcade-vault features.
