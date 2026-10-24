// Shelf levels, Sortime rules: 3 slots per shelf, three of a kind in the front row clear,
// and when a front row is empty the row behind moves up. Won when every shelf is empty.

export const SLOTS = 3;

/** An item is a short code (one letter); null is an empty slot. */
export type Slot = string | null;
/** A shelf is a stack of rows, front row first. */
export type Shelf = Slot[][];

/** Parse level data: each shelf is a list of rows like "AB.", front row first; "." is empty. */
export function parseShelves(data: string[][]): Shelf[] {
  const shelves = data.map((rows) => rows.map((r) => [...r].map((c) => (c === '.' ? null : c))));
  shelves.forEach(settle);
  return shelves;
}

export function cloneShelves(shelves: Shelf[]): Shelf[] {
  return shelves.map((rows) => rows.map((r) => [...r]));
}

/** Bring rows forward while a shelf's front row is empty. */
function settle(shelf: Shelf) {
  while (shelf.length > 1 && shelf[0].every((s) => s === null)) shelf.shift();
}

export type MoveResult = { ok: false } | { ok: true; cleared: boolean };

/** Move the item at shelf `from` slot `fi` to empty slot `ti` of shelf `to`. Mutates `shelves`. */
export function move(shelves: Shelf[], from: number, fi: number, to: number, ti: number): MoveResult {
  const item = shelves[from]?.[0]?.[fi];
  if (!item || shelves[to]?.[0]?.[ti] !== null) return { ok: false };
  shelves[from][0][fi] = null;
  shelves[to][0][ti] = item;
  const front = shelves[to][0];
  const cleared = front.every((s) => s === item);
  if (cleared) front.fill(null);
  settle(shelves[from]);
  settle(shelves[to]);
  return { ok: true, cleared };
}

export function isWon(shelves: Shelf[]): boolean {
  return shelves.every((rows) => rows.every((r) => r.every((s) => s === null)));
}

/** Stuck: no empty front slot anywhere, so nothing can move. */
export function isStuck(shelves: Shelf[]): boolean {
  return !isWon(shelves) && shelves.every((rows) => rows[0].every((s) => s !== null));
}

/** Order within a row and the order of shelves never change the outcome, so the key ignores both. */
function key(shelves: Shelf[]): string {
  return shelves.map((rows) => rows.map((r) => r.map((s) => s ?? '.').sort().join('')).join('|')).sort().join('/');
}

export type Move = [from: number, fromSlot: number, to: number, toSlot: number];

/** A way to win this board, or null if there is none (or the search passes `limit` boards).
 *  Depth-first, trying moves that clear a row first, so the answer works but isn't the shortest. */
export function solve(start: Shelf[], limit = 500_000): Move[] | null {
  const seen = new Set<string>();
  const stack: { s: Shelf[]; path: Move[] }[] = [{ s: cloneShelves(start), path: [] }];
  while (stack.length) {
    const { s, path } = stack.pop()!;
    if (isWon(s)) return path;
    const kids: { s: Shelf[]; path: Move[]; cleared: boolean }[] = [];
    for (let f = 0; f < s.length; f++)
      for (const kind of new Set(s[f][0].filter((x) => x !== null))) {
        for (let t = 0; t < s.length; t++) {
          const ti = s[t][0].indexOf(null);
          if (ti < 0 || t === f) continue;
          const c = cloneShelves(s);
          const m: Move = [f, s[f][0].indexOf(kind), t, ti];
          const r = move(c, ...m);
          const k = key(c);
          if (seen.has(k)) continue;
          seen.add(k);
          if (seen.size > limit) return null;
          kids.push({ s: c, path: [...path, m], cleared: r.ok && r.cleared });
        }
      }
    kids.sort((a, b) => Number(a.cleared) - Number(b.cleared)); // clearing moves end up on top of the stack
    for (const { s, path } of kids) stack.push({ s, path });
  }
  return null;
}

export const solvable = (start: Shelf[]) => solve(start) !== null;
