# Roadmap

Planned work, in order. Each item becomes one or more GitHub issues.

## Phase 0: Foundation
- [x] Repository, MIT license, README
- [x] RULES.md drafted from the handwritten notes
- [ ] Settle the open questions at the end of RULES.md
- [x] Choose the language and project layout for the engine (TypeScript, Vitest)
- [ ] Choose the final project name and check it is not taken

## Phase 1: Rules engine
- [x] Board model (squares, order, laps)
- [x] Dice and movement
- [x] Scoring table and ownership
- [x] Rent formula with levels and same-subject multiplier
- [ ] Elimination and win detection
- [ ] Unit tests covering every table in RULES.md

## Phase 2: Questions
- [ ] Question file format (JSON) and validator
- [ ] Starter English question set for each subject
- [ ] Loader that picks 5 non-repeating questions per square
- [ ] Spanish question set
- [ ] Document data sources and licenses

## Phase 3: Quick games
- [ ] Quick Math, Countries, Capitals, History, Sports Records, Dictionary
- [ ] Timers

## Phase 4: Play
- [ ] Command-line hot-seat prototype
- [ ] Web UI
- [ ] Two-team mode
- [ ] Special squares and negotiation

## Phase 5: Training, tests and Hall of Fame
- [ ] Training mode (no stakes)
- [ ] Timed tests (for example 50 Art questions)
- [ ] Hall of Fame (local file), then optional online board
- [ ] Server-side timing if an online board is added

## Ideas for later
- More subjects and languages
- Question packs contributed by others
