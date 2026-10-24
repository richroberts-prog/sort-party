// The level path. Hand-made; shelf boards come from scripts/gen-shelves.ts and tests prove each can be won.
import type { RoomItem } from './room';

export type ShelfLevel = { type: 'shelf'; time: number; shelves: string[][] };
export type DogLevel = { type: 'dogs'; time: number; line: string[] };
export type RoomLevel = { type: 'room'; time: number; homes: { id: string; x: number }[]; items: RoomItem[] };
export type Level = ShelfLevel | DogLevel | RoomLevel;

/** What each shelf letter looks like. */
export const GOODS: Record<string, string> = { A: '🍎', B: '🍌', C: '🍇', D: '🍓', E: '🍩', F: '🧁', G: '🥕', H: '🍪' };

/** Dog coats. A two-tone coat is "base/patch". */
export const COATS: Record<string, string> = {
  brown: '#8b5a2b', white: '#f7f3ec', black: '#2b2b2b', golden: '#e0a83a', grey: '#9a9a9a', spotty: '#f7f3ec/#8b5a2b',
};

/** Room homes: the picture on each, and the things that belong there. */
export const HOMES: Record<string, { label: string; icon: string; things: string[] }> = {
  toys: { label: 'Toy box', icon: '🧸', things: ['🧸', '⚽', '🪀', '🧩', '🚂'] },
  books: { label: 'Bookshelf', icon: '📚', things: ['📕', '📗', '📘'] },
  washing: { label: 'Washing basket', icon: '🧺', things: ['🧦', '👕', '👖'] },
  kitchen: { label: 'Kitchen', icon: '🍽️', things: ['🍽️', '🥄', '☕'] },
};

/** Room things laid out in a scatter: x is 0..1 across the whole room, y 0..1 down the floor. */
function scatter(homes: string[], each: number): RoomItem[] {
  const items: RoomItem[] = [];
  let id = 0;
  for (const home of homes)
    for (let i = 0; i < each; i++) {
      const n = id++;
      items.push({ id: n, home, kind: HOMES[home].things[i % HOMES[home].things.length], x: ((n * 0.618034) % 1) * 0.9 + 0.05, y: ((n * 0.381966 * 3) % 1) * 0.8 + 0.1 });
    }
  return items;
}

export const LEVELS: Level[] = [
  { type: 'shelf', time: 60, shelves: [['AB.'], ['BAA'], ['B..']] },
  { type: 'dogs', time: 60, line: ['brown', 'white', 'black', 'white', 'brown', 'brown', 'black', 'white', 'black'] },
  { type: 'shelf', time: 120, shelves: [['D.C', '..B'], ['BC.', 'BA.'], ['.A.', 'A..'], ['D..', 'DC.']] },
  {
    type: 'room', time: 150,
    homes: [{ id: 'toys', x: 0.08 }, { id: 'books', x: 0.36 }, { id: 'washing', x: 0.64 }, { id: 'kitchen', x: 0.92 }],
    items: scatter(['toys', 'books', 'washing', 'kitchen'], 4),
  },
  { type: 'shelf', time: 150, shelves: [['..E', '..B'], ['BAF', 'C.B'], ['.AD', '..E'], ['C.E', 'AF.'], ['FDC', '.D.']] },
  {
    type: 'dogs', time: 90,
    line: ['golden', 'brown', 'grey', 'white', 'golden', 'black', 'grey', 'brown', 'white', 'golden', 'black', 'grey', 'white', 'brown', 'black'],
  },
];
