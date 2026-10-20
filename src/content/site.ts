// Everything the homepage says, in one place. Sections read from here; nothing is typed twice.
// Ron Yen is a fictional studio built as a portfolio piece; the street is real, the studio is not.

export type Photo = { src: string; width: number; height: number; alt: string };

export const studio = {
  wordmark: 'ร้อน·เย็น',
  // for visitors who cannot read the Thai mark
  wordmarkGloss: 'Ron Yen · hot, cold',
  name: 'Ron Yen',
  area: 'Soi Ari 7',
  address: ['Soi Phahonyothin 7, Ari', 'Phaya Thai, Bangkok 10400'],
  sauna: { temp: 88, seats: 10 },
  iceBath: { temp: 3, tubs: 2 },
  deck: { temp: 31 },
  sessionMinutes: 75,
  opens: '06:30',
} as const;

export const nav = [
  { label: 'A round', href: '#round' },
  { label: 'The rooms', href: '#rooms' },
  { label: 'Packs', href: '#packs' },
  { label: 'Find us', href: '#find' },
] as const;

export const hero = {
  headline: ['Sweat at 88°.', 'Then the ice.'],
  text: 'Seventy-five minutes, as many rounds as you like. Two minutes from BTS Ari, open from 06:30.',
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

// Demo data for "today": a session is 75 minutes and seats ten; null seats means the private 20:00
export type Slot = { time: string; taken: number | null };
export const today = {
  label: 'Today, Tue 20 Oct',
  slots: [
    { time: '17:00', taken: 10 },
    { time: '18:30', taken: 9 },
    { time: '20:00', taken: null },
  ] satisfies Slot[],
};

export const packs = [
  { name: 'First visit', price: 490 },
  { name: 'Single session', price: 790 },
  { name: '5 sessions', note: '60 days', price: 3450 },
  { name: '10 sessions', note: '120 days', price: 6290 },
  { name: 'Monthly', note: 'one a day', price: 4900 },
  { name: 'Private', note: '20:00, up to six', price: 3900 },
] as const;
