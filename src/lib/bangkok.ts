import { timetable, type Days } from '@/content/site';

const WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// The studio's own clock: the date, the day and the time in Bangkok, wherever the visitor is.
export function bangkokNow() {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date()).map((p) => [p.type, p.value]));
  const days: Days = parts.weekday === 'Sat' || parts.weekday === 'Sun' ? 'weekend' : 'weekdays';
  // midday UTC on Bangkok's date, so adding days never crosses a date line
  const date = new Date(Date.UTC(+parts.year, +parts.month - 1, +parts.day, 12));
  return { weekday: parts.weekday, days, time: `${parts.hour}:${parts.minute}`, date };
}

// The next social session to start: later today, or the first one tomorrow
export function nextSession() {
  const now = bangkokNow();
  const today = timetable[now.days].times.find((t) => t > now.time);
  if (today) return { time: today, today: true };
  const tomorrow: Days = now.weekday === 'Fri' || now.weekday === 'Sat' ? 'weekend' : 'weekdays';
  return { time: timetable[tomorrow].times[0], today: false };
}

// The next date of each of these weekdays on which a session at this time has not started yet, in
// date order: "Today", "Tomorrow", then "Mon 26 Oct"
export function nextDates(weekdays: readonly string[], time: string) {
  const now = bangkokNow();
  return weekdays.map((dow) => {
    let ahead = (WEEK.indexOf(dow) - now.date.getUTCDay() + 7) % 7;
    if (ahead === 0 && time <= now.time) ahead = 7;
    const d = new Date(now.date.getTime() + ahead * 864e5);
    const label = ahead === 0 ? 'Today' : ahead === 1 ? 'Tomorrow' : `${dow} ${d.getUTCDate()} ${d.toLocaleString('en-GB', { month: 'short', timeZone: 'UTC' })}`;
    return { ahead, label, long: `${dow} ${d.getUTCDate()} ${d.toLocaleString('en-GB', { month: 'short', timeZone: 'UTC' })}` };
  }).sort((a, b) => a.ahead - b.ahead);
}
