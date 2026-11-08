import { describe, expect, it } from "vitest";
import boardData from "../data/board.json";
import { parseBoard, squareAt } from "../src/engine/board";
import { rollDie, seededRng } from "../src/engine/dice";
import { LAP_BONUS, movePiece, newPiece, positionOf, type Piece } from "../src/engine/movement";

const board = parseBoard(boardData);
const SIZE = board.squares.length; // 40

describe("movePiece", () => {
  it("starts at position 0 (Start)", () => {
    expect(positionOf(newPiece(), SIZE)).toBe(0);
  });

  it("moves forward by the roll with no bonus inside the first lap", () => {
    const r = movePiece(newPiece(), 3, SIZE);
    expect(r.position).toBe(3);
    expect(r.lapsGained).toBe(0);
    expect(r.bonus).toBe(0);
  });

  it("gives the bonus when landing exactly on Start", () => {
    const r = movePiece({ progress: 38, lapsAwarded: 0 }, 2, SIZE);
    expect(r.position).toBe(0);
    expect(r.lapsGained).toBe(1);
    expect(r.bonus).toBe(LAP_BONUS);
  });

  it("gives the bonus when passing Start", () => {
    const r = movePiece({ progress: 39, lapsAwarded: 0 }, 5, SIZE);
    expect(r.position).toBe(4);
    expect(r.bonus).toBe(100);
  });

  it("counts several laps in one move", () => {
    const r = movePiece(newPiece(), 85, SIZE);
    expect(r.position).toBe(5);
    expect(r.lapsGained).toBe(2);
    expect(r.bonus).toBe(200);
  });

  it("moving backward from Start wraps to the end of the board with no bonus", () => {
    const r = movePiece(newPiece(), -3, SIZE);
    expect(r.position).toBe(37);
    expect(r.bonus).toBe(0);
  });

  it("does not change the piece it was given", () => {
    const piece: Piece = { progress: 10, lapsAwarded: 0 };
    movePiece(piece, 5, SIZE);
    expect(piece).toEqual({ progress: 10, lapsAwarded: 0 });
  });

  it("moving back and forth across Start never pays the same lap twice", () => {
    let piece: Piece = { progress: 38, lapsAwarded: 0 };
    let total = 0;
    for (const step of [3, -3, 3, -3, 3]) {
      const r = movePiece(piece, step, SIZE);
      piece = r.piece;
      total += r.bonus;
    }
    expect(total).toBe(100);
  });

  it("going back behind Start and returning is not a lap", () => {
    const back = movePiece(newPiece(), -3, SIZE);
    const forward = movePiece(back.piece, 3, SIZE);
    expect(forward.bonus).toBe(0);
    const lap = movePiece(forward.piece, 40, SIZE);
    expect(lap.bonus).toBe(100);
  });

  it("lands on the squares of the board data", () => {
    expect(squareAt(board, movePiece(newPiece(), 4, SIZE).position)).toBe("math");
    expect(squareAt(board, movePiece(newPiece(), 10, SIZE).position)).toBe("quick");
  });

  it("rejects bad input", () => {
    expect(() => movePiece(newPiece(), 1.5, SIZE)).toThrow(RangeError);
    expect(() => movePiece(newPiece(), 1, 1)).toThrow(RangeError);
    expect(() => positionOf(newPiece(), 0)).toThrow(RangeError);
  });
});

describe("a whole game of rolls", () => {
  it("pays exactly one bonus per lap over 200 seeded rolls", () => {
    const rng = seededRng(2026);
    let piece = newPiece();
    let total = 0;
    let travelled = 0;
    for (let i = 0; i < 200; i++) {
      const roll = rollDie(rng);
      travelled += roll;
      const r = movePiece(piece, roll, SIZE);
      piece = r.piece;
      total += r.bonus;
      expect(r.position).toBe(travelled % SIZE);
    }
    expect(total).toBe(Math.floor(travelled / SIZE) * LAP_BONUS);
  });
});
