import { describe, expect, it } from "vitest";
import {
  claimsOwnership,
  levelAfterOwnerTest,
  levelAfterVisit,
  pointsForCorrect,
  rent,
} from "../src/engine/scoring";

describe("pointsForCorrect (RULES.md 5.1)", () => {
  it("matches the points table", () => {
    expect([0, 1, 2, 3, 4, 5].map((c) => pointsForCorrect(c))).toEqual([0, 10, 20, 30, 60, 100]);
  });

  it("rejects values outside 0 to 5", () => {
    expect(() => pointsForCorrect(-1)).toThrow(RangeError);
    expect(() => pointsForCorrect(6)).toThrow(RangeError);
    expect(() => pointsForCorrect(2.5)).toThrow(RangeError);
  });
});

describe("claimsOwnership", () => {
  it("needs 4 or 5 correct answers", () => {
    expect([0, 1, 2, 3, 4, 5].map(claimsOwnership)).toEqual([false, false, false, false, true, true]);
  });
});

describe("levelAfterOwnerTest (RULES.md 5.2)", () => {
  it("raises the level only with 5 correct", () => {
    expect(levelAfterOwnerTest(1, 5)).toBe(2);
    expect(levelAfterOwnerTest(2, 5)).toBe(3);
    expect(levelAfterOwnerTest(1, 4)).toBe(1);
  });

  it("never goes above level 3", () => {
    expect(levelAfterOwnerTest(3, 5)).toBe(3);
  });
});

describe("rent with one square (RULES.md 5.3 table)", () => {
  const table: Record<number, number[]> = {
    1: [100, 90, 80, 70, 40, 0],
    2: [200, 180, 160, 140, 80, 0],
    3: [300, 270, 240, 210, 120, 0],
  };

  for (const level of [1, 2, 3]) {
    it(`matches the level ${level} column`, () => {
      expect([0, 1, 2, 3, 4, 5].map((c) => rent(level, c))).toEqual(table[level]);
    });
  }
});

describe("rent with several squares of one subject (RULES.md 5.4)", () => {
  it("three squares, lowest level 2: 600, 540, 480, 420, 240, 0", () => {
    expect([0, 1, 2, 3, 4, 5].map((c) => rent(2, c, 3))).toEqual([600, 540, 480, 420, 240, 0]);
  });

  it("three squares, lowest level 3: 900, 810, 720, 630, 360, 0", () => {
    expect([0, 1, 2, 3, 4, 5].map((c) => rent(3, c, 3))).toEqual([900, 810, 720, 630, 360, 0]);
  });

  it("two squares double the rent", () => {
    expect(rent(1, 0, 2)).toBe(200);
    expect(rent(2, 2, 2)).toBe(320);
  });

  it("the multiplier stops at 3", () => {
    expect(rent(1, 0, 4)).toBe(300);
    expect(rent(1, 0, 9)).toBe(300);
  });

  it("rejects bad input", () => {
    expect(() => rent(0, 1)).toThrow(RangeError);
    expect(() => rent(4, 1)).toThrow(RangeError);
    expect(() => rent(1, 6)).toThrow(RangeError);
    expect(() => rent(1, 1, 0)).toThrow(RangeError);
  });
});

describe("levelAfterVisit", () => {
  it("5 correct removes one level; level 1 becomes free (0)", () => {
    expect(levelAfterVisit(3, 5)).toBe(2);
    expect(levelAfterVisit(2, 5)).toBe(1);
    expect(levelAfterVisit(1, 5)).toBe(0);
  });

  it("fewer than 5 correct changes nothing", () => {
    expect(levelAfterVisit(2, 4)).toBe(2);
    expect(levelAfterVisit(1, 0)).toBe(1);
  });
});
