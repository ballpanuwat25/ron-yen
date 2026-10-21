'use client';

import qrcode from 'qrcode-generator';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { book, bookingMax, bookingText, line, lineMessage, packs, timetable, type Booking, type Days } from '@/content/site';
import { bangkokNow, nextDates } from '@/lib/bangkok';

// The week's times and the prices, to read. Picking a time drops a locker tag below its row with the
// message to reception written from the day and the number of people: a phone sends it on LINE, a
// computer shows it as a QR code to scan. Nothing is booked here; reception confirms the place by hand.

const baht = (n: number) => `฿${n.toLocaleString('en-US')}`;
type Open = { time: string; what: Booking };

export default function Book() {
  const [days, setDays] = useState<Days>('weekdays');
  const [open, setOpen] = useState<Open | null>(null);
  // the tag lifts away before it goes, so closing is a moment of its own
  const [closing, setClosing] = useState(false);
  // opens on today's timetable once the page knows what day it is in Bangkok
  useEffect(() => setDays(bangkokNow().days), []);
  const t = timetable[days];

  const pick = (time: string, what: Booking) => {
    if (open?.time === time && open.what === what && !closing) { setClosing(true); return; }
    setOpen({ time, what });
    setClosing(false);
  };
  const row = (time: string, what: string, note: string, acts: ReactNode, kind: Booking[]) => {
    const here = open && open.time === time && kind.includes(open.what) ? open : null;
    return (
      <li key={time} className={here ? 'is-open' : undefined}>
        <div className="row">
          <time>{time}</time>
          <span className="what">{what}</span>
          <span className="left">{note}</span>
          <span className="acts">{acts}</span>
        </div>
        {here && (
          <Slide key={`${days}-${here.time}-${here.what}`} closing={closing} onClosed={() => { setOpen(null); setClosing(false); }}>
            <Tag open={here} days={days} onClose={() => setClosing(true)} />
          </Slide>
        )}
      </li>
    );
  };
  const button = (time: string, what: Booking, label: string, quiet?: boolean) => (
    <button type="button" className={quiet ? 'quiet' : undefined} aria-expanded={open?.time === time && open.what === what}
      onClick={() => pick(time, what)}>{label}</button>
  );

  return (
    <section className="book" id="book">
      <div className="book-head">
        <h2>{book.heading}</h2>
        <p>{book.text}</p>
      </div>

      <div className="book-grid">
        <div>
          <div className="book-days" role="tablist" aria-label="Days">
            {(['weekdays', 'weekend'] as const).map((d) => (
              <button key={d} type="button" role="tab" aria-selected={d === days} onClick={() => { setDays(d); setOpen(null); }}>
                {timetable[d].label}
              </button>
            ))}
          </div>

          <ul className="book-list">
            {t.times.map((time) => row(time, book.social, '', <>{button(time, 'social', 'Book')}{button(time, 'plunge', book.plunge, true)}</>, ['social', 'plunge']))}
            {row(timetable.private, book.private, book.privateNote, button(timetable.private, 'private', 'Book'), ['private'])}
          </ul>
          {line.demo && <p className="book-demo">{book.demo}</p>}
        </div>

        <aside className="book-packs" id="packs">
          <h3>{book.packsHeading}</h3>
          <dl>
            {packs.map((p) => (
              <div key={p.name}>
                <dt>{p.name}{'note' in p && p.note && <small>{p.note}</small>}</dt>
                <dd>{baht(p.price)}</dd>
              </div>
            ))}
          </dl>
          <p>{book.packsNote}</p>
          <p className="book-line"><span>{book.lineLabel}</span><b>{line.id}</b></p>
        </aside>
      </div>
    </section>
  );
}

// Opens the locker tag below its row: the row's space grows while the tag drops in, and on closing the tag
// lifts away and the space folds shut. The tag is clipped only while it moves, so its shadow shows at rest.
function Slide({ closing, onClosed, children }: { closing: boolean; onClosed: () => void; children: ReactNode }) {
  const [moving, setMoving] = useState(true);
  return (
    <div
      className={`tag-slide${closing ? ' is-closing' : ''}${moving || closing ? ' is-moving' : ''}`}
      onAnimationEnd={(e) => { if (e.target !== e.currentTarget) return; if (closing) onClosed(); else setMoving(false); }}
    >
      <div>{children}</div>
    </div>
  );
}

// The locker tag: the day, how many, and the message they make, ready to send
function Tag({ open, days, onClose }: { open: Open; days: Days; onClose: () => void }) {
  const dates = useMemo(() => nextDates(timetable[days].days, open.time), [days, open.time]);
  const [day, setDay] = useState(0);
  const [people, setPeople] = useState(1);
  const [phone, setPhone] = useState(false);
  useEffect(() => setPhone(matchMedia('(pointer: coarse)').matches), []);

  const max = bookingMax[open.what];
  const text = bookingText(open.what, dates[day].long, open.time, people);
  const link = lineMessage(text);
  // the code holds the same link as the button, so a phone that scans it opens LINE with the message
  const qr = useMemo(() => {
    const q = qrcode(0, 'L'); q.addData(link, 'Byte'); q.make();
    const n = q.getModuleCount(), cells: string[] = [];
    for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (q.isDark(r, k)) cells.push(`M${k} ${r}h1v1h-1z`);
    return { n, d: cells.join('') };
  }, [link]);
  const title = open.what === 'social' ? 'Social session' : open.what === 'plunge' ? 'Plunge only' : 'Private session';
  const minutes = open.what === 'plunge' ? 25 : 75;

  return (
    <div className={`tag tag-${open.what === 'plunge' ? 'cold' : 'hot'}`} role="group" aria-label={`${title}, ${open.time}`}>
      <span className="hole" aria-hidden="true" />
      <div className="tag-body">
        <div className="tag-top">
          <span className="tag-kind">{title}</span>
          <span className="tag-when">{timetable[days].label} · {open.time} · {minutes} min</span>
        </div>

        <div className="tag-pick">
          <div className="tag-field" role="radiogroup" aria-label={book.tag.day}>
            <span>{book.tag.day}</span>
            <div className="tag-chips">
              {dates.map((d, i) => (
                <button key={d.long} type="button" role="radio" aria-checked={i === day} onClick={() => setDay(i)}>{d.label}</button>
              ))}
            </div>
          </div>
          <div className="tag-field">
            <span>{book.tag.people}</span>
            <div className="tag-count">
              <button type="button" aria-label="One fewer" disabled={people <= 1} onClick={() => setPeople((p) => p - 1)}>−</button>
              <output aria-live="polite">{people}</output>
              <button type="button" aria-label="One more" disabled={people >= max} onClick={() => setPeople((p) => p + 1)}>+</button>
            </div>
          </div>
        </div>

        <div className="tag-send">
          <div className="tag-message">
            <span>{book.tag.message}</span>
            <p>{text}</p>
          </div>
          {!phone && (
            <figure className="tag-qr">
              <svg viewBox={`-2 -2 ${qr.n + 4} ${qr.n + 4}`} role="img" aria-label="QR code with the message">
                <rect x="-2" y="-2" width={qr.n + 4} height={qr.n + 4} className="qr-ground" />
                <path d={qr.d} className="qr-ink" />
              </svg>
              <figcaption>{book.tag.scan}</figcaption>
            </figure>
          )}
        </div>

        <div className="tag-acts">
          {phone && <a className="go" href={link}>{book.tag.send}</a>}
          <button type="button" className="quiet" onClick={onClose}>{book.tag.close}</button>
        </div>
      </div>
    </div>
  );
}
