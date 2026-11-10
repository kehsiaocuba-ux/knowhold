/**
 * The numbers that tune the game (RULES.md sections 2, 5 and 10).
 * Keeping them in one object lets us test different balances without touching the engine.
 */

export interface Rules {
  /** Points every player starts with. */
  startingPoints: number;
  /** Points for each lap (landing on or passing Start). */
  lapBonus: number;
  /** Points earned for 0 to 5 correct answers on a subject test. */
  pointsTable: readonly number[];
  /** Rent at level 1 with 0 correct answers. */
  baseRent: number;
  /** Rent reduction for 0 to 5 correct answers at level 1 (multiplied by the level). */
  rentDiscount: readonly number[];
}

/** The numbers exactly as written in the original design notes (kept for comparison and tests). */
export const ORIGINAL_RULES: Rules = {
  startingPoints: 500,
  lapBonus: 100,
  pointsTable: [0, 10, 20, 30, 60, 100],
  baseRent: 100,
  rentDiscount: [0, 10, 20, 30, 60, 100],
};

/**
 * The default balance, chosen from the simulations in docs/BALANCE.md (setting B):
 * lap bonus 50, points earned by tests halved, rent reductions unchanged.
 */
export const DEFAULT_RULES: Rules = {
  ...ORIGINAL_RULES,
  lapBonus: 50,
  pointsTable: [0, 5, 10, 15, 30, 50],
};

/** Copy of the rules with some values changed, used by the balance simulations. */
export function withRules(changes: Partial<Rules>, base: Rules = DEFAULT_RULES): Rules {
  return { ...base, ...changes };
}

/** Turn limits offered before a game (turns per player). Any positive whole number is also allowed. */
export const TURN_LIMIT_PRESETS = [40, 80, 120] as const;
