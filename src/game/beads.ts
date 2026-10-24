// Bead levels: a big pile of coloured beads; each bead goes in the bowl of its colour.
// Bowls fill up as beads go in and the pile goes down. Won when the pile is gone.

export type Bead = { id: number; colour: string; x: number; y: number };
export type BeadState = { pile: Bead[]; bowls: Record<string, { in: number; of: number }> };

/** A heap: beads spread round a centre, thicker in the middle, the lower ones drawn in front. */
export function startBeads(counts: Record<string, number>): BeadState {
  const bowls: BeadState['bowls'] = {};
  const colours: string[] = [];
  for (const [c, n] of Object.entries(counts)) {
    bowls[c] = { in: 0, of: n };
    for (let i = 0; i < n; i++) colours.push(c);
  }
  // Shuffle the colours with a fixed hash so every play of a level looks the same.
  const hash = (i: number) => ((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1;
  const order = colours.map((c, i) => ({ c, k: hash(i + 1) })).sort((a, b) => a.k - b.k).map((o) => o.c);
  // Spread evenly over a disc (sunflower), then press the disc into a dome with a flat base: a heap.
  const n = order.length;
  const pile = order.map((colour, i) => {
    const r = Math.sqrt((i + 0.5) / n), a = i * 2.39996;
    const u = r * Math.cos(a), v = (r * Math.sin(a) + 1) / 2;
    return { id: i, colour, x: 0.5 + u * 0.34, y: 0.92 - v * 0.8 * (1 - u * u) };
  });
  pile.sort((p, q) => p.y - q.y);
  return { pile, bowls };
}

/** Put bead `id` in bowl `colour`. Mutates `state`. False if it's the wrong colour. */
export function dropBead(state: BeadState, id: number, colour: string): boolean {
  const i = state.pile.findIndex((b) => b.id === id);
  if (i < 0 || state.pile[i].colour !== colour) return false;
  state.pile.splice(i, 1);
  state.bowls[colour].in++;
  return true;
}

export const beadsWon = (state: BeadState) => state.pile.length === 0;
