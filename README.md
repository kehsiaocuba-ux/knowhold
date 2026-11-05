# Knowhold

A trivia board game where knowledge, not luck, decides who owns the board.

Roll a dice, land on a subject square (Art, History, Sports, Math, Geography, Biology, Physics, Chemistry), and answer questions to earn points and **own** the square. When someone lands on your square they pay rent, but every correct answer they give reduces it, so experts in your subject can take your squares away. Players start with 500 points, and the last player or team standing wins. It can be played solo-by-turns or in two teams.

> Status: early design stage. The rules are being written down in [RULES.md](RULES.md) from handwritten design notes ([`docs/design-notes/`](docs/design-notes/)). No playable version yet.

## What is planned

- A rules engine (dice, scoring, rent, levels, elimination) with automated tests
- A question format (JSON) with English questions first, Spanish later
- Quick games, training mode, timed tests and a Hall of Fame
- A hot-seat prototype, then a web UI, then teams and online play

See [ROADMAP.md](ROADMAP.md) for the plan and [docs/DEVLOG.md](docs/DEVLOG.md) for daily progress.

## Who it is for

Families, classrooms and friends who like trivia and want a game with strategy and long-term ownership instead of simple question-and-answer rounds.

## Built with

TypeScript: the rules engine is a small library with tests, with a web interface on top.

## How to run it

Not playable yet. To run the tests: `npm install`, then `npm test`.

## Questions and licensing

- Code: MIT, see [LICENSE](LICENSE).
- Question content will be original or from openly licensed sources, with each source's license listed in `data/`.

---

*Dedicated to my beautiful daughter, from papa.*
