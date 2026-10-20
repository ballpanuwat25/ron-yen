// Everything the homepage says, in one place. Sections read from here; nothing is typed twice.
// Ron Yen is a fictional studio built as a portfolio piece; the street is real, the studio is not.

import { ariMap } from './ari-map.ts';

export type Photo = { src: string; width: number; height: number; alt: string };

// minutes on foot from BTS Ari, measured along real streets by scripts/build-map.mjs, never typed by hand
const walkFromBts = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'][ariMap.walk.minutes] ?? String(ariMap.walk.minutes);

export const studio = {
  wordmark: 'ร้อน·เย็น',
  // for visitors who cannot read the Thai mark
  wordmarkGloss: 'Ron Yen · hot, cold',
  name: 'Ron Yen',
  area: 'Soi Ari',
  address: ['Soi Ari (Soi Phahonyothin 7)', 'Samsen Nai, Phaya Thai, Bangkok 10400'],
  sauna: { temp: 88, seats: 10 },
  iceBath: { temp: 3, tubs: 4 },
  deck: { temp: 31, seats: 12 },
  showers: 2,
  opens: '06:30',
} as const;

// One way round, so nobody stands in a queue: the showers sit between the sauna and the tubs (you rinse
// before the ice anyway), and the deck has more seats than the bench, so a full tub means a sit-down, not a wait.
export const zones = [
  { id: 'sauna', name: 'Sauna', note: '88°, ten on the bench' },
  { id: 'showers', name: 'Showers', note: 'two, a rinse before the ice' },
  { id: 'tubs', name: 'Ice baths', note: 'four round tubs at 3°, outside, one person each' },
  { id: 'deck', name: 'Deck', note: 'twelve seats outside, hot tea' },
  { id: 'lockers', name: 'Changing rooms', note: 'lockers and towels' },
] as const;

// A session is a time you book, not a routine: most people do 12 minutes in the sauna, 2 in the ice and
// 10 on the deck, two to four times. Plunge only starts with each social session, while those guests are
// still in the sauna, so the tubs are free; the two never share a tub.
// Packs hold points, two to a social session and one to a plunge (390 × 2 is about 790), so one pack
// pays for either without half sessions. Customers never see the word: "3 social or 6 plunges left".
// `points: null` means the session is paid for on its own and cannot be booked with a pack.
export type SessionKind = 'social' | 'plunge' | 'private';
export const sessionKinds = {
  social: { name: 'Social', minutes: 75, places: 10, points: 2, uses: ['sauna', 'tubs', 'deck'] },
  plunge: { name: 'Plunge only', minutes: 25, places: 2, points: 1, uses: ['tubs', 'deck'] },
  private: { name: 'Private', minutes: 75, places: 6, points: null, uses: ['sauna', 'tubs', 'deck'] },
} as const satisfies Record<SessionKind, { name: string; minutes: number; places: number; points: number | null; uses: readonly string[] }>;

export const nav = [
  { label: 'The studio', href: '#round' },
  { label: 'Sessions', href: '#book' },
  { label: 'Packs', href: '#packs' },
  { label: 'Find us', href: '#find' },
] as const;

export const hero = {
  headline: ['Sweat at 88°.', 'Then the ice.'],
  text: `Seventy-five minutes, as many rounds as you like. ${walkFromBts} minutes on foot from BTS Ari, open from 06:30.`,
  book: 'Book a session',
  // the sauna fills the page in the hot ink; the ice bath is only ever seen through the window
  sauna: {
    wide: { src: '/images/hero-hot-wide.webp', width: 2000, height: 1250, alt: '' },
    tall: { src: '/images/hero-hot-tall.webp', width: 1000, height: 1600, alt: '' },
  },
  window: { src: '/images/window-floes.webp', width: 1600, height: 1000, alt: 'The ice bath outside the sauna window' } satisfies Photo,
  wipe: { mouse: 'Wipe the glass', touch: 'Wipe the glass with a finger' },
  // what the reading says as the glass clears, from the bench to the bath
  where: { hot: 'On the bench, ten at a time', between: 'Out of the heat', cold: 'In the ice bath, one at a time' },
} as const;

export const book = {
  heading: 'Book a session',
  text: 'Pick a day and a time. A full session has a waitlist; plunge-only places start with each social session.',
  packsHeading: 'Packs and prices',
  packsNote: 'A pack covers a social session, or two plunges in its place. Cancel six hours ahead and it goes back on the pack.',
  signedIn: 'Signed in as',
};

// A pack either holds points or covers one session a day for 30 days; the rest are single tickets.
export type Pack = { name: string; price: number; note?: string; points?: number; days?: number; perDay?: number; kind?: SessionKind };
export const packs = [
  { name: 'First visit', price: 490, note: 'first social only', kind: 'social' },
  { name: 'Single session', price: 790, kind: 'social' },
  { name: 'Plunge only', price: 390, note: '25 minutes', kind: 'plunge' },
  { name: '5 sessions', price: 3450, note: '60 days', points: 10, days: 60 },
  { name: '10 sessions', price: 6290, note: '120 days', points: 20, days: 120 },
  { name: 'Monthly', price: 4900, note: 'one a day, social or plunge', days: 30, perDay: 1 },
  { name: 'Private', price: 3900, note: '20:00, up to six', kind: 'private' },
] as const satisfies readonly Pack[];

