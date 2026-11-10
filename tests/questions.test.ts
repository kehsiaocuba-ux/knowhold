import { describe, expect, it } from "vitest";
import starter from "../data/questions/en/grade7.json";
import { SUBJECTS } from "../src/engine/board";
import { seededRng } from "../src/engine/dice";
import {
  type Question,
  countCorrect,
  isCorrect,
  parseQuestion,
  parseQuestionBank,
  pickQuestions,
  shuffleChoices,
} from "../src/engine/questions";

function raw(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "en-g7-normal-art-001",
    subject: "art",
    grade: 7,
    difficulty: "normal",
    language: "en",
    text: "Who painted the Mona Lisa?",
    choices: ["Michelangelo", "Leonardo da Vinci", "Raphael"],
    answer: 1,
    source: "original",
    ...overrides,
  };
}

/** A bank of n valid questions for one subject, grade and difficulty. */
function bank(n: number, overrides: Record<string, unknown> = {}): Question[] {
  return Array.from({ length: n }, (_, i) =>
    parseQuestion(raw({ id: `q-${overrides.subject ?? "art"}-${i + 1}`, ...overrides })),
  );
}

const query = { subject: "art", grade: 7, difficulty: "normal" } as const;

describe("parseQuestion", () => {
  it("accepts a valid question and trims the text", () => {
    const q = parseQuestion(raw({ text: "  Who painted the Mona Lisa?  " }));
    expect(q.text).toBe("Who painted the Mona Lisa?");
    expect(q.answer).toBe(1);
  });

  it("keeps the reviewed flag when given", () => {
    expect(parseQuestion(raw({ reviewed: true })).reviewed).toBe(true);
    expect(parseQuestion(raw()).reviewed).toBeUndefined();
  });

  const bad: [string, Record<string, unknown>, string][] = [
    ["a bad id", { id: "Art 1" }, "id"],
    ["an unknown subject", { subject: "cooking" }, "subject"],
    ["an unknown grade", { grade: 1 }, "grade"],
    ["an unknown difficulty", { difficulty: "medium" }, "difficulty"],
    ["a bad language code", { language: "English" }, "language"],
    ["empty text", { text: "  " }, "text"],
    ["too few choices", { choices: ["a", "b"], answer: 0 }, "choices"],
    ["too many choices", { choices: ["a", "b", "c", "d", "e", "f"], answer: 0 }, "choices"],
    ["an empty choice", { choices: ["a", " ", "c"], answer: 0 }, "choice"],
    ["repeated choices", { choices: ["Rome", "rome ", "Paris"], answer: 0 }, "different"],
    ["an answer outside the choices", { answer: 3 }, "answer"],
    ["a fractional answer", { answer: 1.5 }, "answer"],
    ["an empty source", { source: "" }, "source"],
    ["a reviewed flag that is not true or false", { reviewed: "yes" }, "reviewed"],
  ];
  for (const [name, change, word] of bad) {
    it(`rejects ${name}`, () => {
      expect(() => parseQuestion(raw(change))).toThrow(word);
    });
  }

  it("rejects something that is not an object", () => {
    expect(() => parseQuestion(null)).toThrow("object");
    expect(() => parseQuestion("question")).toThrow("object");
  });
});

describe("parseQuestionBank", () => {
  it("accepts a list of valid questions", () => {
    expect(parseQuestionBank([raw(), raw({ id: "en-g7-normal-art-002" })])).toHaveLength(2);
  });

  it("rejects duplicate ids and says which one", () => {
    expect(() => parseQuestionBank([raw(), raw()])).toThrow("duplicate question id en-g7-normal-art-001");
  });

  it("rejects data that is not a list", () => {
    expect(() => parseQuestionBank({})).toThrow("list");
  });
});

describe("answers", () => {
  const q = parseQuestion(raw());

  it("isCorrect compares with the right choice", () => {
    expect(isCorrect(q, 1)).toBe(true);
    expect(isCorrect(q, 0)).toBe(false);
  });

  it("countCorrect counts right answers, and a missing answer is wrong", () => {
    const qs = bank(4);
    expect(countCorrect(qs, [1, 1, 0, null])).toBe(2);
    expect(countCorrect(qs, [1, 1])).toBe(2);
    expect(countCorrect(qs, [])).toBe(0);
  });
});

describe("shuffleChoices", () => {
  const q = parseQuestion(raw({ choices: ["A", "B", "C", "D"], answer: 2 }));

  it("keeps the same choices and the same correct answer text", () => {
    for (let seed = 1; seed <= 20; seed++) {
      const s = shuffleChoices(q, seededRng(seed));
      expect([...s.choices].sort()).toEqual(["A", "B", "C", "D"]);
      expect(s.choices[s.answer]).toBe("C");
    }
  });

  it("does not change the original question", () => {
    shuffleChoices(q, seededRng(3));
    expect(q.choices).toEqual(["A", "B", "C", "D"]);
    expect(q.answer).toBe(2);
  });

  it("gives the same order for the same seed", () => {
    expect(shuffleChoices(q, seededRng(9))).toEqual(shuffleChoices(q, seededRng(9)));
  });
});

