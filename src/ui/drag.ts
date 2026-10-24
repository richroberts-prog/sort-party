// One-finger drag for every level type. A copy follows the finger; on release the element under it
// with a data-drop attribute is the target. If the drop is refused, the copy slides back home.

type Opts = {
  /** Return true if the drop is taken. The caller redraws; the copy is removed either way. */
  drop: (target: HTMLElement | null) => boolean;
  /** Called every frame while dragging, with the finger position, so a finger held still at an edge keeps the room scrolling. */
  moving?: (x: number, y: number) => void;
};

export function draggable(el: HTMLElement, opts: Opts) {
  el.style.touchAction = 'none';
  el.addEventListener('pointerdown', (e) => {
    if (!e.isPrimary) return;
    e.preventDefault();
    const box = el.getBoundingClientRect();
    const dx = e.clientX - box.left, dy = e.clientY - box.top;
    const ghost = el.cloneNode(true) as HTMLElement;
    ghost.classList.add('ghost');
    Object.assign(ghost.style, { left: `${box.left}px`, top: `${box.top}px`, width: `${box.width}px`, height: `${box.height}px` });
    document.body.append(ghost);
    el.style.visibility = 'hidden';
    let fx = e.clientX, fy = e.clientY, frame = 0;
    const each = () => { opts.moving?.(fx, fy); frame = requestAnimationFrame(each); };
    if (opts.moving) frame = requestAnimationFrame(each);
    const move = (ev: PointerEvent) => {
      fx = ev.clientX; fy = ev.clientY;
      ghost.style.left = `${fx - dx}px`;
      ghost.style.top = `${fy - dy}px`;
    };
    const up = (ev: PointerEvent) => {
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      ghost.style.display = 'none';
      const under = ev.type === 'pointerup' ? document.elementFromPoint(ev.clientX, ev.clientY) : null;
      const target = under?.closest<HTMLElement>('[data-drop]') ?? null;
      if (opts.drop(target)) {
        ghost.remove();
        el.style.visibility = '';
        return;
      }
      const back = el.getBoundingClientRect();
      ghost.style.display = '';
      ghost.classList.add('going-back');
      requestAnimationFrame(() => Object.assign(ghost.style, { left: `${back.left}px`, top: `${back.top}px` }));
      setTimeout(() => { ghost.remove(); el.style.visibility = ''; }, 260);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  });
}
