# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

This repository is the starting point for an Arkanoid clone built with **HTML, CSS, and vanilla JS — zero dependencies**. As of now the game itself is **not implemented**: there is no `index.html`, `game.js`, or `style.css` yet. Only prep work exists:

- `assets/spritesheet-breakout.png` — the sprite sheet image.
- `assets/spritesheet.js` — helper module for drawing sprites from that sheet (see below).
- `assets/sounds/` — `ball-bounce.mp3`, `break-sound.mp3`.

Since there is no build tooling, no package manager, and no test runner, there are no build/lint/test commands to run. The game is meant to run by opening the HTML file directly in a browser (or serving the folder statically) once it exists.

## Spec-driven workflow

This repo uses a spec-first workflow installed as Claude Code skills (see `skills-lock.json`, sourced from `Klerith/fernando-skills`). Prefer this flow for any non-trivial feature:

1. **`/spec <description>`** — interactively designs a spec through clarifying questions, then writes it section-by-section to `specs/NN-slug.md` (folder created on first use). New specs are saved in `Draft` state and must be manually changed to `Approved` by a human before implementation.
2. **`/spec-impl <NN-spec-name>`** — implements an `Approved` spec only. It creates/switches to a git branch named `spec-NN-slug` (controlled by `AutoCreateBranch` in `specs/.spec-config.yml`, default `true`), then implements the plan step by step, pausing after each step for review. It refuses to run against specs in any other state (`Draft`, `In review`, `Implemented`, `Obsolete`).

Full behavior is documented in `.agents/skills/spec/SKILL.md` and `.agents/skills/spec-impl/SKILL.md` (mirrored under `.claude/skills/`). Don't skip the spec's `Approved` gate or implement ahead of the plan it defines.

## Sprite helper API (`assets/spritesheet.js`)

Game code will draw everything through this module rather than loading images directly:

- `loadSpritesheet(cb)` — loads `assets/spritesheet-breakout.png` onto an offscreen canvas once; queues and calls `cb()` when ready (safe to call multiple times before load completes).
- `drawSprite(ctx, name, x, y, w, h)` — draws a static sprite by name. `name` is one of the top-level keys in `SPRITES` (`paddle`, `ball`) or `block_<color>` (e.g. `block_red`) for a block, where `<color>` is a key under `SPRITES.blocks` (`gray`, `red`, `yellow`, `cyan`, `magenta`, `hotpink`, `green`).
- `drawFrame(ctx, frame, x, y, w, h)` — draws one explosion animation frame. Frames come from `EXPLOSION_FRAMES[color]`, a 4-frame array per color; `EXPLOSION_DURATION` (150ms) is the suggested per-frame duration for block-break animations.

Both draw functions are no-ops until `ssLoaded` is true, so any drawing code must run inside (or after) the `loadSpritesheet` callback.
