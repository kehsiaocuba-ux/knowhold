/**
 * Game state, turn flow and elimination (RULES.md sections 4, 5 and 10).
 *
 * Everything here is a pure function: each one takes a GameState and returns a new one,
 * so a game can be replayed, tested and saved easily. Asking the questions is not done here:
 * the caller (the command line or the web page) runs the test and passes in how many answers were correct.
 *
 * "Player" also stands for a team once team play is added.
 */

import { type Board, type Square, type Subject, isSubject, squareAt } from "./board";
import { type Piece, movePiece, newPiece, positionOf } from "./movement";
import { type Difficulty, type Grade, isDifficulty, isGrade } from "./levels";
import { DEFAULT_RULES, type Rules } from "./rules";
import {
  claimsOwnership,
  levelAfterOwnerTest,
  levelAfterVisit,
  pointsForCorrect,
  rent,
} from "./scoring";

export const STARTING_POINTS = 500;
export const MIN_PLAYERS = 2;

export interface Ownership {
  owner: string;
  level: number;
}

export interface Player {
  id: string;
  name: string;
  points: number;
  piece: Piece;
  eliminated: boolean;
  /** Turns this player has finished. */
  turnsTaken: number;
}

export type GameEnd = "bankruptcy" | "turnLimit";

export interface GameOptions {
  rules?: Rules;
  /** Turns per player chosen before the game (for example 40, 80 or 120). null means no limit. */
  turnLimit?: number | null;
  /** School grade the questions are written for. null until grades are chosen. */
  grade?: Grade | null;
  /** Difficulty of the questions. Defaults to "normal". */
  difficulty?: Difficulty;
}

export interface GameState {
  board: Board;
  rules: Rules;
  players: Player[];
  /** Owned squares, keyed by board position. */
  ownership: Record<number, Ownership>;
  /** Index into `players` of the player whose turn it is. */
  current: number;
  /** Number of completed turns. */
  turns: number;
  /** Turns each player gets, or null for no limit. */
  turnLimit: number | null;
  /** School grade of the questions, or null if not chosen. */
  grade: Grade | null;
  /** Difficulty of the questions; the Hall of Fame keeps one board per difficulty. */
  difficulty: Difficulty;
  /** Why the game ended, or null while it is still running. */
  ended: GameEnd | null;
  /** Id of the winner. Null while running, and also null after a turn limit that ended in an exact tie. */
  winner: string | null;
  /** When a turn limit ends in an exact tie, the ids of the players who tied for first. */
  tied: string[];
}

export type Landing =
  | { kind: "claimable"; position: number; subject: Subject }
  | { kind: "own"; position: number; subject: Subject; level: number }
  | {
      kind: "visit";
      position: number;
      subject: Subject;
      owner: string;
      /** Level of the square that was landed on. */
      level: number;
      /** How many squares of this subject the owner holds. */
      ownerSquares: number;
      /** The lowest level among the owner's squares of this subject. */
      lowestLevel: number;
    }
  | { kind: "other"; position: number; square: Square };

// ---------- setup and lookups ----------

export function newGame(board: Board, names: string[], options: GameOptions = {}): GameState {
  const rules = options.rules ?? DEFAULT_RULES;
  const turnLimit = options.turnLimit ?? null;
  const grade = options.grade ?? null;
  const difficulty = options.difficulty ?? "normal";
  if (grade !== null && !isGrade(grade)) {
    throw new Error(`unknown grade ${JSON.stringify(grade)}`);
  }
  if (!isDifficulty(difficulty)) {
    throw new Error(`unknown difficulty ${JSON.stringify(difficulty)}`);
  }
  if (turnLimit !== null && (!Number.isInteger(turnLimit) || turnLimit < 1)) {
    throw new Error(`turnLimit must be a whole number of at least 1, got ${turnLimit}`);
  }
  const cleaned = names.map((n) => n.trim());
  if (cleaned.length < MIN_PLAYERS) {
    throw new Error(`a game needs at least ${MIN_PLAYERS} players`);
  }
  if (cleaned.some((n) => n === "")) {
    throw new Error("player names cannot be empty");
  }
  if (new Set(cleaned.map((n) => n.toLowerCase())).size !== cleaned.length) {
    throw new Error("player names must be different");
  }
  return {
    board,
    rules,
    players: cleaned.map((name, i) => ({
      id: `p${i + 1}`,
      name,
      points: rules.startingPoints,
      piece: newPiece(),
      eliminated: false,
      turnsTaken: 0,
    })),
    ownership: {},
    current: 0,
    turns: 0,
    turnLimit,
    grade,
    difficulty,
    ended: null,
    winner: null,
    tied: [],
  };
}

