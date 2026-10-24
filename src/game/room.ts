// Room levels: a big room with things on the floor; each goes to its home. Won when the floor is clear.

export type RoomItem = { id: number; kind: string; home: string; x: number; y: number };

export type RoomState = { floor: RoomItem[] };

export const startRoom = (items: RoomItem[]): RoomState => ({ floor: items.map((i) => ({ ...i })) });

/** Put item `id` in `home`. Mutates `state`. False if it doesn't belong there. */
export function putAway(state: RoomState, id: number, home: string): boolean {
  const i = state.floor.findIndex((it) => it.id === id);
  if (i < 0 || state.floor[i].home !== home) return false;
  state.floor.splice(i, 1);
  return true;
}

export const roomWon = (state: RoomState) => state.floor.length === 0;
