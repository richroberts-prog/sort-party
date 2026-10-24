// Dog levels: dogs wait in a line; the front dog goes in the bowl of its colour.
// A bowl holds 3; a full bowl is swapped for an empty one. Won when the line is empty.

export const BOWL_SIZE = 3;

export type DogState = { line: string[]; bowls: Record<string, number> };

export function startDogs(line: string[]): DogState {
  const bowls: Record<string, number> = {};
  for (const c of line) bowls[c] = 0;
  return { line: [...line], bowls };
}

export type DropResult = 'wrong' | 'placed' | 'full';

/** Drop the front dog in bowl `colour`. Mutates `state`. 'full' means that bowl just filled and was swapped. */
export function dropDog(state: DogState, colour: string): DropResult {
  if (state.line[0] !== colour) return 'wrong';
  state.line.shift();
  state.bowls[colour]++;
  if (state.bowls[colour] < BOWL_SIZE) return 'placed';
  state.bowls[colour] = 0;
  return 'full';
}

export const dogsWon = (state: DogState) => state.line.length === 0;
