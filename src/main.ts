// Screens: pick a player, the level map, and a level with its timer and end-of-level card.
import './style.css';
import { LEVELS } from './game/levels';
import { Save, stars, unlocked } from './game/progress';
import { beadLevel, dogLevel, roomLevel, shelfLevel } from './ui/levels';
import { setMuted, sfx } from './ui/sound';

const PLAYERS = ['🐶', '🐱', '🦄', '🐰', '⭐'];
const TYPE_ICON = { shelf: '🍎', dogs: '🐕', room: '🏠', beads: '🔴' };

const app = document.getElementById('app')!;
const save = new Save((() => { try { return window.localStorage; } catch { return null; } })());
setMuted(save.muted);
let player = '';
let stopTimer = () => {};

const starRow = (n: number) => `<span class="stars" aria-label="${n} stars">${[1, 2, 3].map((i) => `<i class="${i <= n ? 'on' : ''}">★</i>`).join('')}</span>`;

function muteButton(): string {
  return `<button class="icon mute" aria-label="${save.muted ? 'Sound on' : 'Sound off'}">${save.muted ? '🔇' : '🔊'}</button>`;
}
function wireMute() {
  app.querySelector('.mute')?.addEventListener('click', (e) => {
    save.muted = !save.muted;
    setMuted(save.muted);
    const b = e.currentTarget as HTMLElement;
    b.textContent = save.muted ? '🔇' : '🔊';
    b.setAttribute('aria-label', save.muted ? 'Sound on' : 'Sound off');
  });
}

function startScreen() {
  stopTimer();
  app.innerHTML = `
    <div class="start">
      <h1>Sort <span>Party</span></h1>
      <p class="who">Who's playing?</p>
      <div class="players">${PLAYERS.map((p) => {
        const total = Object.values(save.stars(p)).reduce((a, b) => a + b, 0);
        return `<button class="player" data-p="${p}" aria-label="Play as ${p}">${p}${total ? `<small>★ ${total}</small>` : ''}</button>`;
      }).join('')}</div>
    </div>`;
  app.querySelectorAll<HTMLElement>('.player').forEach((b) => b.addEventListener('click', () => { player = b.dataset.p!; sfx.pop(); mapScreen(); }));
}

function mapScreen() {
  stopTimer();
  const best = save.stars(player);
  app.innerHTML = `
    <div class="map">
      <header><button class="icon" data-go="players" aria-label="Change player">${player}</button><h2>Sort <span>Party</span></h2>${muteButton()}</header>
      <div class="path">${LEVELS.map((l, i) => {
        const open = unlocked(best, i);
        return `<button class="lvl ${l.type}${open ? '' : ' locked'}" data-i="${i}" aria-label="Level ${i + 1}" ${open ? '' : 'disabled'}>
          <span class="num">${i + 1}</span><span class="kind">${open ? TYPE_ICON[l.type] : '🔒'}</span>${starRow(best[i] ?? 0)}</button>`;
      }).join('')}</div>
    </div>`;
  wireMute();
  app.querySelector('[data-go="players"]')!.addEventListener('click', startScreen);
  app.querySelectorAll<HTMLButtonElement>('.lvl:not(.locked)').forEach((b) => b.addEventListener('click', () => play(Number(b.dataset.i))));
}

function play(index: number) {
  stopTimer();
  const level = LEVELS[index];
  app.innerHTML = `
    <div class="play ${level.type}">
      <header>
        <button class="icon" data-go="map" aria-label="Back to map">🗺️</button>
        <div class="timer" role="timer"><div class="bar"></div><span class="secs"></span></div>
        ${muteButton()}
      </header>
      <main class="board"></main>
    </div>`;
  wireMute();
  app.querySelector('[data-go="map"]')!.addEventListener('click', mapScreen);
  const bar = app.querySelector<HTMLElement>('.timer .bar')!;
  const secs = app.querySelector<HTMLElement>('.timer .secs')!;
  const board = app.querySelector<HTMLElement>('.board')!;

  // The clock only runs while the page is showing, so switching apps doesn't eat a child's time.
  let left = level.time;
  let last = performance.now();
  let running = true;
  let frame = 0;
  const tick = (now: number) => {
    if (!running) return;
    if (!document.hidden) left -= Math.min(0.25, (now - last) / 1000);
    last = now;
    const k = Math.max(0, left / level.time);
    bar.style.width = `${k * 100}%`;
    bar.classList.toggle('low', k < 0.25);
    secs.textContent = String(Math.ceil(Math.max(0, left)));
    if (left <= 0) { finish(false, 'time'); return; }
    frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);
  stopTimer = () => { running = false; cancelAnimationFrame(frame); };

  const finish = (won: boolean, why: 'time' | 'stuck' | 'won') => {
    if (!running) return;
    stopTimer();
    const got = won ? stars(left, level.time) : 0;
    if (won) { save.finish(player, index, got); setTimeout(sfx.cheer, 200); } else sfx.buzzer();
    const next = index + 1 < LEVELS.length;
    const card = document.createElement('div');
    card.className = 'card-back';
    card.innerHTML = `<div class="card ${won ? 'won' : 'lost'}" role="dialog" aria-label="${won ? 'Level done' : 'Try again'}">
      <div class="big">${won ? '🎉' : why === 'time' ? '⏰' : '🤔'}</div>
      ${won ? starRow(got) : `<p>${why === 'time' ? 'Out of time!' : 'No room to move!'}</p>`}
      <div class="buttons">
        <button class="icon" data-go="map" aria-label="Back to map">🗺️</button>
        <button class="icon" data-go="again" aria-label="Play again">↻</button>
        ${won && next ? '<button class="icon go" data-go="next" aria-label="Next level">▶</button>' : ''}
      </div></div>`;
    app.querySelector('.play')!.append(card);
    card.querySelector('[data-go="map"]')!.addEventListener('click', mapScreen);
    card.querySelector('[data-go="again"]')!.addEventListener('click', () => play(index));
    card.querySelector('[data-go="next"]')?.addEventListener('click', () => play(index + 1));
  };
  const end = (won: boolean) => finish(won, won ? 'won' : 'stuck');

  if (level.type === 'shelf') shelfLevel(board, level, end);
  else if (level.type === 'dogs') dogLevel(board, level, end);
  else if (level.type === 'room') roomLevel(board, level, end);
  else beadLevel(board, level, end);
}

startScreen();
