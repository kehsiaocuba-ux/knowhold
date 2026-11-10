/**
 * School grades and difficulty levels (docs/DIFFICULTY_AND_HALL_OF_FAME.md).
 * Questions are written for a grade and a difficulty, and the Hall of Fame keeps a board per difficulty.
 */

export const GRADES = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, "college"] as const;
export type Grade = (typeof GRADES)[number];

export type GradeBand = "elementary" | "middle" | "high" | "college";

/** Difficulty from easiest to hardest. "hardest" is the top of the line. */
export const DIFFICULTIES = ["easy", "normal", "hard", "hardest"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export function isGrade(value: unknown): value is Grade {
  return (GRADES as readonly unknown[]).includes(value);
}

export function isDifficulty(value: unknown): value is Difficulty {
  return (DIFFICULTIES as readonly unknown[]).includes(value);
}

/** Grades 2 to 5 are elementary, 6 to 8 middle school, 9 to 12 high school. */
export function gradeBand(grade: Grade): GradeBand {
  if (grade === "college") return "college";
  if (grade <= 5) return "elementary";
  if (grade <= 8) return "middle";
  return "high";
}

/** Readable name, for example "2nd grade", "11th grade" or "College". */
export function gradeLabel(grade: Grade): string {
  if (grade === "college") return "College";
  const suffix = grade === 2 ? "nd" : grade === 3 ? "rd" : "th";
  return `${grade}${suffix} grade`;
}

/** 0 for easy up to 3 for hardest, so difficulties can be compared. */
export function difficultyRank(difficulty: Difficulty): number {
  return DIFFICULTIES.indexOf(difficulty);
}
