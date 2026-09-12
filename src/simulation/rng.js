// Deterministic seeded PRNG (mulberry32) — guarantees reproducible scenarios from a seed.

export function createRng(seed) {
  let s = hashSeed(seed);

  function next() {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  next.int = (min, max) => Math.floor(next() * (max - min + 1)) + min;
  next.float = (min, max) => next() * (max - min) + min;
  next.pick = (arr) => arr[Math.floor(next() * arr.length)];

  return next;
}

function hashSeed(seed) {
  if (typeof seed === 'number') return seed;
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return (h ^ (h >>> 16)) >>> 0;
}
