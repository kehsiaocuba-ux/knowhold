# Knowhold: Rules (draft v0.1)

> Working title: **Knowhold** (earlier working title: "Sage").
> Source: handwritten design notes dated 1/8/26, pages 1 to 8 in [`docs/design-notes/`](docs/design-notes/).
> Items marked **TBD** are not settled yet. Items marked **Proposal** are suggestions, not decisions.
> This file is the single source of truth for the rules engine. When a rule changes, change it here first.

## 1. Overview

Knowhold is a trivia board game with property-style ownership. Players (or teams) roll a dice, move around a track, and land on subject squares. They answer questions to earn points and to **own** squares. When someone lands on a square owned by another player, they pay rent, but every correct answer reduces it. Knowledge, not luck, decides how much you pay.

## 2. Setup

- 2 or more players, or two teams with any number of members each (see section 9).
- Every player or team starts with **500 points**.
- Every lap around the board earns **+100 points**, once per lap. A lap is completed by landing on or passing Start. Moving backward never removes a bonus and never pays the same lap twice.

## 3. Board (page 1)

The board is a closed track. Squares:

| Square | Type |
|---|---|
| Start | Start / lap marker |
| Art, History, Sports, Math, Geography, Biology, Physics, Chemistry | Subject squares (can be owned) |
| Any | Subject square where the subject is "any". **TBD:** does the player choose the subject? |
| Quick | Quick game square, cannot be owned (section 7). **TBD:** which Quick game is played? |
| Forward / Back | Special squares (section 8) |

The board has **40 squares** to start, stored as data in [`data/board.json`](data/board.json) so the size and order are easy to change. The first 11 squares follow the sketch on page 1; the rest are a first arrangement. Composition: 1 Start, 3 of each of the 8 subjects, 3 Any, 3 Quick, 2 Forward, 2 Back, 2 Add points, 2 Subtract points, 1 Distribute points.

## 4. A turn (page 2)

1. Roll a dice (1 to 6).
2. Move forward that many squares.
3. Resolve the square you land on.

## 5. Subject squares

### 5.1 Landing on an unowned square

Answer **5 questions** of that subject. Points earned depend on correct answers:

| Correct | Points | Ownership |
|---|---|---|
| 0 | 0 | none |
| 1 | 10 | none |
| 2 | 20 | none |
| 3 | 30 | none |
| 4 | 60 | claim the square (level 1) |
| 5 | 100 | claim the square (level 1) |

**TBD:** the notes say "Ownership" for 4 correct and "Ownership, 1 level" for 5 correct. This draft reads both as owning the square at level 1. Confirm.

### 5.2 Landing on your own square (levels)

You may take the test again. If you answer all **5 correctly**, you earn the points and the square goes up one level (level 1 to 2, level 2 to 3).

- Levels run from **1 to 3**.
- **TBD:** points awarded when you score less than 5 on your own square. The engine currently uses the same points table as a claim (placeholder).

### 5.3 Landing on another player's square (rent)

Answer 5 questions of that subject. Let **P(c)** be the points from the table above for `c` correct answers (0, 10, 20, 30, 60, 100), and `L` the level of the square.

```
rent = L × (100 − P(c))
```

| Correct | Level 1 | Level 2 | Level 3 |
|---|---|---|---|
| 0 | 100 | 200 | 300 |
| 1 | 90 | 180 | 270 |
| 2 | 80 | 160 | 240 |
| 3 | 70 | 140 | 210 |
| 4 | 40 | 80 | 120 |
| 5 | 0 | 0 | 0 |

- If the visitor answers all **5 correctly**, they pay 0 and the square **loses one level**. A level 1 square loses its owner and becomes free. Level 2 drops to 1, and level 3 drops to 2.
- The rent is paid to the owner. **TBD:** confirm that the owner receives it.
- The points a visitor would earn act as a discount on the rent. **TBD:** confirm that the visitor does not also receive those points.

### 5.4 Owning several squares of the same subject (pages 6 and 7)

When a visitor lands on a square whose owner holds more squares of the same subject, the rent is multiplied:

```
rent = L × (100 − P(c)) × min(N, 3)
```

where `N` is the number of squares of that subject the owner holds, and `L` is the **lowest level** among those squares (not the level of the square landed on).

Examples from the notes (owner has three squares, lowest level 2, so base 200 and multiplier 3):

| Correct | Calculation | Rent |
|---|---|---|
| 0 | 200 × 3 | 600 |
| 1 | (200 − 20) × 3 | 540 |
| 2 | (200 − 40) × 3 | 480 |
| 3 | (200 − 60) × 3 | 420 |
| 4 | (200 − 120) × 3 | 240 |
| 5 | 0 | 0 and the square loses one level |

Owner with lowest level 3 and three squares: 900, 810, 720, 630, 360, 0.

