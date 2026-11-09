import { describe, expect, it } from "vitest";
import boardData from "../data/board.json";
import { parseBoard } from "../src/engine/board";
import { BALANCED_RULES, TURN_LIMIT_PRESETS, withRules } from "../src/engine/rules";
import { rollDie, seededRng } from "../src/engine/dice";
import {
  STARTING_POINTS,
  activePlayers,
  charge,
  currentPlayer,
  describeLanding,
  endTurn,
  getPlayer,
  moveCurrent,
  standings,
  newGame,
  resolveClaim,
  resolveOwn,
  resolveVisit,
  type GameState,
} from "../src/engine/game";

const board = parseBoard(boardData);
// Board positions used below: 1 art, 11 art, 23 art, 2 history, 0 start, 9 any.

function game(names = ["Ana", "Ben"]): GameState {
  return newGame(board, names);
}

/** Put a player on a board position (test helper). */
function place(state: GameState, id: string, position: number): GameState {
  return {
    ...state,
    players: state.players.map((p) =>
      p.id === id ? { ...p, piece: { progress: position, lapsAwarded: 0 } } : p,
    ),
  };
}

function setPoints(state: GameState, id: string, points: number): GameState {
  return { ...state, players: state.players.map((p) => (p.id === id ? { ...p, points } : p)) };
}

function own(state: GameState, position: number, owner: string, level: number): GameState {
  return { ...state, ownership: { ...state.ownership, [position]: { owner, level } } };
}

describe("newGame", () => {
  it("starts everyone with 500 points at Start, first player to move", () => {
    const s = game(["Ana", "Ben", "Cy"]);
    expect(s.players.map((p) => p.points)).toEqual([STARTING_POINTS, STARTING_POINTS, STARTING_POINTS]);
    expect(s.players.map((p) => p.id)).toEqual(["p1", "p2", "p3"]);
    expect(currentPlayer(s).name).toBe("Ana");
    expect(s.turns).toBe(0);
    expect(s.winner).toBeNull();
  });

  it("needs at least 2 players with different non-empty names", () => {
    expect(() => newGame(board, ["Ana"])).toThrow("at least 2");
    expect(() => newGame(board, ["Ana", " "])).toThrow("empty");
    expect(() => newGame(board, ["Ana", "ana"])).toThrow("different");
  });
});

describe("moveCurrent and describeLanding", () => {
  it("moves the current player and reports an unowned subject square", () => {
    const { state, landing } = moveCurrent(game(), 1);
    expect(landing).toEqual({ kind: "claimable", position: 1, subject: "art" });
    expect(getPlayer(state, "p1").piece.progress).toBe(1);
    expect(getPlayer(state, "p2").piece.progress).toBe(0);
  });

  it("pays the lap bonus when passing Start", () => {
    const s = place(game(), "p1", 38);
    const { state } = moveCurrent(s, 3);
    expect(getPlayer(state, "p1").points).toBe(600);
  });

  it("reports special squares as other", () => {
    const { landing } = moveCurrent(game(), 9);
    expect(landing).toEqual({ kind: "other", position: 9, square: "any" });
  });

  it("reports your own square", () => {
    const s = own(place(game(), "p1", 0), 1, "p1", 2);
    expect(moveCurrent(s, 1).landing).toEqual({ kind: "own", position: 1, subject: "art", level: 2 });
  });

  it("reports another player's square with the owner's subject totals", () => {
    let s = place(game(), "p1", 0);
    s = own(own(own(s, 1, "p2", 3), 11, "p2", 3), 23, "p2", 2);
    expect(moveCurrent(s, 1).landing).toEqual({
      kind: "visit", position: 1, subject: "art", owner: "p2", level: 3, ownerSquares: 3, lowestLevel: 2,
    });
  });
});

