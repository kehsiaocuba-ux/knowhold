/**
 * Questions: the file format, the validator and the loader that picks questions for a test.
 * The format is documented in docs/QUESTIONS.md.
 */

import { SUBJECTS, type Subject } from "./board";
import type { Rng } from "./dice";
import { type Difficulty, type Grade, isDifficulty, isGrade } from "./levels";

export interface Question {
  /** Unique id, lowercase letters, digits and dashes, for example "en-g7-normal-art-001". */
  id: string;
  subject: Subject;
  grade: Grade;
  difficulty: Difficulty;
  /** Language code, for example "en" or "es". */
  language: string;
  text: string;
  /** 3 to 5 different choices. */
  choices: string[];
  /** Index in `choices` of the one correct answer. */
  answer: number;
  /** "original", or where it comes from and under which license. */
  source: string;
  /** True once a person has checked the facts and that it suits children. */
  reviewed?: boolean;
}

export const MIN_CHOICES = 3;
export const MAX_CHOICES = 5;

const ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const LANGUAGE_PATTERN = /^[a-z]{2,3}(-[A-Za-z0-9]+)?$/;

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "";
}

/** Check one raw question (for example parsed JSON) and return it, or throw an Error that says what is wrong. */
export function parseQuestion(data: unknown): Question {
  if (typeof data !== "object" || data === null) throw new Error("a question must be an object");
  const q = data as Record<string, unknown>;
  const label = typeof q.id === "string" ? `question ${q.id}` : "question";

  if (!nonEmptyString(q.id) || !ID_PATTERN.test(q.id)) {
    throw new Error(`${label}: id must use lowercase letters, digits and dashes`);
  }
  if (!(SUBJECTS as readonly unknown[]).includes(q.subject)) {
    throw new Error(`${label}: unknown subject ${JSON.stringify(q.subject)}`);
  }
  if (!isGrade(q.grade)) throw new Error(`${label}: unknown grade ${JSON.stringify(q.grade)}`);
  if (!isDifficulty(q.difficulty)) {
    throw new Error(`${label}: unknown difficulty ${JSON.stringify(q.difficulty)}`);
  }
  if (!nonEmptyString(q.language) || !LANGUAGE_PATTERN.test(q.language)) {
    throw new Error(`${label}: language must be a code like "en" or "es"`);
  }
  if (!nonEmptyString(q.text)) throw new Error(`${label}: text is empty`);
  if (!Array.isArray(q.choices) || q.choices.length < MIN_CHOICES || q.choices.length > MAX_CHOICES) {
    throw new Error(`${label}: needs ${MIN_CHOICES} to ${MAX_CHOICES} choices`);
  }
  if (!q.choices.every(nonEmptyString)) throw new Error(`${label}: every choice needs text`);
  const lowered = (q.choices as string[]).map((c) => c.trim().toLowerCase());
  if (new Set(lowered).size !== lowered.length) throw new Error(`${label}: choices must all be different`);
  if (!Number.isInteger(q.answer) || (q.answer as number) < 0 || (q.answer as number) >= q.choices.length) {
    throw new Error(`${label}: answer must be the index of one of the choices`);
  }
  if (!nonEmptyString(q.source)) throw new Error(`${label}: source is empty (use "original" if you wrote it)`);
  if (q.reviewed !== undefined && typeof q.reviewed !== "boolean") {
    throw new Error(`${label}: reviewed must be true or false`);
  }

  return {
    id: q.id,
    subject: q.subject as Subject,
    grade: q.grade,
    difficulty: q.difficulty,
    language: q.language,
    text: (q.text as string).trim(),
    choices: (q.choices as string[]).map((c) => c.trim()),
    answer: q.answer as number,
    source: (q.source as string).trim(),
    ...(q.reviewed !== undefined ? { reviewed: q.reviewed as boolean } : {}),
  };
}

/** Check a whole list of raw questions. Ids must be unique across the list. */
export function parseQuestionBank(data: unknown): Question[] {
  if (!Array.isArray(data)) throw new Error("a question bank must be a list of questions");
  const questions = data.map((item) => parseQuestion(item));
  const seen = new Set<string>();
  for (const q of questions) {
    if (seen.has(q.id)) throw new Error(`duplicate question id ${q.id}`);
    seen.add(q.id);
  }
  return questions;
}

export function isCorrect(question: Question, choiceIndex: number): boolean {
  return choiceIndex === question.answer;
}

/** How many of the given answers are right. A null answer (no answer, or time ran out) counts as wrong. */
export function countCorrect(questions: Question[], answers: (number | null)[]): number {
  return questions.reduce((sum, q, i) => sum + (isCorrect(q, answers[i] ?? -1) ? 1 : 0), 0);
}

/** A copy of the question with the choices in a random order and `answer` updated to match. */
export function shuffleChoices(question: Question, rng: Rng): Question {
  const order = question.choices.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [order[i], order[j]] = [order[j] as number, order[i] as number];
  }
  return {
    ...question,
    choices: order.map((i) => question.choices[i] as string),
    answer: order.indexOf(question.answer),
  };
}

export interface QuestionQuery {
  subject: Subject;
  grade: Grade;
  difficulty: Difficulty;
  /** Defaults to "en". */
  language?: string;
  /** Only use questions that a person has checked. */
  reviewedOnly?: boolean;
}

export interface Picked {
  questions: Question[];
  /** Ids already asked. Pass this back in the next time so questions do not repeat. */
  used: ReadonlySet<string>;
}

/** Pick `count` random items from a list, without repeats. */
function sample<T>(items: readonly T[], count: number, rng: Rng): T[] {
  const copy = [...items];
  for (let i = 0; i < count; i++) {
    const j = i + Math.floor(rng() * (copy.length - i));
    [copy[i], copy[j]] = [copy[j] as T, copy[i] as T];
  }
  return copy.slice(0, count);
}

/**
 * Pick `count` questions for a test (5 for a subject square), avoiding questions already used.
 * When the unused questions run out, the pool starts again, but never repeats a question within one test.
 * Throws if the bank has fewer than `count` matching questions at all.
 */
export function pickQuestions(
  bank: readonly Question[],
  query: QuestionQuery,
  count: number,
  rng: Rng,
  used: ReadonlySet<string> = new Set(),
): Picked {
  const language = query.language ?? "en";
  const pool = bank.filter(
    (q) =>
      q.subject === query.subject &&
      q.grade === query.grade &&
      q.difficulty === query.difficulty &&
      q.language === language &&
      (!query.reviewedOnly || q.reviewed === true),
  );
  if (pool.length < count) {
    throw new Error(
      `not enough questions for ${query.subject}, grade ${query.grade}, ${query.difficulty}, ${language}: ` +
        `have ${pool.length}, need ${count}`,
    );
  }

  const fresh = pool.filter((q) => !used.has(q.id));
  const nextUsed = new Set(used);
  if (fresh.length >= count) {
    const picked = sample(fresh, count, rng);
    picked.forEach((q) => nextUsed.add(q.id));
    return { questions: picked, used: nextUsed };
  }

  // Not enough fresh questions: use all of them, then start the pool again for the rest.
  pool.forEach((q) => nextUsed.delete(q.id));
  const freshIds = new Set(fresh.map((q) => q.id));
  const refill = sample(
    pool.filter((q) => !freshIds.has(q.id)),
    count - fresh.length,
    rng,
  );
  refill.forEach((q) => nextUsed.add(q.id));
  return { questions: [...fresh, ...refill], used: nextUsed };
}
