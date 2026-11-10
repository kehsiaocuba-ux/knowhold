# Knowhold

A trivia board game where knowledge, not luck, decides who owns the board.

Roll a dice, land on a subject square (Art, History, Sports, Math, Geography, Biology, Physics, Chemistry), and answer questions to earn points and **own** the square. When someone lands on your square they pay rent, but every correct answer they give reduces it, so players who know your subject can take your squares away. Players start with 500 points. A player who goes below zero is out, and the game ends when only one player is left, or when the turn limit chosen before the game runs out (then the most points wins). It can also be played in two teams.

Questions are written for a school grade (2nd grade to college) and one of four difficulties (easy, normal, hard, hardest), and the Hall of Fame keeps a separate board for each difficulty.

> Status: the rules engine is built and tested (136 automated tests): board, dice, movement and the lap bonus, scoring, rent and levels, elimination, the turn limit, grades and difficulty, and the question format and loader. Still to come: the question banks, Quick games, a playable command-line version, the web interface, teams, training mode, tests and the Hall of Fame. The rules are in [RULES.md](RULES.md), written from handwritten design notes ([`docs/design-notes/`](docs/design-notes/)).

## What is done and what is planned

- Done: a rules engine (dice, scoring, rent, levels, elimination, turn limit) with automated tests
- Done: a question format with a validator and a loader that never repeats questions
- Done: balance studies with simulated games ([docs/BALANCE.md](docs/BALANCE.md))
- Planned: question banks by grade, with tools to check, import and review them
- Planned: a generator for math questions by grade
- Planned: Quick games, a command-line prototype, then a web interface
- Planned: two-team mode, training mode and timed tests, and the Hall of Fame

See [ROADMAP.md](ROADMAP.md) for the plan, the open issues on GitHub for the detailed tasks, and [docs/DEVLOG.md](docs/DEVLOG.md) for daily progress.

## Who it is for

Kids and their friends who want school subjects to be more fun and more of a challenge, and families and classrooms that like trivia with strategy and long-term ownership instead of simple question-and-answer rounds.

## Built with

TypeScript, with Vitest for the tests. The rules engine is a small library with a web interface on top.

## How to run it

Not playable yet. To run the tests: `npm install`, then `npm test`.

## Documents

- [RULES.md](RULES.md): the rules of the game
- [docs/QUESTIONS.md](docs/QUESTIONS.md): the question format and how to write questions
- [docs/DIFFICULTY_AND_HALL_OF_FAME.md](docs/DIFFICULTY_AND_HALL_OF_FAME.md): grades, difficulty and the Hall of Fame
- [docs/BALANCE.md](docs/BALANCE.md): how the numbers were tested

## Questions and licensing

- Code: MIT, see [LICENSE](LICENSE).
- Question content is original or from openly licensed sources. Each question records its source, and a question is only marked `reviewed` after a person has checked it.
- The Hall of Fame stores nicknames only, never real names or other personal data.

---

*Dedicated to my beautiful daughter, from papa.*