describe("pickQuestions", () => {
  it("picks the requested number of different questions that match the query", () => {
    const mixed = [
      ...bank(8),
      ...bank(8, { subject: "math" }),
      ...bank(8, { grade: 8, subject: "art", id: "x" }).map((q, i) => ({ ...q, id: `g8-${i}` })),
      ...bank(8, { difficulty: "hard", subject: "art" }).map((q, i) => ({ ...q, id: `hard-${i}` })),
      ...bank(8, { language: "es", subject: "art" }).map((q, i) => ({ ...q, id: `es-${i}` })),
    ];
    const { questions } = pickQuestions(mixed, query, 5, seededRng(1));
    expect(questions).toHaveLength(5);
    expect(new Set(questions.map((q) => q.id)).size).toBe(5);
    for (const q of questions) {
      expect([q.subject, q.grade, q.difficulty, q.language]).toEqual(["art", 7, "normal", "en"]);
    }
  });

  it("throws a clear error when the bank does not have enough questions", () => {
    expect(() => pickQuestions(bank(4), query, 5, seededRng(1))).toThrow("have 4, need 5");
  });

  it("does not repeat questions across tests until the pool runs out", () => {
    const pool = bank(10);
    const first = pickQuestions(pool, query, 5, seededRng(1));
    const second = pickQuestions(pool, query, 5, seededRng(2), first.used);
    const firstIds = first.questions.map((q) => q.id);
    const secondIds = second.questions.map((q) => q.id);
    expect(secondIds.filter((id) => firstIds.includes(id))).toEqual([]);
  });

  it("starts the pool again when it runs out, without repeating inside one test", () => {
    const pool = bank(7);
    const first = pickQuestions(pool, query, 5, seededRng(1));
    const second = pickQuestions(pool, query, 5, seededRng(2), first.used);
    const ids = second.questions.map((q) => q.id);
    expect(new Set(ids).size).toBe(5);
    const unusedBefore = pool.map((q) => q.id).filter((id) => !first.used.has(id));
    for (const id of unusedBefore) expect(ids).toContain(id); // the 2 fresh ones are all used
  });

  it("does not change the used set it was given", () => {
    const used = new Set<string>();
    pickQuestions(bank(8), query, 5, seededRng(1), used);
    expect(used.size).toBe(0);
  });

  it("gives the same questions for the same seed", () => {
    const pool = bank(12);
    const a = pickQuestions(pool, query, 5, seededRng(7)).questions.map((q) => q.id);
    const b = pickQuestions(pool, query, 5, seededRng(7)).questions.map((q) => q.id);
    expect(a).toEqual(b);
  });

  it("can use only questions that a person has reviewed", () => {
    const pool = [...bank(6, { reviewed: true }), ...bank(6).map((q, i) => ({ ...q, id: `u-${i}` }))];
    const { questions } = pickQuestions(pool, { ...query, reviewedOnly: true }, 5, seededRng(1));
    expect(questions.every((q) => q.reviewed === true)).toBe(true);
    expect(() => pickQuestions(bank(8), { ...query, reviewedOnly: true }, 5, seededRng(1))).toThrow("have 0");
  });
});

describe("starter questions (data/questions/en/grade7.json)", () => {
  const questions = parseQuestionBank(starter);

  it("has 5 questions for each of the 8 subjects, all grade 7, normal, English", () => {
    expect(questions).toHaveLength(40);
    for (const subject of SUBJECTS) {
      const mine = questions.filter((q) => q.subject === subject);
      expect(mine).toHaveLength(5);
      expect(mine.every((q) => q.grade === 7 && q.difficulty === "normal" && q.language === "en")).toBe(true);
    }
  });

  it("is original work, and nothing is marked as checked by a person yet", () => {
    expect(questions.every((q) => q.source === "original")).toBe(true);
    expect(questions.every((q) => q.reviewed === false)).toBe(true);
  });

  it("can fill a 5-question test for every subject", () => {
    for (const subject of SUBJECTS) {
      const { questions: test } = pickQuestions(questions, { subject, grade: 7, difficulty: "normal" }, 5, seededRng(4));
      expect(test).toHaveLength(5);
    }
  });

  it("does not always put the right answer in the same position", () => {
    expect(new Set(questions.map((q) => q.answer)).size).toBeGreaterThan(2);
  });
});
