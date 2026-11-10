# Balance notes

How the numbers in [RULES.md](../RULES.md) were tested, and what was found.
The rules engine takes its numbers from a `Rules` object ([`src/engine/rules.ts`](../src/engine/rules.ts)),
so different balances can be tried without changing the code.

## The question

The goal: a game should usually end because the player with less knowledge runs out of points,
or, when everyone is about equal, end at a turn limit chosen before the game, with the most points winning.

With the numbers from the original design notes, players of clearly different skill finish quickly
(the better player always wins), but players of equal skill almost never go bankrupt:
the +100 lap bonus and the test points outweigh the rent.

## Method

- Simulated whole games on the 40-square board with the real engine, using a seeded random generator.
- Each simulated player answers every question correctly with a fixed probability (their "skill").
  The number correct out of 5 is drawn from that probability.
- 100 to 200 games per setting. Every game stops when someone is eliminated, or when every
  player has used the turn limit.
- Measured, for each setting:
  - **B**: percent of games in which someone went bankrupt before the turn limit.
  - **W**: percent of those bankruptcies where the player who went out first was the weakest player.
  - **T**: percent of games in which the strongest player finished on top (winner, or most points at the limit).

Skill setups: 2 players at 60% each (equal); 2 players at 70% and 50%; 4 players at 90%, 70%, 50% and 30%;
4 players at 60% each (equal).

## Settings compared

| Name | Lap bonus | Points earned for 0 to 5 correct | Rent reduction for 0 to 5 correct |
|---|---|---|---|
| original | 100 | 0, 10, 20, 30, 60, 100 | 0, 10, 20, 30, 60, 100 |
| A | 100 | 0, 5, 10, 15, 30, 50 | unchanged |
| **B (suggested)** | **50** | **0, 5, 10, 15, 30, 50** | **unchanged** |
| C | 25 | 0, 5, 10, 15, 30, 50 | unchanged |
| D | 50 | 0, 3, 5, 8, 15, 25 | unchanged |

## Results (200 games each)

### 40 turns each

| Setting | 2 players equal: B | 2 players 70/50: B, W, T | 4 players mixed: B, W, T | 4 players equal: B |
|---|---|---|---|---|
| original | 0 | 5, 100, 96 | 94, 77, 100 | 5 |
| A | 1 | 9, 100, 96 | 98, 75, 99 | 15 |
| B | 1 | 17, 100, 96 | 99, 71, 99 | 23 |
| C | 2 | 21, 100, 96 | 100, 68, 100 | 29 |
| D | 2 | 22, 100, 96 | 100, 66, 100 | 34 |

### 80 turns each

| Setting | 2 players equal: B | 2 players 70/50: B, W, T | 4 players mixed: B, W, T | 4 players equal: B |
|---|---|---|---|---|
| original | 2 | 50, 100, 100 | 100, 77, 100 | 39 |
| A | 7 | 70, 100, 100 | 100, 76, 100 | 56 |
| B | 13 | 76, 100, 100 | 100, 72, 100 | 73 |
| C | 18 | 80, 100, 100 | 100, 69, 100 | 78 |
| D | 25 | 83, 100, 100 | 100, 67, 100 | 81 |

### 120 turns each

| Setting | 2 players equal: B | 2 players 70/50: B, W, T | 4 players mixed: B, W, T | 4 players equal: B |
|---|---|---|---|---|
| original | 7 | 83, 100, 100 | 100, 77, 100 | 53 |
| A | 15 | 91, 100, 100 | 100, 76, 100 | 72 |
| B | 22 | 97, 100, 100 | 100, 72, 100 | 87 |
| C | 33 | 98, 100, 100 | 100, 69, 100 | 93 |
| D | 42 | 98, 100, 100 | 100, 67, 100 | 93 |

## What the results say

1. **Knowledge decides the game under every setting.** The strongest player finishes on top in 96% to 100% of games.
2. **Lower rewards mean more bankruptcies,** especially between equal players and in longer games.
3. **Harsher settings cost fairness.** With four players of different skill, the weakest player goes out first
   in 77% of bankruptcies with the original numbers, and in 66% with the harshest setting (D), because the order
   of dice rolls and who lands on whose square matters more when points are scarce.
4. **Short games (40 turns) mostly end at the turn limit** in two-player games, whatever the setting. That is expected,
   and the winner is the player with the most points.

## Chosen setting: B

Lap bonus 50, points earned halved, rent reductions unchanged. At 80 turns it gives bankruptcies in 76% of games
between players of different skill and in 73% of four-player games between equals, while keeping the weakest-out-first
rate at 72%. The author accepted it as the default (`DEFAULT_RULES` in the engine). The original numbers from the design notes are kept as `ORIGINAL_RULES`. To be checked again as more of the game is built.

## Limits of these simulations

- Skill is a fixed probability. Real players vary by subject and get tired or lucky.
- Question difficulty is not modelled yet.
- Quick games, special squares (Add, Subtract, Distribute points), negotiation and teams are not in the engine yet.
  Quick games and the Add points squares put more points into the game, so **these simulations must be repeated
  when they are added**.
- A big skill gap (for example an adult against a child) ends the game quickly, with the stronger player winning.
  If the game is meant for mixed ages, per-player difficulty levels or a handicap may be needed.
