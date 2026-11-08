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
}

export interface GameState {
  board: Board;
  players: Player[];
  /** Owned squares, keyed by board position. */
  ownership: Record<number, Ownership>;
  /** Index into `players` of the player whose turn it is. */
  current: number;
  /** Number of completed turns. */
  turns: number;
  /** Id of the winner once only one player is left. */
  winner: string | null;
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

export function newGame(board: Board, names: string[]): GameState {
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
    players: cleaned.map((name, i) => ({
      id: `p${i + 1}`,
      name,
      points: STARTING_POINTS,
      piece: newPiece(),
      eliminated: false,
    })),
    ownership: {},
    current: 0,
    turns: 0,
    winner: null,
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
  if (state.winner !== null) throw new Error("the game is over");
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
  if (left.length === 1 && next.winner === null) {
    next = { ...next, winner: (left[0] as Player).id };
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
    points: p.points + moved.bonus,
  }));
  return { state: next, landing: describeLanding(next) };
}

/** Test on an unowned subject square: earn the points, and claim the square with 4 or 5 correct. */
export function resolveClaim(state: GameState, correct: number): GameState {
  assertRunning(state);
  const landing = describeLanding(state);
  if (landing.kind !== "claimable") throw new Error("the current square is not an unowned subject square");
  const player = currentPlayer(state);
  let next = credit(state, player.id, pointsForCorrect(correct));
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
  let next = credit(state, player.id, pointsForCorrect(correct));
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
  const owed = rent(landing.lowestLevel, correct, landing.ownerSquares);

  const charged = charge(state, visitor.id, owed);
  let next = credit(charged.state, landing.owner, charged.paid);

  const newLevel = levelAfterVisit(landing.level, correct);
  next = setSquare(next, landing.position, newLevel > 0 ? { owner: landing.owner, level: newLevel } : null);
  return next;
}

/** End the current turn: move on to the next player who is still in the game. */
export function endTurn(state: GameState): GameState {
  if (state.winner !== null) return state;
  const count = state.players.length;
  let index = state.current;
  for (let i = 0; i < count; i++) {
    index = (index + 1) % count;
    if (!(state.players[index] as Player).eliminated) break;
  }
  return { ...state, current: index, turns: state.turns + 1 };
}