export function getPlayer(state: GameState, id: string): Player {
  const player = state.players.find((p) => p.id === id);
  if (!player) throw new Error(`unknown player ${id}`);
  return player;
}

export function currentPlayer(state: GameState): Player {
  return state.players[state.current] as Player;
}

export function activePlayers(state: GameState): Player[] {
  return state.players.filter((p) => !p.eliminated);
}

function assertRunning(state: GameState): void {
  if (state.ended !== null) throw new Error("the game is over");
}

function updatePlayer(state: GameState, id: string, change: (p: Player) => Player): GameState {
  return { ...state, players: state.players.map((p) => (p.id === id ? change(p) : p)) };
}

function setSquare(state: GameState, position: number, value: Ownership | null): GameState {
  const ownership = { ...state.ownership };
  if (value === null) delete ownership[position];
  else ownership[position] = value;
  return { ...state, ownership };
}

// ---------- points and elimination ----------

/** Give points to a player. */
export function credit(state: GameState, id: string, amount: number): GameState {
  return updatePlayer(state, id, (p) => ({ ...p, points: p.points + amount }));
}

/**
 * Eliminate a player: all their squares become free and lose their levels (RULES.md section 10).
 * If only one player is left, that player wins.
 */
export function eliminate(state: GameState, id: string): GameState {
  let next = updatePlayer(state, id, (p) => ({ ...p, points: 0, eliminated: true }));
  const ownership: Record<number, Ownership> = {};
  for (const [position, o] of Object.entries(next.ownership)) {
    if (o.owner !== id) ownership[Number(position)] = o;
  }
  next = { ...next, ownership };
  const left = activePlayers(next);
  if (left.length === 1 && next.ended === null) {
    next = { ...next, ended: "bankruptcy", winner: (left[0] as Player).id };
  }
  return next;
}

/**
 * Take points from a player. Only what they can pay is charged; the rest is forgiven.
 * A player who cannot pay in full goes below zero and is eliminated.
 * Returns the amount actually paid.
 */
export function charge(state: GameState, id: string, amount: number): { state: GameState; paid: number } {
  const player = getPlayer(state, id);
  if (amount <= player.points) {
    return { state: credit(state, id, -amount), paid: amount };
  }
  return { state: eliminate(state, id), paid: player.points };
}

// ---------- a turn ----------

/** What the current player has landed on, so the caller knows which test to run. */
export function describeLanding(state: GameState): Landing {
  const player = currentPlayer(state);
  const position = positionOf(player.piece, state.board.squares.length);
  const square = squareAt(state.board, position);
  if (!isSubject(square)) return { kind: "other", position, square };

  const owned = state.ownership[position];
  if (!owned) return { kind: "claimable", position, subject: square };
  if (owned.owner === player.id) return { kind: "own", position, subject: square, level: owned.level };

  const ownerSquares = Object.entries(state.ownership).filter(
    ([pos, o]) => o.owner === owned.owner && squareAt(state.board, Number(pos)) === square,
  );
  return {
    kind: "visit",
    position,
    subject: square,
    owner: owned.owner,
    level: owned.level,
    ownerSquares: ownerSquares.length,
    lowestLevel: Math.min(...ownerSquares.map(([, o]) => o.level)),
  };
}

/** Move the current player by the dice roll (or by a negative number for a Back square) and pay any lap bonus. */
export function moveCurrent(state: GameState, steps: number): { state: GameState; landing: Landing } {
  assertRunning(state);
  const player = currentPlayer(state);
  const moved = movePiece(player.piece, steps, state.board.squares.length);
  const next = updatePlayer(state, player.id, (p) => ({
    ...p,
    piece: moved.piece,
    points: p.points + moved.lapsGained * state.rules.lapBonus,
  }));
  return { state: next, landing: describeLanding(next) };
}

