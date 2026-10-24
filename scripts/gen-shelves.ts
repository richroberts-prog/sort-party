// Find a random shelf level that can be won, for pasting into levels.ts.
//   npx tsx scripts/gen-shelves.ts <shelves> <rows> <types> <seed> 
import { parseShelves, solvable } from '../src/game/shelf';

const [shelves, rows, types, seed0] = process.argv.slice(2).map(Number);
let seed = seed0;
const rand = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
for (let tries = 0; tries < 500; tries++) {
  const items = [...'ABCDEFGH'.slice(0, types)].flatMap((c) => [c, c, c]);
  const slots = Array.from({ length: shelves * rows * 3 }, (_, i) => (i < items.length ? items[i] : '.'));
  for (let i = slots.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [slots[i], slots[j]] = [slots[j], slots[i]]; }
  const data = Array.from({ length: shelves }, (_, s) => Array.from({ length: rows }, (_, r) => slots.slice((s * rows + r) * 3, (s * rows + r) * 3 + 3).join('')).filter((r, i) => i === 0 || r !== '...'));
  if (data.some((d) => /^(.)\1\1$/.test(d[0]) && d[0] !== '...')) continue;
  if (data.every((d) => !d[0].includes('.'))) continue;
  if (solvable(parseShelves(data))) { console.log(JSON.stringify(data)); process.exit(0); }
}
console.log('none found');