describe("resolveClaim", () => {
  const onArt = () => moveCurrent(game(), 1).state;

  it("earns points without ownership below 4 correct", () => {
    const s = resolveClaim(onArt(), 3);
    expect(getPlayer(s, "p1").points).toBe(530);
    expect(s.ownership).toEqual({});
  });

  it("claims the square at level 1 with 4 correct", () => {
    const s = resolveClaim(onArt(), 4);
    expect(getPlayer(s, "p1").points).toBe(560);
    expect(s.ownership[1]).toEqual({ owner: "p1", level: 1 });
  });

  it("earns 100 and claims with 5 correct", () => {
    const s = resolveClaim(onArt(), 5);
    expect(getPlayer(s, "p1").points).toBe(600);
    expect(s.ownership[1]).toEqual({ owner: "p1", level: 1 });
  });

  it("refuses to run on the wrong kind of square", () => {
    expect(() => resolveClaim(game(), 5)).toThrow("unowned subject");
  });
});

describe("resolveOwn", () => {
  it("raises the level with 5 correct and never above 3", () => {
    let s = moveCurrent(own(game(), 1, "p1", 1), 1).state;
    s = resolveOwn(s, 5);
    expect(s.ownership[1]).toEqual({ owner: "p1", level: 2 });
    const top = resolveOwn(moveCurrent(own(game(), 1, "p1", 3), 1).state, 5);
    expect(top.ownership[1]?.level).toBe(3);
  });

  it("keeps the level below 5 correct", () => {
    const s = resolveOwn(moveCurrent(own(game(), 1, "p1", 2), 1).state, 4);
    expect(s.ownership[1]?.level).toBe(2);
  });
});

describe("resolveVisit (rent)", () => {
  it("pays full rent with 0 correct and the owner receives it", () => {
    const s = resolveVisit(moveCurrent(own(game(), 1, "p2", 1), 1).state, 0);
    expect(getPlayer(s, "p1").points).toBe(400);
    expect(getPlayer(s, "p2").points).toBe(600);
  });

  it("correct answers lower the rent", () => {
    const s = resolveVisit(moveCurrent(own(game(), 1, "p2", 2), 1).state, 3);
    expect(getPlayer(s, "p1").points).toBe(500 - 140);
    expect(getPlayer(s, "p2").points).toBe(500 + 140);
  });

  it("uses the same-subject multiplier and the owner's lowest level", () => {
    let g = setPoints(own(own(own(game(), 1, "p2", 3), 11, "p2", 3), 23, "p2", 2), "p1", 1000);
    g = resolveVisit(moveCurrent(g, 1).state, 1);
    // rent = lowest level 2 x (100 - 10) x 3 squares = 540
    expect(getPlayer(g, "p1").points).toBe(1000 - 540);
    expect(getPlayer(g, "p2").points).toBe(500 + 540);
  });

  it("5 correct pays nothing and lowers the square one level", () => {
    const s = resolveVisit(moveCurrent(own(game(), 1, "p2", 3), 1).state, 5);
    expect(getPlayer(s, "p1").points).toBe(500);
    expect(s.ownership[1]).toEqual({ owner: "p2", level: 2 });
  });

  it("5 correct on a level 1 square frees it", () => {
    const s = resolveVisit(moveCurrent(own(game(), 1, "p2", 1), 1).state, 5);
    expect(s.ownership[1]).toBeUndefined();
  });

  it("paying exactly all your points does not eliminate you", () => {
    const g = setPoints(own(game(), 1, "p2", 1), "p1", 100);
    const s = resolveVisit(moveCurrent(g, 1).state, 0);
    expect(getPlayer(s, "p1")).toMatchObject({ points: 0, eliminated: false });
  });
});

