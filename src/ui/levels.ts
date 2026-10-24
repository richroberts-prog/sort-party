// The three kinds of level, each drawn into the play board. `end` reports a win, or that the board is stuck.
import { dogsWon, dropDog, startDogs } from '../game/dogs';
import { GOODS, HOMES, type DogLevel, type RoomLevel, type ShelfLevel } from '../game/levels';
import { putAway, roomWon, startRoom } from '../game/room';
import { isStuck, isWon, move, parseShelves } from '../game/shelf';
import { bowlSvg, dogSvg } from './art';
import { draggable } from './drag';
import { sfx } from './sound';

type End = (won: boolean) => void;

/** Read "kind:a:b" from a drop target, or null if it's a different kind of target. */
function dropAt(target: HTMLElement | null, kind: string): string[] | null {
  const parts = target?.dataset.drop?.split(':');
  return parts && parts[0] === kind ? parts.slice(1) : null;
}

export function shelfLevel(board: HTMLElement, level: ShelfLevel, end: End) {
  const shelves = parseShelves(level.shelves);
  let flash = -1;
  const draw = () => {
    board.innerHTML = `<div class="shelves">${shelves.map((rows, f) => `
      <div class="shelf${f === flash ? ' flash' : ''}" data-shelf="${f}">
        <div class="slots">${rows[0].map((item, i) => `
          <div class="slot" data-drop="slot:${f}:${i}">
            ${rows[1]?.[i] ? `<span class="back">${GOODS[rows[1][i]!]}</span>` : ''}
            ${item ? `<span class="item" data-kind="${item}">${GOODS[item]}</span>` : ''}
          </div>`).join('')}
        </div>
        <div class="plank">${rows.length > 1 ? '<i></i>'.repeat(rows.length - 1) : ''}</div>
      </div>`).join('')}</div>`;
    flash = -1;
    board.querySelectorAll<HTMLElement>('.item').forEach((el) => {
      const [f, fi] = el.parentElement!.dataset.drop!.split(':').slice(1).map(Number);
      draggable(el, {
        drop: (target) => {
          const at = dropAt(target, 'slot');
          const r = at ? move(shelves, f, fi, Number(at[0]), Number(at[1])) : { ok: false as const };
          if (!r.ok) { if (at) sfx.nope(); return false; }
          if (r.cleared) { sfx.sparkle(); flash = Number(at![0]); } else sfx.pop();
          draw();
          if (isWon(shelves)) end(true);
          else if (isStuck(shelves)) end(false);
          return true;
        },
      });
    });
  };
  draw();
}

export function dogLevel(board: HTMLElement, level: DogLevel, end: End) {
  const state = startDogs(level.line);
  const colours = Object.keys(state.bowls);
  let happy = '';
  const draw = () => {
    board.innerHTML = `
      <div class="bowls">${colours.map((c) => `
        <div class="bowl${c === happy ? ' happy' : ''}" data-drop="bowl:${c}" data-coat="${c}">${bowlSvg(c, c === happy ? 3 : state.bowls[c])}</div>`).join('')}
      </div>
      <div class="line">${state.line.slice(0, 6).map((c, i) => `
        <div class="dog${i === 0 ? ' front' : ''}" data-coat="${c}">${dogSvg(c)}</div>`).join('')}
        ${state.line.length > 6 ? `<div class="more">+${state.line.length - 6}</div>` : ''}
      </div>`;
    const front = board.querySelector<HTMLElement>('.dog.front');
    if (!front) return;
    draggable(front, {
      drop: (target) => {
        const at = dropAt(target, 'bowl');
        if (!at) return false;
        const r = dropDog(state, at[0]);
        if (r === 'wrong') { sfx.nope(); return false; }
        sfx.woof();
        if (r === 'full') {
          happy = at[0];
          setTimeout(() => sfx.sparkle(), 250);
          setTimeout(() => { if (happy === at[0]) { happy = ''; draw(); } }, 700);
        }
        draw();
        if (dogsWon(state)) end(true);
        return true;
      },
    });
  };
  draw();
}

export function roomLevel(board: HTMLElement, level: RoomLevel, end: End) {
  const state = startRoom(level.items);
  board.innerHTML = `
    <div class="room-scroll"><div class="room-space">
      <div class="wall">${level.homes.map((h) => `
        <div class="home" data-drop="home:${h.id}" style="left:${h.x * 100}%">
          <div class="home-icon">${HOMES[h.id].icon}</div><div class="home-label">${HOMES[h.id].label}</div>
        </div>`).join('')}
      </div>
      <div class="floor"></div>
    </div></div>
    <button class="pan left" aria-label="Look left">◀</button>
    <button class="pan right" aria-label="Look right">▶</button>
    <div class="left-count" aria-label="Things left"><span>🧹</span><b></b></div>`;
  const scroller = board.querySelector<HTMLElement>('.room-scroll')!;
  const floor = board.querySelector<HTMLElement>('.floor')!;
  const count = board.querySelector<HTMLElement>('.left-count b')!;
  board.querySelector('.pan.left')!.addEventListener('click', () => scroller.scrollBy({ left: -scroller.clientWidth * 0.6, behavior: 'smooth' }));
  board.querySelector('.pan.right')!.addEventListener('click', () => scroller.scrollBy({ left: scroller.clientWidth * 0.6, behavior: 'smooth' }));
  const draw = () => {
    floor.innerHTML = state.floor.map((it) => `
      <span class="thing" data-id="${it.id}" data-home="${it.home}" style="left:${it.x * 100}%;top:${it.y * 100}%">${it.kind}</span>`).join('');
    count.textContent = String(state.floor.length);
    floor.querySelectorAll<HTMLElement>('.thing').forEach((el) => draggable(el, {
      moving: (x) => {
        const box = scroller.getBoundingClientRect();
        if (x < box.left + 70) scroller.scrollLeft -= 14;
        else if (x > box.right - 70) scroller.scrollLeft += 14;
      },
      drop: (target) => {
        const at = dropAt(target, 'home');
        if (!at) return false;
        if (!putAway(state, Number(el.dataset.id), at[0])) { sfx.nope(); return false; }
        sfx.pop();
        target!.classList.remove('gulp');
        void target!.offsetWidth;
        target!.classList.add('gulp');
        draw();
        if (roomWon(state)) end(true);
        return true;
      },
    }));
  };
  draw();
}
