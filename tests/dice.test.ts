import { describe, expect, it } from "vitest";
import { rollDie, seededRng } from "../src/engine/dice";

describe("rollDie", () => {
  it("maps the ends of the random range to 1 and 6", () => {
    expect(rollDie(() => 0)).toBe(1);
    expect(rollDie(() => 0.999999)).toBe(6);
  });

  it("splits the range evenly into six faces", () => {
    expect(rollDie(() => 1 / 6 - 0.0001)).toBe(1);
    expect(rollDie(() => 1 / 6 + 0.0001)).toBe(2);
    expect(rollDie(() => 5 / 6 + 0.0001)).toBe(6);
  });

  it("always returns an integer from 1 to 6", () => {
    const rng = seededRng(12345);
    for (let i = 0; i < 5000; i++) {
      const roll = rollDie(rng);
      expect(Number.isInteger(roll)).toBe(true);
      expect(roll).toBeGreaterThanOrEqual(1);
      expect(roll).toBeLessThanOrEqual(6);
    }
  });

  it("uses every face over many rolls", () => {
    const rng = seededRng(7);
    const seen = new Set<number>();
    for (let i = 0; i < 500; i++) seen.add(rollDie(rng));
    expect([...seen].sort()).toEqual([1, 2, 3, 4, 5, 6]);
  });
});

describe("seededRng", () => {
  it("gives the same sequence for the same seed", () => {
    const a = seededRng(42);
    const b = seededRng(42);
    const seqA = Array.from({ length: 10 }, () => rollDie(a));
    const seqB = Array.from({ length: 10 }, () => rollDie(b));
    expect(seqA).toEqual(seqB);
  });

  it("gives different sequences for different seeds", () => {
    const a = seededRng(1);
    const b = seededRng(2);
    const seqA = Array.from({ length: 20 }, () => rollDie(a));
    const seqB = Array.from({ length: 20 }, () => rollDie(b));
    expect(seqA).not.toEqual(seqB);
  });
});
