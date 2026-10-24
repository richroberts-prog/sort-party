import { describe, expect, it } from 'vitest';
import { dogsWon, dropDog, startDogs } from '../src/game/dogs';
import { COATS, GOODS, HOMES, LEVELS } from '../src/game/levels';
import { record, Save, stars, unlocked } from '../src/game/progress';
import { putAway, roomWon, startRoom } from '../src/game/room';
import { isStuck, isWon, move, parseShelves, solvable, solve } from '../src/game/shelf';

describe('shelves', () => {
  it('clears three of a kind in the front row and brings the row behind forward', () => {
    const s = parseShelves([['AA.', 'BB.'], ['A..']]);
    expect(move(s, 1, 0, 0, 2)).toEqual({ ok: true, cleared: true });
    expect(s[0]).toEqual([['B', 'B', null]]);
    expect(s[1]).toEqual([[null, null, null]]);
  });
  it('refuses a move onto a full slot or from an empty one', () => {
    const s = parseShelves([['AB.'], ['C..']]);
    expect(move(s, 1, 0, 0, 0).ok).toBe(false);
    expect(move(s, 1, 1, 0, 2).ok).toBe(false);
  });
  it('only the front row can be touched', () => {
    const s = parseShelves([['A..', 'B..'], ['...']]);
    expect(s[0][1][0]).toBe('B');
    expect(move(s, 0, 0, 1, 0).ok).toBe(true);
    expect(s[0]).toEqual([['B', null, null]]);
  });
  it('knows when it is won and when it is stuck', () => {
    expect(isWon(parseShelves([['...'], ['...']]))).toBe(true);
    expect(isStuck(parseShelves([['ABA'], ['BAB']]))).toBe(true);
    expect(isStuck(parseShelves([['AB.'], ['BAB']]))).toBe(false);
  });
});

describe('dogs', () => {
  it('takes the front dog only in its own bowl, and swaps a full bowl', () => {
    const d = startDogs(['brown', 'brown', 'brown', 'white']);
    expect(dropDog(d, 'white')).toBe('wrong');
    expect(dropDog(d, 'brown')).toBe('placed');
    expect(dropDog(d, 'brown')).toBe('placed');
    expect(dropDog(d, 'brown')).toBe('full');
    expect(d.bowls.brown).toBe(0);
    expect(dogsWon(d)).toBe(false);
    dropDog(d, 'white');
    expect(dogsWon(d)).toBe(true);
  });
});

describe('room', () => {
  it('puts a thing away only in its home', () => {
    const r = startRoom([{ id: 1, kind: '🧸', home: 'toys', x: 0, y: 0 }]);
    expect(putAway(r, 1, 'books')).toBe(false);
    expect(putAway(r, 1, 'toys')).toBe(true);
    expect(roomWon(r)).toBe(true);
  });
});

describe('levels', () => {
  it('mixes all three types', () => {
    expect(new Set(LEVELS.map((l) => l.type))).toEqual(new Set(['shelf', 'dogs', 'room']));
  });
  LEVELS.forEach((l, i) => {
    it(`level ${i + 1} (${l.type}) can be won`, () => {
      if (l.type === 'shelf') {
        const counts: Record<string, number> = {};
        for (const c of l.shelves.flat().join('').replace(/\./g, '')) counts[c] = (counts[c] ?? 0) + 1;
        for (const [c, n] of Object.entries(counts)) {
          expect(GOODS[c]).toBeDefined();
          expect(n % 3, `${c} comes in threes`).toBe(0);
        }
        expect(solvable(parseShelves(l.shelves))).toBe(true);
      }
      if (l.type === 'dogs') {
        for (const c of l.line) expect(COATS[c]).toBeDefined();
        const d = startDogs(l.line);
        while (d.line.length) expect(dropDog(d, d.line[0])).not.toBe('wrong');
        expect(dogsWon(d)).toBe(true);
      }
      if (l.type === 'room') {
        const homes = new Set(l.homes.map((h) => h.id));
        for (const it of l.items) {
          expect(homes.has(it.home)).toBe(true);
          expect(HOMES[it.home].things).toContain(it.kind);
        }
        expect(new Set(l.items.map((it) => it.id)).size).toBe(l.items.length);
      }
    });
  });
});

describe('progress', () => {
  it('gives stars by time left', () => {
    expect(stars(30, 60)).toBe(3);
    expect(stars(20, 60)).toBe(2);
    expect(stars(1, 60)).toBe(1);
  });
  it('unlocks the next level on any finish and keeps the best score', () => {
    expect(unlocked({}, 0)).toBe(true);
    expect(unlocked({}, 1)).toBe(false);
    const best = record(record({}, 0, 3), 0, 1);
    expect(best[0]).toBe(3);
    expect(unlocked(best, 1)).toBe(true);
  });
  it('saves per player and survives a reload', () => {
    const mem = new Map<string, string>();
    const store = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v) };
    const a = new Save(store);
    a.finish('dog', 0, 2);
    a.muted = true;
    const b = new Save(store);
    expect(b.stars('dog')).toEqual({ 0: 2 });
    expect(b.stars('cat')).toEqual({});
    expect(b.muted).toBe(true);
  });
  it('keeps working when storage throws', () => {
    const bad = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } };
    const s = new Save(bad);
    s.finish('dog', 0, 3);
    expect(s.stars('dog')).toEqual({ 0: 3 });
  });
});

describe('shelf solver', () => {
  it('finds moves that really win, and says no when there are none', () => {
    const board = parseShelves(LEVELS[2].type === 'shelf' ? LEVELS[2].shelves : []);
    const path = solve(board)!;
    for (const m of path) expect(move(board, ...m).ok).toBe(true);
    expect(isWon(board)).toBe(true);
    expect(solve(parseShelves([['ABA'], ['BAB']]))).toBeNull();
  });
});
