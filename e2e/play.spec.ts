import { CDPSession, expect, Locator, Page, test } from '@playwright/test';
import { LEVELS } from '../src/game/levels';
import { parseShelves, solve } from '../src/game/shelf';

const SHOTS = process.env.SHOTS;
type Pt = { x: number; y: number };

async function centre(l: Locator): Promise<Pt> {
  const b = (await l.boundingBox())!;
  return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
}

/** One finger: down at `from`, slide to `to`, optionally hold still `until` something is true; returns lift(at). */
async function finger(cdp: CDPSession, from: Pt, to: Pt, opts: { steps?: number; until?: () => Promise<boolean> } = {}) {
  const steps = opts.steps ?? 8;
  const pt = (k: number) => [{ x: from.x + ((to.x - from.x) * k) / steps, y: from.y + ((to.y - from.y) * k) / steps, id: 0 }];
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pt(0) });
  for (let k = 1; k <= steps; k++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pt(k) });
  // Hold still (as a child would) until the condition holds.
  if (opts.until) for (let i = 0; i < 300 && !(await opts.until()); i++) await new Promise((r) => setTimeout(r, 30));
  return async (end: Pt) => {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ ...end, id: 0 }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  };
}

async function drag(cdp: CDPSession, from: Locator, to: Locator) {
  const lift = await finger(cdp, await centre(from), await centre(to));
  await lift(await centre(to));
}

