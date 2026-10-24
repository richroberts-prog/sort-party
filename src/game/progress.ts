// Stars, unlocks and saving. Progress lives in this device's browser, one record per player picture.

/** 3 stars with half the time left, 2 with a quarter, else 1. */
export function stars(timeLeft: number, timeLimit: number): 1 | 2 | 3 {
  const k = timeLeft / timeLimit;
  return k >= 0.5 ? 3 : k >= 0.25 ? 2 : 1;
}

/** Best stars per level index for one player. */
export type Stars = Record<number, number>;

export const unlocked = (best: Stars, level: number) => level === 0 || (best[level - 1] ?? 0) > 0;

/** Keep the better score. Returns the new record. */
export const record = (best: Stars, level: number, got: number): Stars => ({ ...best, [level]: Math.max(best[level] ?? 0, got) });

type Store = Pick<Storage, 'getItem' | 'setItem'>;
const KEY = 'sort-party';
type Saved = { players: Record<string, Stars>; muted?: boolean };

/** Reads and writes never throw: a private window or blocked storage just means nothing is kept. */
export class Save {
  private data: Saved = { players: {} };
  constructor(private store: Store | null) {
    try {
      const raw = store?.getItem(KEY);
      if (raw) this.data = { players: {}, ...JSON.parse(raw) };
    } catch { /* start fresh */ }
  }
  private write() {
    try { this.store?.setItem(KEY, JSON.stringify(this.data)); } catch { /* not kept */ }
  }
  stars(player: string): Stars { return this.data.players[player] ?? {}; }
  finish(player: string, level: number, got: number) {
    this.data.players[player] = record(this.stars(player), level, got);
    this.write();
  }
  get muted() { return !!this.data.muted; }
  set muted(m: boolean) { this.data.muted = m; this.write(); }
}
