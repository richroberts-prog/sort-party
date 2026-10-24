// Dogs and bowls, drawn as SVG so any coat colour works.
import { COATS } from '../game/levels';

const LINE = '#3b2a1e';

export function dogSvg(coat: string): string {
  const [base, patch] = COATS[coat].split('/');
  const spots = patch
    ? `<circle cx="48" cy="52" r="9" fill="${patch}"/><circle cx="68" cy="60" r="6" fill="${patch}"/><circle cx="26" cy="30" r="6" fill="${patch}"/>`
    : '';
  return `<svg viewBox="0 0 100 80" class="dog-svg" aria-hidden="true">
  <path d="M84 46 q12 -14 8 -24" stroke="${LINE}" stroke-width="7" stroke-linecap="round" fill="none"/>
  <path d="M84 46 q12 -14 8 -24" stroke="${base}" stroke-width="4" stroke-linecap="round" fill="none"/>
  <g stroke="${LINE}" stroke-width="2.5" fill="${base}">
    <rect x="34" y="58" width="9" height="18" rx="4"/><rect x="72" y="58" width="9" height="18" rx="4"/>
    <ellipse cx="60" cy="52" rx="28" ry="15"/>
    <circle cx="30" cy="34" r="17"/>
    <ellipse cx="16" cy="40" rx="8" ry="6"/>
  </g>
  ${spots}
  <path d="M22 20 q-10 6 -6 22 q8 -4 10 -16z" fill="${patch ?? base}" stroke="${LINE}" stroke-width="2.5" filter="brightness(0.8)"/>
  <circle cx="30" cy="30" r="3" fill="${LINE}"/><circle cx="31" cy="29" r="1" fill="#fff"/>
  <ellipse cx="10" cy="38" rx="4" ry="3" fill="${LINE}"/>
  <path d="M14 46 q6 4 12 0" stroke="${LINE}" stroke-width="2" fill="none"/>
</svg>`;
}

export function bowlSvg(coat: string, filled: number): string {
  const [base, patch] = COATS[coat].split('/');
  const paws = [0, 1, 2].map((i) => `<circle cx="${32 + i * 18}" cy="73" r="6" fill="${i < filled ? '#ff6f91' : '#fff'}" stroke="${LINE}" stroke-width="2"/>`).join('');
  return `<svg viewBox="0 0 100 80" class="bowl-svg" aria-hidden="true">
  <path d="M8 30 h84 q-4 30 -22 34 h-40 q-18 -4 -22 -34z" fill="${base}" stroke="${LINE}" stroke-width="3"/>
  ${patch ? `<path d="M50 30 h42 q-4 30 -22 34 h-20z" fill="${patch}"/>` : ''}
  <ellipse cx="50" cy="30" rx="42" ry="8" fill="#c98b4a" stroke="${LINE}" stroke-width="3"/>
  ${paws}
</svg>`;
}
