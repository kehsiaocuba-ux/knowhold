# Question format

Questions are stored as JSON lists in `data/questions/<language>/`. The code that checks and loads them is in
[`src/engine/questions.ts`](../src/engine/questions.ts), and every file is checked by the tests.

## One question

```json
{
  "id": "en-g7-normal-biology-001",
  "subject": "biology",
  "grade": 7,
  "difficulty": "normal",
  "language": "en",
  "text": "Which part of a cell produces most of the cell's energy?",
  "choices": ["Nucleus", "Mitochondria", "Ribosome", "Cell wall"],
  "answer": 1,
  "source": "original",
  "reviewed": false
}
```

| Field | Meaning |
|---|---|
| `id` | Unique. Lowercase letters, digits and dashes. Suggested pattern: `language-grade-difficulty-subject-number`. |
| `subject` | One of: art, history, sports, math, geography, biology, physics, chemistry. |
| `grade` | 2 to 12, or `"college"`. |
| `difficulty` | easy, normal, hard or hardest. |
| `language` | Language code, for example `en` or `es`. |
| `text` | The question. |
| `choices` | 3 to 5 different answers. |
| `answer` | Position of the correct choice in `choices`, counting from 0. |
| `source` | `"original"` if written for this project, otherwise where it comes from and its license. |
| `reviewed` | `true` only after a person has checked the facts and that the question suits children. |

The game shuffles the choices before showing them, so the position of the right answer in the file does not matter.

## How a test picks questions

For a subject square the game asks for 5 questions matching the subject, grade, difficulty and language.
It never repeats a question inside one test, and avoids questions already asked in the game until the pool runs out.
If a group has fewer than 5 questions, the game reports which group is missing.

## Rules for writing questions

- Write original questions, or use sources whose license allows it and record the source and license.
  Do not copy questions from commercial games, quiz sites or textbooks.
- One clearly correct answer. The wrong answers should be believable, not silly.
- Match the grade. The kind of knowledge should fit the age, not only the difficulty.
- Avoid facts that change (current office holders, records, prices), so answers do not go out of date.
- No trick questions, and nothing unsuitable for children.
- A person checks every question before it is marked `reviewed: true`.
  The game can be set to use only reviewed questions.

## Files

- `data/questions/en/grade7.json`: first starter set, 5 questions for each of the 8 subjects at grade 7, normal.
  They are drafts and are not marked as reviewed yet.