/** Test on an unowned subject square: earn the points, and claim the square with 4 or 5 correct. */
export function resolveClaim(state: GameState, correct: number): GameState {
  assertRunning(state);
  const landing = describeLanding(state);
  if (landing.kind !== "claimable") throw new Error("the current square is not an unowned subject square");
  const player = currentPlayer(state);
  let next = credit(state, player.id, pointsForCorrect(correct, state.rules));
  if (claimsOwnership(correct)) next = setSquare(next, landing.position, { owner: player.id, level: 1 });
  return next;
}

/**
 * Test on your own square: 5 correct raises its level.
 * Placeholder: points are awarded from the same table as a claim (RULES.md open question 4).
 */
export function resolveOwn(state: GameState, correct: number): GameState {
  assertRunning(state);
  const landing = describeLanding(state);
  if (landing.kind !== "own") throw new Error("the current square is not owned by the current player");
  const player = currentPlayer(state);
  let next = credit(state, player.id, pointsForCorrect(correct, state.rules));
  next = setSquare(next, landing.position, {
    owner: player.id,
    level: levelAfterOwnerTest(landing.level, correct),
  });
  return next;
}

/**
 * Test on another player's square: pay rent to the owner, reduced by the correct answers.
 * Only what the visitor can pay is charged (they are eliminated if they cannot pay in full).
 * With 5 correct the square loses a level, and level 1 becomes free.
 */
export function resolveVisit(state: GameState, correct: number): GameState {
  assertRunning(state);
  const landing = describeLanding(state);
  if (landing.kind !== "visit") throw new Error("the current square is owned by another player");
  const visitor = currentPlayer(state);
  const owed = rent(landing.lowestLevel, correct, landing.ownerSquares, state.rules);

  const charged = charge(state, visitor.id, owed);
  let next = credit(charged.state, landing.owner, charged.paid);

  const newLevel = levelAfterVisit(landing.level, correct);
  next = setSquare(next, landing.position, newLevel > 0 ? { owner: landing.owner, level: newLevel } : null);
  return next;
}

/** Sum of the levels of the squares a player owns (used to break ties). */
export function ownedLevels(state: GameState, id: string): number {
  return Object.values(state.ownership)
    .filter((o) => o.owner === id)
    .reduce((sum, o) => sum + o.level, 0);
}

/**
 * Players from first to last: players still in the game by points, then by owned levels;
 * eliminated players come after them.
 */
export function standings(state: GameState): Player[] {
  return [...state.players].sort((a, b) => {
    if (a.eliminated !== b.eliminated) return a.eliminated ? 1 : -1;
    if (b.points !== a.points) return b.points - a.points;
    return ownedLevels(state, b.id) - ownedLevels(state, a.id);
  });
}

function finishByTurnLimit(state: GameState): GameState {
  const ranked = standings(state);
  const first = ranked[0] as Player;
  const tied = ranked.filter(
    (p) =>
      !p.eliminated &&
      p.points === first.points &&
      ownedLevels(state, p.id) === ownedLevels(state, first.id),
  );
  return tied.length === 1
    ? { ...state, ended: "turnLimit", winner: first.id, tied: [] }
    : { ...state, ended: "turnLimit", winner: null, tied: tied.map((p) => p.id) };
}

/**
 * End the current turn. The game ends when only one player is left (bankruptcy),
 * or when every player still in the game has used up the turn limit: then the most points win,
 * ties are broken by the total level of owned squares, and an exact tie has no winner.
 */
export function endTurn(state: GameState): GameState {
  if (state.ended !== null) return state;
  const finished = {
    ...state,
    turns: state.turns + 1,
    players: state.players.map((p, i) => (i === state.current ? { ...p, turnsTaken: p.turnsTaken + 1 } : p)),
  };
  if (
    finished.turnLimit !== null &&
    activePlayers(finished).every((p) => p.turnsTaken >= (finished.turnLimit as number))
  ) {
    return finishByTurnLimit(finished);
  }
  const count = finished.players.length;
  let index = finished.current;
  for (let i = 0; i < count; i++) {
    index = (index + 1) % count;
    if (!(finished.players[index] as Player).eliminated) break;
  }
  return { ...finished, current: index };
}
