/**
 * Movement along the board and the lap bonus (RULES.md sections 2 and 4).
 *
 * A piece keeps `progress`, the net number of squares it has advanced since Start
 * (it can be negative after a Back square). Its position on the board is progress modulo the board size.
 * Landing on or passing Start completes a lap and earns the lap bonus once.
 * `lapsAwarded` remembers the laps already paid, so moving back and forth across Start
 * can never earn the same bonus twice.
 */

export const LAP_BONUS = 100;

export interface Piece {
  progress: number;
  lapsAwarded: number;
}

export interface MoveResult {
  piece: Piece;
  /** Board position (0 to size - 1) after the move. */
  position: number;
  /** Laps newly completed by this move. */
  lapsGained: number;
  /** Points to add to the player for those laps. */
  bonus: number;
}

export function newPiece(): Piece {
  return { progress: 0, lapsAwarded: 0 };
}

function assertBoardSize(boardSize: number): void {
  if (!Number.isInteger(boardSize) || boardSize < 2) {
    throw new RangeError(`boardSize must be an integer of at least 2, got ${boardSize}`);
  }
}

/** Board position of a piece: 0 is Start. */
export function positionOf(piece: Piece, boardSize: number): number {
  assertBoardSize(boardSize);
  return ((piece.progress % boardSize) + boardSize) % boardSize;
}

/**
 * Move a piece by `steps` (positive for a dice roll, negative for a Back square).
 * Returns a new piece; the original is not changed.
 */
export function movePiece(piece: Piece, steps: number, boardSize: number): MoveResult {
  assertBoardSize(boardSize);
  if (!Number.isInteger(steps)) {
    throw new RangeError(`steps must be an integer, got ${steps}`);
  }
  const progress = piece.progress + steps;
  const lapsCompleted = Math.floor(progress / boardSize);
  const lapsGained = Math.max(0, lapsCompleted - piece.lapsAwarded);
  const moved: Piece = {
    progress,
    lapsAwarded: Math.max(piece.lapsAwarded, lapsCompleted),
  };
  return {
    piece: moved,
    position: positionOf(moved, boardSize),
    lapsGained,
    bonus: lapsGained * LAP_BONUS,
  };
}