**TBD:** the note on page 6 says the base is "adjusted to the lowest level", and page 7 shows level 3, level 3 and level 2 giving a base of 200. This draft follows page 7. Confirm which square loses a level on 5 correct (the one landed on, assumed).

## 6. Negotiation (page 6)

Players can negotiate for squares that are owned. **TBD:** what can be offered (points, squares), who may refuse, and when negotiation is allowed.

## 7. Quick squares (pages 4 and 5)

Quick squares **cannot be owned**. All Quick games use the same format and the same points table.

**Quick Math**: 10 questions, 30 seconds. If the time runs out, the player scores 0 points and the game stops. **TBD:** is it 30 seconds in total, or per question?

| Solved | Points |
|---|---|
| 10 | 200 |
| 9 | 150 |
| 8 | 100 |
| 7 | 80 |
| 6 | 60 |
| 5 | 50 |
| 4 | 40 |
| 3 | 30 |
| 2 | 20 |
| 1 | 10 |
| 0 | 0 |

Other Quick games (same format):

| Game | What the player does | Time |
|---|---|---|
| Quick Countries | Shown a country name, picks the correct continent | same as Quick Math (TBD) |
| Quick Capitals | Shown a capital, picks the country it belongs to | same as Quick Math (TBD) |
| Quick History | Picks the correct year of a historical event | 2 minutes |
| Quick Sports Records | Shown a record, picks who set it (example: most home runs in a season, 73, Barry Bonds) | 2 minutes |
| Dictionary term identification (page 8) | Shown a definition, picks the word from 5 choices (verbs or objects will be defined) | 3 minutes, 10 questions |

## 8. Special squares (page 6, needs more development)

- **Go Forward** and **Go Backward**: move the player along the track. **TBD:** how many squares.
- **Add points**: obtain points from other players, or roll the dice and multiply by 30.
- **Subtract points**: roll the dice and multiply by 30.
- **Distribute points**: **TBD.**

Two ideas on page 6 ("you learn trigonometry" and "you finished a certification") are marked "No" in the notes and are **not** part of the rules.

## 9. Teams (page 8)

The game can be played in **two teams**, with any number of members per team.

- Players take turns alternating between the teams. Example: Team 1 is Alex, Cora, John and Team 2 is Ed, Sean, Joan, so the turn order is Alex, Ed, Cora, Sean, John, Joan.
- Any member of the team may suggest the answer, but the **input is made by the player whose turn it is**.
- A team has one shared point total, and is eliminated as a whole.

## 10. Elimination and winning

- A player or team whose points drop **below zero** is **eliminated**.
- When a player is eliminated, all their owned squares become **free**: all ownership and all levels are removed.
- If the final payment is more than the player can pay, only the part they can pay is charged. The rest is **forgiven**.
- Play continues until only one player or team remains. That player or team **wins**.
- **TBD:** tie-break when two players go below zero on the same turn.
- **Proposal:** before elimination, allow a player to sell or trade squares for points to avoid going below zero.

## 11. Training, tests and the Hall of Fame (summary of sheets not yet transcribed)

The author has additional sheets (not yet available) covering training sections, tests and a Hall of Fame (HOF).

- **Training:** practice questions by subject with no points at stake.
- **Tests:** fixed-length tests, for example **50 consecutive Art questions at normal level**.
- **Test HOF:** two categories, **speed to answer** and **accuracy**. The score combines both, with **accuracy weighted more**.
  **Proposal:** `score = 0.7 × accuracy + 0.3 × speed`, where accuracy is correct ÷ total and speed is the average time per correct answer compared with a par time for the difficulty, limited to 0 to 1. The weights go in a config file.
- **Game HOF:** based on the **number of players** and the **number of turns**. One board per player count. **TBD:** ranking order (fewest turns, or final points first).
- The HOF stores only nicknames, scores, modes and dates. No emails or real names.

## 12. Open questions (collected)

1. ~~Exact board size and square order.~~ Decided: 40 squares to start, in data/board.json.
2. Does the "Any" square let the player choose the subject?
3. Which Quick game is played on the Quick square?
4. Points for scoring below 5 on your own square.
5. Does the owner receive rent? Does the visitor also earn the test points?
6. Quick Math timer: total or per question?
7. Special square details (how far Forward/Back, Distribute).
8. Negotiation rules.
9. Tie-break when two players are eliminated on the same turn.
10. Game HOF ranking order.
11. Stalemate between equally skilled players. In simulated games with equal skill the game often never ends, because the lap bonus and test points outweigh rent (2 players at 80% skill: 137 of 150 games unfinished after 4000 turns). With clearly different skill the better player always wins in about 90 to 270 turns. Options: a turn or lap limit after which the most points wins, a smaller or shrinking lap bonus, or rent that grows over time.
