/**
 * Scoring, ownership and rent rules for subject squares.
 * Source of truth: RULES.md sections 5.1 to 5.4.
 * The numbers come from a Rules object (default: the original design notes).
 */

import { DEFAULT_RULES, type Rules } from "./rules";

export const QUESTIONS_PER_TEST = 5;
export const MIN_LEVEL = 1;
export const MAX_LEVEL = 3;
export const BASE_RENT = DEFAULT_RULES.baseRent;
export const MAX_SAME_SUBJECT_MULTIPLIER = 3;

function assertCorrect(correct: number): void {
  if (!Number.isInteger(correct) || correct < 0 || correct > QUESTIONS_PER_TEST) {
    throw new RangeError(`correct must be an integer from 0 to ${QUESTIONS_PER_TEST}, got ${correct}`);
  }
}

function assertLevel(level: number): void {
  if (!Number.isInteger(level) || level < MIN_LEVEL || level > MAX_LEVEL) {
    throw new RangeError(`level must be an integer from ${MIN_LEVEL} to ${MAX_LEVEL}, got ${level}`);
  }
}

/** Points earned for the number of correct answers out of 5. */
export function pointsForCorrect(correct: number, rules: Rules = DEFAULT_RULES): number {
  assertCorrect(correct);
  return rules.pointsTable[correct] as number;
}

/** Rent reduction for the number of correct answers at level 1. */
export function rentDiscountForCorrect(correct: number, rules: Rules = DEFAULT_RULES): number {
  assertCorrect(correct);
  return rules.rentDiscount[correct] as number;
}

/** 4 or 5 correct answers on an unowned square claim it at level 1. */
export function claimsOwnership(correct: number): boolean {
  assertCorrect(correct);
  return correct >= 4;
}

/** The owner retakes the test on their own square: 5 correct raises the level (max 3). */
export function levelAfterOwnerTest(level: number, correct: number): number {
  assertLevel(level);
  assertCorrect(correct);
  return correct === QUESTIONS_PER_TEST ? Math.min(level + 1, MAX_LEVEL) : level;
}

/**
 * Rent a visitor pays (RULES.md 5.3 and 5.4):
 *   rent = lowestLevel x (100 - pointsForCorrect(correct)) x min(ownedCount, 3)
 * lowestLevel is the lowest level among the owner's squares of that subject.
 * ownedCount is how many squares of that subject the owner holds (at least 1).
 */
export function rent(
  lowestLevel: number,
  correct: number,
  ownedCount = 1,
  rules: Rules = DEFAULT_RULES,
): number {
  assertLevel(lowestLevel);
  assertCorrect(correct);
  if (!Number.isInteger(ownedCount) || ownedCount < 1) {
    throw new RangeError(`ownedCount must be an integer of at least 1, got ${ownedCount}`);
  }
  const multiplier = Math.min(ownedCount, MAX_SAME_SUBJECT_MULTIPLIER);
  return lowestLevel * (rules.baseRent - rentDiscountForCorrect(correct, rules)) * multiplier;
}

/**
 * Level of the visited square after a visitor's test.
 * 5 correct removes one level; 0 means the square becomes free.
 */
export function levelAfterVisit(level: number, correct: number): number {
  assertLevel(level);
  assertCorrect(correct);
  return correct === QUESTIONS_PER_TEST ? level - 1 : level;
}
