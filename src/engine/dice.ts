/** A random number source returning a number in [0, 1), like Math.random. */
export type Rng = () => number;

/** Roll one six-sided die (1 to 6). Pass a seeded Rng to make tests repeatable. */
export function rollDie(rng: Rng = Math.random): number {
  return Math.floor(rng() * 6) + 1;
}

/** Small seeded random generator (mulberry32), so games and tests can be replayed. */
export function seededRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
