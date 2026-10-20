// Where each guest is on the studio plan at any minute, and how they walk between rooms: through the
// doors and gaps the plan draws, at a walking pace, never through a wall. Plan coordinates are the
// 1000 × 620 viewBox of the plan drawing.

import type { Place, Stay } from '@/content/site';

export type Pt = readonly [number, number];
type Spot = Exclude<Place, 'loyly'>;

// where each of the three guests stands in each room, so the dots never sit on one another
export const SPOT: Record<Spot, readonly Pt[]> = {
  sauna: [[150, 120], [230, 120], [310, 120]],
  rinse: [[470, 110], [530, 110], [500, 200]],
  ice: [[650, 108], [760, 238], [650, 238]],
  deck: [[560, 465], [690, 495], [820, 465]],
  out: [[70, 500], [95, 530], [120, 500]],
};

// the doorways and gaps a walk passes through, and the corridor corners between them
const D = {
  receptionToLockers: [160, 498],
  lockersTop: [254, 386],
  corridorBySauna: [254, 340],
  saunaDoor: [254, 292],
  saunaToShowers: [430, 150],
  showersToTubs: [570, 150],
  tubsToDeck: [770, 340],
  deckWest: [428, 468],
  corridorCorner: [410, 340],
  corridorLow: [410, 468],
} satisfies Record<string, Pt>;

// the way from one room to the next, door by door; a move with no entry walks straight
const ROUTE: Partial<Record<`${Spot}>${Spot}`, readonly Pt[]>> = {
  'sauna>rinse': [D.saunaToShowers],
  'rinse>ice': [D.showersToTubs],
  'ice>deck': [D.tubsToDeck],
  'deck>ice': [D.tubsToDeck],
  'deck>sauna': [D.deckWest, D.corridorLow, D.corridorCorner, D.corridorBySauna, D.saunaDoor],
  // leaving: back out through the corridor and the changing rooms to reception
  'deck>out': [D.deckWest, D.corridorLow, D.corridorCorner, D.corridorBySauna, D.lockersTop, D.receptionToLockers],
  'ice>out': [D.tubsToDeck, D.deckWest, D.corridorLow, D.corridorCorner, D.corridorBySauna, D.lockersTop, D.receptionToLockers],
};

const PACE = 380;            // plan units walked per minute of the session
const spotOf = (p: Place): Spot => (p === 'loyly' ? 'sauna' : p);
const ease = (k: number) => k * k * (3 - 2 * k);

function along(path: readonly Pt[], k: number): Pt {
  const legs = path.slice(1).map((p, i) => Math.hypot(p[0] - path[i][0], p[1] - path[i][1]));
  let d = legs.reduce((a, b) => a + b, 0) * k;
  for (let i = 0; i < legs.length; i++) {
    if (d <= legs[i] || i === legs.length - 1) {
      const f = legs[i] ? Math.min(1, d / legs[i]) : 1;
      return [path[i][0] + (path[i + 1][0] - path[i][0]) * f, path[i][1] + (path[i + 1][1] - path[i][1]) * f];
    }
    d -= legs[i];
  }
  return path[path.length - 1];
}
const lengthOf = (path: readonly Pt[]) => path.slice(1).reduce((a, p, i) => a + Math.hypot(p[0] - path[i][0], p[1] - path[i][1]), 0);

export type Where = { place: Place; x: number; y: number; gone: number };

// Guest i at minute m. Stays in the same room run together into one visit (the sauna and the moment the
// water goes on the stones are one visit); a walk starts as a visit begins and takes as long as its path
// needs at walking pace. A guest who has left fades from the plan once they reach reception.
export function whereAt(stays: readonly Stay[], m: number, i: number): Where {
  let place: Place = stays[stays.length - 1][0];
  const visits: { spot: Spot; start: number }[] = [];
  let t = 0;
  for (const [p, mins] of stays) {
    if (!visits.length || visits[visits.length - 1].spot !== spotOf(p)) visits.push({ spot: spotOf(p), start: t });
    if (m >= t && m < t + mins) place = p;
    t += mins;
  }
  let v = 0;
  while (v + 1 < visits.length && m >= visits[v + 1].start) v++;
  const { spot: to, start } = visits[v], end = SPOT[to][i];
  if (v > 0) {
    const from = visits[v - 1].spot;
    const path = [SPOT[from][i], ...(ROUTE[`${from}>${to}`] ?? []), end];
    // a short stay (a minute in the ice) hurries the walk so it never runs into the next one
    const stay = (visits[v + 1]?.start ?? Infinity) - start;
    const walk = Math.min(stay * .9, Math.max(.5, lengthOf(path) / PACE));
    if (m - start < walk) {
      const [x, y] = along(path, ease((m - start) / walk));
      return { place, x, y, gone: 0 };
    }
    if (to === 'out') return { place, x: end[0], y: end[1], gone: ease(Math.min(1, (m - start - walk) / .6)) };
  }
  return { place, x: end[0], y: end[1], gone: 0 };
}
