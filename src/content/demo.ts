// Demo data for the booking parts of the page: a week of sessions with made-up bookings, and a demo
// member with points left on a pack. Nothing here is real and nothing is sent anywhere.

import type { SessionKind } from './site';

export type Session = {
  time: string;
  kind: Extract<SessionKind, 'social' | 'private'>;
  taken: number;            // of 10 on the bench (a private session is taken or free, 10 or 0)
  plungeTaken: number;      // of 2 plunge-only places that start with a social session
  waiting: number;          // on the waitlist once full
};
export type Day = { key: string; short: string; label: string; weekend: boolean; sessions: Session[] };

const WEEKDAY = ['06:30', '08:00', '09:30', '11:00', '12:30', '14:00', '15:30', '17:00', '18:30'];
const WEEKEND = ['08:00', '09:30', '11:00', '12:30', '14:00', '15:30', '17:00', '18:30'];

// a steady made-up week: mornings and evenings fill, the middle of the day is quiet
function busy(day: number, time: string) {
  const h = Number(time.slice(0, 2));
  const base = h < 8 ? 7 : h < 10 ? 6 : h < 16 ? 3 : 8;
  const wobble = ((day * 7 + h * 13 + Number(time.slice(3))) % 5) - 2;
  return Math.max(0, Math.min(10, base + wobble));
}

const NAMES = [['Tue', 20], ['Wed', 21], ['Thu', 22], ['Fri', 23], ['Sat', 24], ['Sun', 25], ['Mon', 26]] as const;

export const week: Day[] = NAMES.map(([dow, date], d) => {
  const weekend = dow === 'Sat' || dow === 'Sun';
  const sessions: Session[] = (weekend ? WEEKEND : WEEKDAY).map((time) => {
    const taken = busy(d, time);
    return { time, kind: 'social', taken, plungeTaken: (d + time.length + taken) % 3, waiting: taken === 10 ? 1 + (d % 3) : 0 };
  });
  sessions.push({ time: '20:00', kind: 'private', taken: d % 3 === 1 ? 10 : 0, plungeTaken: 0, waiting: 0 });
  return { key: `2026-10-${date}`, short: `${dow} ${date}`, label: `${dow === 'Tue' ? 'Today, ' : ''}${dow} ${date} Oct`, weekend, sessions };
});

// today's evening, as the header and the booking list show it: the 17:00 is full with two waiting, one place at 18:30
const today = week[0];
Object.assign(today.sessions.find((s) => s.time === '17:00')!, { taken: 10, waiting: 2 });
Object.assign(today.sessions.find((s) => s.time === '18:30')!, { taken: 9, waiting: 0 });
const demoNow = { day: today, time: '17:40' };
export const nextOpen = today.sessions.find((s) => s.time > demoNow.time && s.kind === 'social' && s.taken < 10)!;

// the demo member: a 10-session pack with six points left (three social sessions or six plunges)
export const demoMember = { name: 'Demo guest', pack: '10 sessions', points: 6, expires: '14 Jan' };
