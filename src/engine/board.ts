/**
 * Board model. The board is data (data/board.json), so its size and order are easy to change.
 * Source of truth for the squares: RULES.md section 3.
 */

export const SUBJECTS = [
  "art",
  "history",
  "sports",
  "math",
  "geography",
  "biology",
  "physics",
  "chemistry",
] as const;
export type Subject = (typeof SUBJECTS)[number];

/** Square kinds that are not subjects. The details of the special squares are still open (RULES.md 8). */
export const SPECIAL_SQUARES = [
  "start",
  "any",
  "quick",
  "forward",
  "back",
  "addPoints",
  "subtractPoints",
  "distributePoints",
] as const;
export type SpecialSquare = (typeof SPECIAL_SQUARES)[number];

/** In the board file, a square is written as a subject name or a special square name. */
export type Square = Subject | SpecialSquare;

export interface Board {
  name: string;
  squares: Square[];
}

function isSquare(value: unknown): value is Square {
  return (
    typeof value === "string" &&
    ((SUBJECTS as readonly string[]).includes(value) ||
      (SPECIAL_SQUARES as readonly string[]).includes(value))
  );
}

export function isSubject(square: Square): square is Subject {
  return (SUBJECTS as readonly string[]).includes(square);
}

/** Check raw data (for example parsed JSON) and return a Board, or throw an Error that says what is wrong. */
export function parseBoard(data: unknown): Board {
  if (typeof data !== "object" || data === null) {
    throw new Error("board must be an object");
  }
  const { name, squares } = data as { name?: unknown; squares?: unknown };
  if (typeof name !== "string" || name.trim() === "") {
    throw new Error("board needs a non-empty name");
  }
  if (!Array.isArray(squares) || squares.length < 2) {
    throw new Error("board needs a squares list with at least 2 squares");
  }
  squares.forEach((square, i) => {
    if (!isSquare(square)) {
      throw new Error(`square ${i} is not a valid square: ${JSON.stringify(square)}`);
    }
  });
  const typed = squares as Square[];
  if (typed[0] !== "start") {
    throw new Error("the first square must be start");
  }
  if (typed.filter((s) => s === "start").length !== 1) {
    throw new Error("the board must have exactly one start square");
  }
  return { name, squares: typed };
}

export function boardSize(board: Board): number {
  return board.squares.length;
}

/** The square at a position. Positions wrap around the board and may be negative (for Back squares). */
export function squareAt(board: Board, position: number): Square {
  const size = boardSize(board);
  const wrapped = ((position % size) + size) % size;
  return board.squares[wrapped] as Square;
}

/** How many squares of each kind the board has. */
export function countSquares(board: Board): Partial<Record<Square, number>> {
  const counts: Partial<Record<Square, number>> = {};
  for (const square of board.squares) {
    counts[square] = (counts[square] ?? 0) + 1;
  }
  return counts;
}
