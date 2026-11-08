import { describe, expect, it } from "vitest";
import boardData from "../data/board.json";
import { boardSize, countSquares, isSubject, parseBoard, squareAt } from "../src/engine/board";

const board = parseBoard(boardData);

describe("standard board (data/board.json)", () => {
  it("has 40 squares", () => {
    expect(boardSize(board)).toBe(40);
  });

  it("starts with Start and then follows the sketch on page 1 of the notes", () => {
    expect(board.squares.slice(0, 11)).toEqual([
      "start", "art", "history", "sports", "math", "geography",
      "biology", "physics", "chemistry", "any", "quick",
    ]);
  });

  it("has the planned number of each kind of square", () => {
    expect(countSquares(board)).toEqual({
      start: 1,
      art: 3, history: 3, sports: 3, math: 3,
      geography: 3, biology: 3, physics: 3, chemistry: 3,
      any: 3, quick: 3,
      forward: 2, back: 2,
      addPoints: 2, subtractPoints: 2,
      distributePoints: 1,
    });
  });

  it("never puts two squares of the same subject next to each other (including the wrap-around)", () => {
    const size = boardSize(board);
    for (let i = 0; i < size; i++) {
      const a = squareAt(board, i);
      const b = squareAt(board, i + 1);
      if (isSubject(a)) expect(b).not.toBe(a);
    }
  });
});

describe("squareAt", () => {
  it("wraps forward past the end", () => {
    expect(squareAt(board, 40)).toBe("start");
    expect(squareAt(board, 41)).toBe("art");
    expect(squareAt(board, 85)).toBe(squareAt(board, 5));
  });

  it("wraps backward for negative positions", () => {
    expect(squareAt(board, -1)).toBe("quick");
    expect(squareAt(board, -40)).toBe("start");
  });
});

describe("parseBoard", () => {
  const ok = { name: "mini", squares: ["start", "art"] };

  it("accepts a valid small board, so the size can change later", () => {
    expect(boardSize(parseBoard(ok))).toBe(2);
  });

  it("rejects data that is not an object", () => {
    expect(() => parseBoard(null)).toThrow("object");
    expect(() => parseBoard("board")).toThrow("object");
  });

  it("rejects a missing or empty name", () => {
    expect(() => parseBoard({ squares: ["start", "art"] })).toThrow("name");
    expect(() => parseBoard({ name: " ", squares: ["start", "art"] })).toThrow("name");
  });

  it("rejects a squares list that is missing or too short", () => {
    expect(() => parseBoard({ name: "x" })).toThrow("squares");
    expect(() => parseBoard({ name: "x", squares: ["start"] })).toThrow("squares");
  });

  it("rejects unknown squares and says which one", () => {
    expect(() => parseBoard({ name: "x", squares: ["start", "cooking"] })).toThrow("square 1");
    expect(() => parseBoard({ name: "x", squares: ["start", 5] })).toThrow("square 1");
  });

  it("requires exactly one start, and it must be first", () => {
    expect(() => parseBoard({ name: "x", squares: ["art", "start"] })).toThrow("first square");
    expect(() => parseBoard({ name: "x", squares: ["start", "art", "start"] })).toThrow("exactly one");
  });
});
