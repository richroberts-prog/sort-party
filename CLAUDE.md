# Sort Party

A sorting game for kids: shelf levels (Sortime rules), dog levels (dogs into bowls by coat colour) and
room levels (a big scrolling room, things to their homes). Static site on GitHub Pages; progress is saved
in each device's browser. Agreed design: `docs/design.md`.

## Commands

- `npm test`: unit tests (rules, levels can be won, stars, saving). `npm run typecheck`.
- `npx playwright test`: plays every level by touch at iPad and Fire tablet sizes. `SHOTS=shots` saves screenshots.
- `npm run dev`; `npm run build` to `dist/`. A push to main deploys to Pages.

## Map

- `src/game/`: pure rules, no DOM. `levels.ts` is the level path; `shelf.ts` has a solver.
- `src/ui/`: `levels.ts` draws each level type, `drag.ts` the one-finger drag, `art.ts` dogs and bowls, `sound.ts` Web Audio.
- `src/main.ts`: start, map, play screens, timer and end card.

## Rules

- A new shelf board comes from `scripts/gen-shelves.ts`; tests prove every level can be won.
- Don't name a class after a level type (`.play` gets `shelf`/`dogs`/`room`): that clash once made the room page 3x too wide.