describe("elimination", () => {
  it("charges only what the player can pay, forgives the rest and eliminates them", () => {
    const g = setPoints(own(game(["Ana", "Ben", "Cy"]), 1, "p2", 1), "p1", 60);
    const s = resolveVisit(moveCurrent(g, 1).state, 0);
    expect(getPlayer(s, "p1")).toMatchObject({ points: 0, eliminated: true });
    expect(getPlayer(s, "p2").points).toBe(560);
    expect(s.winner).toBeNull();
    expect(activePlayers(s)).toHaveLength(2);
  });

  it("frees every square of an eliminated player", () => {
    let g = own(own(own(game(["Ana", "Ben", "Cy"]), 1, "p2", 1), 2, "p1", 3), 11, "p1", 2);
    g = setPoints(g, "p1", 10);
    g = place(g, "p1", 0);
    const s = resolveVisit(moveCurrent(g, 1).state, 0);
    expect(getPlayer(s, "p1").eliminated).toBe(true);
    expect(Object.keys(s.ownership)).toEqual(["1"]);
    expect(s.ownership[1]?.owner).toBe("p2");
  });

  it("the last player standing wins", () => {
    const g = setPoints(own(game(), 1, "p2", 1), "p1", 10);
    const s = resolveVisit(moveCurrent(g, 1).state, 0);
    expect(s.winner).toBe("p2");
    expect(s.ended).toBe("bankruptcy");
    expect(() => moveCurrent(s, 1)).toThrow("over");
  });

  it("charge() reports how much was actually paid", () => {
    const g = game();
    expect(charge(g, "p1", 200).paid).toBe(200);
    expect(charge(g, "p1", 900).paid).toBe(500);
  });
});

describe("endTurn", () => {
  it("passes the turn around and counts turns", () => {
    let s = game(["Ana", "Ben", "Cy"]);
    s = endTurn(s);
    expect(currentPlayer(s).name).toBe("Ben");
    s = endTurn(endTurn(s));
    expect(currentPlayer(s).name).toBe("Ana");
    expect(s.turns).toBe(3);
  });

  it("skips eliminated players", () => {
    let s = game(["Ana", "Ben", "Cy"]);
    s = { ...s, players: s.players.map((p) => (p.id === "p2" ? { ...p, eliminated: true } : p)) };
    s = endTurn(s);
    expect(currentPlayer(s).name).toBe("Cy");
  });

  it("does nothing after the game is won", () => {
    const over: GameState = { ...game(), ended: "bankruptcy", winner: "p1" };
    expect(endTurn(over)).toBe(over);
  });
});

describe("whole seeded games keep the rules intact", () => {
  function play(seed: number, names: string[], maxTurns: number): GameState {
    const rng = seededRng(seed);
    let s = newGame(board, names);
    for (let t = 0; t < maxTurns && s.ended === null; t++) {
      const moved = moveCurrent(s, rollDie(rng));
      s = moved.state;
      const correct = Math.floor(rng() * 6); // 0 to 5, a mix of skill levels
      if (moved.landing.kind === "claimable") s = resolveClaim(s, correct);
      else if (moved.landing.kind === "own") s = resolveOwn(s, correct);
      else if (moved.landing.kind === "visit") s = resolveVisit(s, correct);

      for (const p of s.players) {
        expect(p.points).toBeGreaterThanOrEqual(0);
        if (p.eliminated) expect(p.points).toBe(0);
      }
      for (const o of Object.values(s.ownership)) {
        expect(o.level).toBeGreaterThanOrEqual(1);
        expect(o.level).toBeLessThanOrEqual(3);
        expect(getPlayer(s, o.owner).eliminated).toBe(false);
      }
      s = endTurn(s);
    }
    return s;
  }

  for (const seed of [1, 2, 3, 4, 5]) {
    it(`seed ${seed}: points never go negative, eliminated players own nothing, a finished game has one winner`, () => {
      const s = play(seed, ["Ana", "Ben", "Cy", "Di"], 3000);
      if (s.winner !== null) {
        expect(activePlayers(s)).toHaveLength(1);
        expect((activePlayers(s)[0] as { id: string }).id).toBe(s.winner);
      }
    });
  }
});

