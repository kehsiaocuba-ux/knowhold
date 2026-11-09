# Dev log

One short entry per working day. Newest at the bottom.

## Day 1
- Created the repository with LICENSE, README, ROADMAP.
- Added RULES.md (draft v0.1) transcribed from the handwritten notes.
- Added the eight note pages in `docs/design-notes/`.

## Plan for the next days
- Day 2: settle the open questions in RULES.md, pick the language and layout.
- Day 3: board model and dice, with tests.
- Day 4: scoring, ownership and levels.
- Day 5: rent formula and the same-subject multiplier, with the tables from RULES.md as tests.
- Day 6: elimination and win detection.
- Day 7: question format and the first small English set.

## Day 2
- Chose TypeScript with Vitest and set up the project.
- Added dice with a seedable random source, plus tests.
- Added scoring, ownership, rent and level rules, with every table from RULES.md as tests (21 passing).
- Opened the first 8 GitHub issues from the roadmap.
- Settled the board size: 40 squares, stored as data. Added the board model with validation.

## Day 3
- Added movement along the board and the +100 lap bonus (landing on or passing Start), with tests (45 passing).

## Day 4
- Added game state, turn flow, rent resolution and elimination, with tests (76 passing).
- Ran simulated games: with equal skill the game can fail to end, so a stalemate rule is now an open question in RULES.md.

## Day 5
- Made the game numbers adjustable (Rules object) and ran balance simulations: see docs/BALANCE.md.
- Added the turn limit chosen before the game, with a tie-break (88 tests passing).
