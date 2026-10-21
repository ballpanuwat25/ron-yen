// The film's story: the same visit at a desk and on a phone, side by side. The window is wiped clear, the
// plan walks its three guests through the morning as the page scrolls, a time is picked and the locker tag
// writes the LINE message (a QR on the desk, Send on LINE on the phone), and the walk from BTS Ari ends it.
// One script for both frames, so the two stay in step; the waits are on what the page shows, never on how
// fast the machine is, so every take plays the same way.
import { sleep, type Lane } from '@/app/film/lane';
import type { Rect } from '@/app/film/actor';

const both = (...lanes: Promise<unknown>[]) => Promise.all(lanes);

// a zigzag across the glass, as a hand wipes a fogged window: in fractions of the glass, left to right
const WIPE: [number, number][] = [[0.14, 0.2], [0.86, 0.14], [0.2, 0.42], [0.84, 0.4], [0.16, 0.66], [0.8, 0.7]];
const across = (r: Rect, path: [number, number][]) => path.map(([fx, fy]) => [r.x + r.width * fx, r.y + r.height * fy] as [number, number]);

// `mark` names the moment the take has reached, for whatever records it to cut or check against
export async function story(desk: Lane, phone: Lane, mark: (scene: string) => void) {
  // 1. The first view: the glass wipes a patch clear on its own as the page opens, then a hand wipes more
  // of it, the cursor on the desk and a finger on the phone, until the ice outside shows.
  mark('window');
  const [deskGlass, phoneGlass] = await Promise.all([desk.ask<Rect>({ cmd: 'rect', sel: '.hero-glass' }), phone.ask<Rect>({ cmd: 'rect', sel: '.hero-glass' })]);
  await both(
    (async () => {
      await sleep(1900);
      const [first, ...rest] = across(deskGlass, WIPE);
      await desk.glide(first[0], first[1], 1200);
      for (const [x, y] of rest) await desk.glide(x, y, 520);
      await sleep(1600);
    })(),
    (async () => {
      await sleep(2600);
      await phone.drag(across(phoneGlass, WIPE.slice(0, 5)), 2600);
      await sleep(1400);
    })(),
  );

  // 2. The plan: the section holds still while the scroll runs the clock, and the three guests walk
  // through the rooms. Half way through the morning the desk picks one guest out.
  mark('plan');
  const run = async (lane: Lane, height: number, pick: boolean) => {
    await lane.scroll('#round', 2200);
    await sleep(1200);
    const track = await lane.ask<Rect>({ cmd: 'rect', sel: '.plan-track' });
    const travel = track.height - height;
    await lane.scroll('.plan-track', 5200, travel * 0.42);
    if (pick) {
      await lane.press('.plan-now li:nth-child(2) button');
      await sleep(1400);
    } else {
      await sleep(1400 + 1300);
    }
    await lane.scroll('.plan-track', 5600, travel);
    await sleep(1500);
  };
  await both(run(desk, 855, true), run(phone, 844, false));

  // 3. Sessions and packs: a time is picked and its locker tag drops with the message written. The desk
  // picks a day and adds a person, and the message and its QR change with them; the phone asks for a
  // plunge and has Send on LINE.
  mark('book');
  await both(
    (async () => {
      await desk.scroll('#book', 2400);
      await sleep(1300);
      await desk.press('.book-list li:nth-child(8) .acts button');
      await desk.see('.tag-qr');
      await sleep(1300);
      await desk.press('.tag-chips button:nth-child(2)');
      await sleep(800);
      await desk.press('.tag-count button[aria-label="One more"]');
      await sleep(900);
      await desk.hover('.tag-message p', 900);
      await sleep(900);
      await desk.hover('.tag-qr svg', 900);
      await sleep(2400);
    })(),
    (async () => {
      await phone.scroll('#book', 2400, -60);
      await sleep(1200);
      await phone.scroll('.book-list li:nth-child(2)', 1200, -200);
      await sleep(600);
      await phone.press('.book-list li:nth-child(2) .acts button.quiet');
      await phone.see('.tag-acts .go');
      await sleep(900);
      await phone.scroll('.tag', 1300, 0, true);
      await sleep(700);
      await phone.press('.tag-count button[aria-label="One more"]');
      await sleep(1600);
      await phone.press('.tag-acts .go');
      await sleep(2400);
    })(),
  );

  // 4. The walk from BTS Ari, and the footer the steam writes the name on.
  mark('find');
  await both(
    (async () => {
      await desk.scroll('#find', 2600);
      await sleep(3600);
      await desk.scroll('.foot', 2600);
      await sleep(3200);
    })(),
    (async () => {
      await phone.scroll('#find', 2600, -60);
      await sleep(1600);
      await phone.scroll('.find-map', 1800, 0, true);
      await sleep(2200);
      await phone.scroll('.foot', 2600);
      await sleep(3000);
    })(),
  );
}
