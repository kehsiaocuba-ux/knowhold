import { describe, expect, it } from "vitest";
import {
  DIFFICULTIES,
  GRADES,
  difficultyRank,
  gradeBand,
  gradeLabel,
  isDifficulty,
  isGrade,
} from "../src/engine/levels";

describe("grades", () => {
  it("run from 2nd grade to 12th grade, then college", () => {
    expect([...GRADES]).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, "college"]);
  });

  it("are grouped into elementary, middle, high school and college", () => {
    expect([2, 3, 4, 5].map((g) => gradeBand(g as 2))).toEqual(["elementary", "elementary", "elementary", "elementary"]);
    expect([6, 7, 8].map((g) => gradeBand(g as 6))).toEqual(["middle", "middle", "middle"]);
    expect([9, 10, 11, 12].map((g) => gradeBand(g as 9))).toEqual(["high", "high", "high", "high"]);
    expect(gradeBand("college")).toBe("college");
  });

  it("have readable names", () => {
    expect(gradeLabel(2)).toBe("2nd grade");
    expect(gradeLabel(3)).toBe("3rd grade");
    expect(gradeLabel(4)).toBe("4th grade");
    expect(gradeLabel(11)).toBe("11th grade");
    expect(gradeLabel(12)).toBe("12th grade");
    expect(gradeLabel("college")).toBe("College");
  });

  it("are recognised or rejected by isGrade", () => {
    expect(isGrade(7)).toBe(true);
    expect(isGrade("college")).toBe(true);
    expect(isGrade(1)).toBe(false);
    expect(isGrade(13)).toBe(false);
    expect(isGrade("7")).toBe(false);
  });
});

describe("difficulties", () => {
  it("are easy, normal, hard and hardest, in that order", () => {
    expect([...DIFFICULTIES]).toEqual(["easy", "normal", "hard", "hardest"]);
    expect(DIFFICULTIES.map(difficultyRank)).toEqual([0, 1, 2, 3]);
  });

  it("are recognised or rejected by isDifficulty", () => {
    expect(isDifficulty("hardest")).toBe(true);
    expect(isDifficulty("medium")).toBe(false);
    expect(isDifficulty(undefined)).toBe(false);
  });
});