// "One round": three ways to spend the time, walked through a plan of the studio. None is a level;
// they are reasons to come. The two social ones are both on the bench when someone ladles water on
// the stones; the plunge-only guest is in and out in 25 minutes, while the sauna is still full.
export type Place = 'sauna' | 'loyly' | 'rinse' | 'ice' | 'deck' | 'out';
export const placeTemp: Record<Place, number> = { sauna: 88, loyly: 96, rinse: 28, ice: 3, deck: 31, out: 32 };
export const placeName: Record<Place, string> = {
  sauna: 'On the bench', loyly: 'Water on the stones', rinse: 'Under the shower', ice: 'In the ice', deck: 'On the deck', out: 'Gone to work',
};
export type Stay = readonly [Place, number];   // where, for how many minutes

export const round = {
  heading: 'Three ways to spend the time',
  text: 'Nobody times you. Some come after work for two slow rounds and a pot of tea, some make a morning of it, some only want the ice before the office.',
  minutes: 75,
  hint: { wide: 'Click a name to find them on the plan', narrow: 'Tap a name to follow them' },
  ways: [
    {
      id: 'unwind', name: 'After work', note: 'Two rounds, then tea', kind: 'social',
      stays: [['sauna', 10], ['rinse', 1], ['ice', 1], ['deck', 12], ['sauna', 2], ['loyly', 1.5], ['sauna', 8.5], ['rinse', 1], ['ice', 1.5], ['deck', 36.5]],
    },
    {
      id: 'full', name: 'A whole morning', note: 'Four rounds', kind: 'social',
      stays: [['sauna', 12], ['rinse', 1], ['ice', 2], ['deck', 5], ['sauna', 6], ['loyly', 1.5], ['sauna', 5.5], ['rinse', 1], ['ice', 2.5], ['deck', 5],
        ['sauna', 12], ['rinse', 1], ['ice', 3], ['deck', 5], ['sauna', 8], ['rinse', 1], ['ice', 2], ['deck', 1.5]],
    },
    {
      id: 'plunge', name: 'Before the office', note: 'Plunge only, 25 minutes', kind: 'plunge',
      stays: [['rinse', 1], ['ice', 2], ['deck', 6], ['ice', 2], ['deck', 6], ['ice', 2], ['deck', 6], ['out', 50]],
    },
  ],
  // what is happening, shown as the minutes pass
  notes: [
    { at: 0, text: 'Everyone starts at the same time. The plunge-only guest goes straight to the tubs while the bench fills.' },
    { at: 9, text: 'Ice, a sit on the deck, ice again: three plunges in twenty-five minutes, while the others are still on the bench.' },
    { at: 25, text: 'The plunge-only guest is dressed and gone, twenty-five minutes after arriving.' },
    { at: 26, text: 'Someone ladles water on the stones, and the heat climbs for a minute.' },
    { at: 38, text: 'After two rounds, out on the deck for good, with a pot of tea.' },
    { at: 54.5, text: 'The third plunge is the long one: three minutes.' },
    { at: 73, text: 'Seventy-five minutes, and everyone is out.' },
  ],
} as const;

// "Find us": a real point on Soi Ari (Soi Phahonyothin 7); the studio itself is invented. The map and the walk from BTS Ari
// are drawn from OpenStreetMap by scripts/build-map.mjs into src/content/ari-map.ts.
export const findUs = {
  heading: 'Find us',
  studioAt: [13.78207, 100.54353] as readonly [number, number],
  address: ['Soi Ari (Soi Phahonyothin 7)', 'Samsen Nai, Phaya Thai, Bangkok 10400'],
  hours: [
    { days: 'Mon–Fri', time: '06:30 – 21:15' },
    { days: 'Sat–Sun', time: '08:00 – 21:15' },
  ],
  line: '@ronyen.ari',
  station: 'BTS Ari',
  lead: 'on foot from BTS Ari',
  // the walk, one step per point on the map; the first two end with that leg's distance from the map
  steps: [
    { title: 'BTS Ari', text: 'Come down on the Soi Ari side and walk north for' },
    { title: 'Turn left into Soi Ari', text: 'Walk along it for' },
    { title: studio.wordmark, text: 'On your left' },
  ],
  facts: { address: 'Address', open: 'Open', line: 'LINE' },
  credit: 'Map data © OpenStreetMap contributors',
};

// The foot of the page: the studio's name written in the steam on a sauna window, then the plain facts
export const foot = {
  words: ['ร้อน', 'เย็น'] as const,
  hours: 'Open daily',
  top: 'Back to the top',
  note: 'A fictional studio, made as a portfolio piece: the street is real, the studio is not, and nothing on this page books or charges anything. Photographs from Unsplash. Map data © OpenStreetMap contributors.',
};