describe("rules presets", () => {
  it("the balanced preset lowers the lap bonus and the points earned, but not the rent reductions", () => {
    expect(BALANCED_RULES.lapBonus).toBe(50);
    expect(BALANCED_RULES.pointsTable).toEqual([0, 5, 10, 15, 30, 50]);
    expect(BALANCED_RULES.rentDiscount).toEqual([0, 10, 20, 30, 60, 100]);
  });

  it("a game uses the rules it was created with", () => {
    const s = newGame(board, ["Ana", "Ben"], { rules: BALANCED_RULES });
    const claimed = resolveClaim(moveCurrent(s, 1).state, 4);
    expect(getPlayer(claimed, "p1").points).toBe(500 + 30);
    const lap = moveCurrent(place(s, "p1", 38), 3).state;
    expect(getPlayer(lap, "p1").points).toBe(550);
  });

  it("withRules changes only what it is given", () => {
    const r = withRules({ startingPoints: 300 });
    expect(r.startingPoints).toBe(300);
    expect(r.lapBonus).toBe(100);
    expect(newGame(board, ["Ana", "Ben"], { rules: r }).players[0]?.points).toBe(300);
  });

  it("offers 40, 80 and 120 turns as presets", () => {
    expect([...TURN_LIMIT_PRESETS]).toEqual([40, 80, 120]);
  });
});

describe("turn limit", () => {
  /** Play empty turns (no test) until the game ends or we give up. */
  function playTurns(s: GameState, count: number): GameState {
    for (let i = 0; i < count && s.ended === null; i++) s = endTurn(s);
    return s;
  }

  it("must be a positive whole number", () => {
    expect(() => newGame(board, ["Ana", "Ben"], { turnLimit: 0 })).toThrow("turnLimit");
    expect(() => newGame(board, ["Ana", "Ben"], { turnLimit: 2.5 })).toThrow("turnLimit");
  });

  it("ends only after every player has used all their turns", () => {
    const g = newGame(board, ["Ana", "Ben"], { turnLimit: 3 });
    const almost = playTurns(g, 5); // 2 players x 3 turns = 6 turns in total
    expect(almost.ended).toBeNull();
    expect(playTurns(g, 6).ended).toBe("turnLimit");
    expect(playTurns(g, 6).turns).toBe(6);
  });

  it("the player with the most points wins", () => {
    const g = setPoints(newGame(board, ["Ana", "Ben"], { turnLimit: 1 }), "p2", 700);
    const end = playTurns(g, 2);
    expect(end.ended).toBe("turnLimit");
    expect(end.winner).toBe("p2");
    expect(standings(end).map((p) => p.name)).toEqual(["Ben", "Ana"]);
  });

  it("breaks a tie in points by the total level of owned squares", () => {
    let g = newGame(board, ["Ana", "Ben"], { turnLimit: 1 });
    g = own(own(g, 1, "p1", 1), 2, "p2", 3);
    expect(playTurns(g, 2).winner).toBe("p2");
  });

  it("an exact tie has no winner and lists who tied", () => {
    const end = playTurns(newGame(board, ["Ana", "Ben"], { turnLimit: 1 }), 2);
    expect(end.ended).toBe("turnLimit");
    expect(end.winner).toBeNull();
    expect(end.tied).toEqual(["p1", "p2"]);
  });

  it("no more moves are allowed after the limit", () => {
    const end = playTurns(newGame(board, ["Ana", "Ben"], { turnLimit: 1 }), 2);
    expect(() => moveCurrent(end, 1)).toThrow("over");
    expect(endTurn(end)).toBe(end);
  });

  it("an eliminated player does not hold the game open", () => {
    let g = newGame(board, ["Ana", "Ben", "Cy"], { turnLimit: 2 });
    g = { ...g, players: g.players.map((p) => (p.id === "p3" ? { ...p, eliminated: true, points: 0 } : p)) };
    expect(playTurns(g, 4).ended).toBe("turnLimit");
  });

  it("a bankruptcy before the limit ends the game as a bankruptcy", () => {
    const g = setPoints(own(newGame(board, ["Ana", "Ben"], { turnLimit: 40 }), 1, "p2", 1), "p1", 10);
    const s = resolveVisit(moveCurrent(g, 1).state, 0);
    expect(s.ended).toBe("bankruptcy");
    expect(s.winner).toBe("p2");
  });
});