async function shot(page: Page, name: string) {
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/${test.info().project.name}-${name}.png` });
}

async function playShelf(page: Page, cdp: CDPSession, i: number) {
  const l = LEVELS[i];
  if (l.type !== 'shelf') throw new Error('not a shelf level');
  for (const [f, fi, t, ti] of solve(parseShelves(l.shelves))!) {
    await drag(cdp, page.locator(`[data-drop="slot:${f}:${fi}"] .item`), page.locator(`[data-drop="slot:${t}:${ti}"]`));
  }
}

async function playDogs(page: Page, cdp: CDPSession, i: number) {
  const l = LEVELS[i];
  if (l.type !== 'dogs') throw new Error('not a dog level');
  for (let n = 0; n < l.line.length; n++) {
    const coat = (await page.locator('.dog.front').getAttribute('data-coat'))!;
    await drag(cdp, page.locator('.dog.front'), page.locator(`.bowl[data-coat="${coat}"]`));
    await page.waitForTimeout(30);
  }
}

async function playRoom(page: Page, cdp: CDPSession) {
  const scroller = page.locator('.room-scroll');
  const view = (await scroller.boundingBox())!;
  while (await page.locator('.thing').count()) {
    const thing = page.locator('.thing').first();
    const home = page.locator(`.home[data-drop="home:${await thing.getAttribute('data-home')}"]`);
    await thing.scrollIntoViewIfNeeded();
    // Carry it to the screen edge nearest its home; the room scrolls until the home is in view, then drop on it.
    const goRight = (await home.boundingBox())!.x > (await thing.boundingBox())!.x;
    const inView = async () => { const b = (await home.boundingBox())!; return b.x > view.x + 40 && b.x + b.width < view.x + view.width - 40; };
    const edge = { x: goRight ? view.x + view.width - 30 : view.x + 30, y: view.y + view.height * 0.3 };
    const lift = await finger(cdp, await centre(thing), (await inView()) ? await centre(home) : edge, { until: inView });
    await lift(await centre(home));
    await page.waitForTimeout(30);
  }
}

test('plays every level by touch, and progress survives a reload', async ({ page }) => {
  const cdp = await page.context().newCDPSession(page);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await shot(page, '0-start');
  await page.getByRole('button', { name: 'Play as 🐶' }).click();
  await expect(page.getByRole('button', { name: 'Level 2' })).toBeDisabled();
  await shot(page, '1-map');
  await page.getByRole('button', { name: 'Level 1' }).click();

  for (let i = 0; i < LEVELS.length; i++) {
    const l = LEVELS[i];
    await expect(page.locator(`.play.${l.type}`)).toBeVisible();
    if (i === 0 || l.type !== LEVELS[i - 1].type) await shot(page, `level${i + 1}-${l.type}`);
    if (l.type === 'shelf') await playShelf(page, cdp, i);
    if (l.type === 'dogs') await playDogs(page, cdp, i);
    if (l.type === 'room') await playRoom(page, cdp);
    const card = page.getByRole('dialog', { name: 'Level done' });
    await expect(card).toBeVisible();
    await expect(card.locator('.stars i.on')).toHaveCount(3);
    if (i === 0) await shot(page, 'won');
    if (i < LEVELS.length - 1) await card.getByRole('button', { name: 'Next level' }).click();
    else await expect(card.getByRole('button', { name: 'Next level' })).toHaveCount(0);
  }
  await page.reload();
  await page.getByRole('button', { name: 'Play as 🐶' }).click();
  for (let i = 0; i < LEVELS.length; i++) await expect(page.getByRole('button', { name: `Level ${i + 1}` }).locator('.stars i.on')).toHaveCount(3);
  await shot(page, '2-map-done');
  // Another player has their own progress.
  await page.getByRole('button', { name: 'Change player' }).click();
  await page.getByRole('button', { name: 'Play as 🐱' }).click();
  await expect(page.getByRole('button', { name: 'Level 2' })).toBeDisabled();
  expect(errors).toEqual([]);
});

test('wrong drops bounce back and change nothing', async ({ page }) => {
  const cdp = await page.context().newCDPSession(page);
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('sort-party', JSON.stringify({ players: { '🐶': { 0: 1, 1: 1, 2: 1 } } })));
  await page.reload();
  await page.getByRole('button', { name: 'Play as 🐶' }).click();

  // Shelf: onto a full slot.
  await page.getByRole('button', { name: 'Level 1' }).click();
  await drag(cdp, page.locator('[data-drop="slot:0:0"] .item'), page.locator('[data-drop="slot:1:0"]'));
  await page.waitForTimeout(400);
  await expect(page.locator('[data-drop="slot:0:0"] .item')).toBeVisible();
  await expect(page.locator('[data-drop="slot:1:0"] .item')).toHaveAttribute('data-kind', 'B');
  await expect(page.locator('.ghost')).toHaveCount(0);

  // Dogs: the wrong bowl.
  await page.getByRole('button', { name: 'Back to map' }).click();
  await page.getByRole('button', { name: 'Level 2' }).click();
  await drag(cdp, page.locator('.dog.front'), page.locator('.bowl[data-coat="white"]'));
  await page.waitForTimeout(400);
  await expect(page.locator('.dog.front')).toHaveAttribute('data-coat', 'brown');
  await expect(page.locator('.dog.front')).toBeVisible();

  // Room: the wrong home.
  await page.getByRole('button', { name: 'Back to map' }).click();
  await page.getByRole('button', { name: 'Level 4' }).click();
  const toy = page.locator('.thing[data-home="toys"]').first();
  await toy.scrollIntoViewIfNeeded();
  await page.locator('.room-scroll').evaluate((el) => { el.scrollLeft = 0; });
  const before = await page.locator('.thing').count();
  const wrong = page.locator('.home[data-drop="home:books"]');
  await wrong.scrollIntoViewIfNeeded();
  const t = page.locator('.thing[data-home="toys"]').filter({ has: page.locator(':scope') });
  for (let k = 0; k < before; k++) {
    const cand = t.nth(k);
    const b = await cand.boundingBox();
    const v = (await page.locator('.room-scroll').boundingBox())!;
    if (b && b.x > v.x && b.x + b.width < v.x + v.width) { await drag(cdp, cand, wrong); break; }
  }
  await page.waitForTimeout(400);
  await expect(page.locator('.thing')).toHaveCount(before);
  await expect(page.locator('.left-count b')).toHaveText(String(before));
});

test('running out of time offers a retry with no penalty', async ({ page }) => {
  await page.clock.install();
  await page.goto('/');
  await page.getByRole('button', { name: 'Play as 🐰' }).click();
  await page.getByRole('button', { name: 'Level 1' }).click();
  await page.clock.runFor((LEVELS[0].time + 1) * 1000);
  const card = page.getByRole('dialog', { name: 'Try again' });
  await expect(card).toBeVisible();
  await shot(page, 'out-of-time');
  await card.getByRole('button', { name: 'Play again' }).click();
  await expect(page.locator('.timer .secs')).toHaveText(String(LEVELS[0].time));
  await page.getByRole('button', { name: 'Back to map' }).click();
  await expect(page.getByRole('button', { name: 'Level 2' })).toBeDisabled();
});

test('sound off stays off after a reload', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Play as 🦄' }).click();
  await page.getByRole('button', { name: 'Sound off' }).click();
  await page.reload();
  await page.getByRole('button', { name: 'Play as 🦄' }).click();
  await expect(page.getByRole('button', { name: 'Sound on' })).toHaveText('🔇');
});
