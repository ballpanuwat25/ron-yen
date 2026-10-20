'use client';

import qrcode from 'qrcode-generator';
import { useMemo, useState, type ReactNode } from 'react';
import { book, packs, sessionKinds } from '@/content/site';
import { demoMember, week, type Session } from '@/content/demo';
import Seats from './Seats';

// The week's sessions, and a booking made on a locker tag: the band a sauna gives you to wear, with your
// number on it. Packs pay in points (two for a session, one for a plunge). Everything here is a demo:
// the bookings are made up and nothing is sent or charged.

type Choice = 'social' | 'plunge' | 'private' | 'waitlist';
type Open = { day: number; time: string; choice: Choice };
type Booked = { code: string; locker: number; choice: Choice; day: number; time: string; paidWith: 'points' | 'promptpay'; place?: number };

const baht = (n: number) => `฿${n.toLocaleString('en-US')}`;
// a pack's balance as guests see it: in sessions, never in points
const inSessions = (p: number) => `${Math.floor(p / 2)} social${Math.floor(p / 2) === 1 ? '' : 's'} or ${p} plunge${p === 1 ? '' : 's'}`;
const price = { social: 790, plunge: 390, private: 3900 } as const;

export default function Book() {
  const [day, setDay] = useState(0);
  const [open, setOpen] = useState<Open | null>(null);
  // the tag lifts away before it goes, so closing is a moment of its own
  const [closing, setClosing] = useState(false);
  const [points, setPoints] = useState(demoMember.points);
  const [pay, setPay] = useState<'points' | 'promptpay'>('points');
  const [booked, setBooked] = useState<Booked | null>(null);
  // places this visitor has taken in the demo, so the seats on the list fill as they book
  const [mine, setMine] = useState<Record<string, Choice>>({});

  const sessions = week[day].sessions;
  const taken = (s: Session) => s.taken + (mine[`${day}-${s.time}`] === 'social' ? 1 : 0);
  const plungeLeft = (s: Session) => 2 - s.plungeTaken - (mine[`${day}-${s.time}`] === 'plunge' ? 1 : 0);

  const start = (time: string, choice: Choice) => {
    setOpen({ day, time, choice });
    setClosing(false);
    setBooked(null);
    setPay(choice === 'private' || choice === 'waitlist' ? 'promptpay' : points >= cost(choice) ? 'points' : 'promptpay');
  };
  const cost = (c: Choice) => (c === 'social' ? sessionKinds.social.points : c === 'plunge' ? sessionKinds.plunge.points : 0);

  const confirm = () => {
    if (!open) return;
    const s = week[open.day].sessions.find((x) => x.time === open.time)!;
    const code = `RY-${week[open.day].key.slice(5).replace('-', '')}-${open.time.replace(':', '')}-${String(10 + Object.keys(mine).length).padStart(2, '0')}`;
    if (pay === 'points') setPoints((p) => p - cost(open.choice));
    setMine((m) => ({ ...m, [`${open.day}-${open.time}`]: open.choice }));
    setBooked({ code, locker: 3 + ((s.taken * 7 + Number(open.time.slice(0, 2))) % 20), choice: open.choice, day: open.day, time: open.time, paidWith: pay, place: open.choice === 'waitlist' ? s.waiting + 1 : undefined });
  };
  const cancel = () => {
    if (!booked) return;
    if (booked.paidWith === 'points') setPoints((p) => p + cost(booked.choice));
    setMine((m) => { const n = { ...m }; delete n[`${booked.day}-${booked.time}`]; return n; });
    setClosing(true);
  };
  const close = () => setClosing(true);
  const closed = () => { setOpen(null); setClosing(false); };

  return (
    <section className="book" id="book">
      <div className="book-head">
        <h2>{book.heading}</h2>
        <p>{book.text}</p>
      </div>

      <div className="book-grid">
        <div>
          <div className="book-days" role="tablist" aria-label="Day">
            {week.map((d, i) => (
              <button key={d.key} type="button" role="tab" aria-selected={i === day} onClick={() => { setDay(i); setOpen(null); }}>
                {d.short}
              </button>
            ))}
          </div>

          <ul className="book-list">
            {sessions.map((s) => {
              const key = `${day}-${s.time}`, isOpen = open?.day === day && open.time === s.time;
              const full = s.kind === 'social' && taken(s) >= 10;
              const privateTaken = s.kind === 'private' && s.taken >= 10;
              return (
                <li key={s.time} className={isOpen ? 'is-open' : undefined}>
                  <div className="row">
                    <time>{s.time}</time>
                    <span className="what">{s.kind === 'private' ? 'Private · up to six' : 'Social · 75 min'}</span>
                    {s.kind === 'social' ? <Seats taken={taken(s)} /> : <span className="seats" />}
                    <span className="left">
                      {s.kind === 'private' ? (privateTaken ? 'Booked' : 'Whole studio')
                        : full ? `Full · ${s.waiting} waiting` : `${10 - taken(s)} of 10 left`}
                    </span>
                    <span className="acts">
                      {mine[key] ? <em>{mine[key] === 'waitlist' ? 'On the waitlist' : 'Booked'}</em>
                        : s.kind === 'private' ? (!privateTaken && <button type="button" onClick={() => start(s.time, 'private')}>Book</button>)
                        : full ? <button type="button" onClick={() => start(s.time, 'waitlist')}>Join waitlist</button>
                        : <button type="button" onClick={() => start(s.time, 'social')}>Book</button>}
                      {s.kind === 'social' && !mine[key] && plungeLeft(s) > 0 && (
                        <button type="button" className="quiet" onClick={() => start(s.time, 'plunge')}>Plunge only · {plungeLeft(s)}</button>
                      )}
                    </span>
                  </div>
                  {isOpen && (
                    <Slide closing={closing} onClosed={closed}>
                      <Tag
                        open={open} booked={booked} points={points} pay={pay} setPay={setPay}
                        session={s} dayLabel={week[day].label} onConfirm={confirm} onCancel={cancel} onClose={close} cost={cost(open.choice)}
                      />
                    </Slide>
                  )}
                </li>
              );
            })}
          </ul>
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
          <div className="member">
            <span>{book.signedIn} <b>{demoMember.name}</b></span>
            <span>{demoMember.pack} pack: {inSessions(points)} left, until {demoMember.expires}</span>
          </div>
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

// The locker tag: what you are booking, how you pay, and once it is booked, your code and locker number
function Tag({ open, booked, points, pay, setPay, session, dayLabel, onConfirm, onCancel, onClose, cost }: {
  open: Open; booked: Booked | null; points: number; pay: 'points' | 'promptpay'; setPay: (p: 'points' | 'promptpay') => void;
  session: Session; dayLabel: string; onConfirm: () => void; onCancel: () => void; onClose: () => void; cost: number;
}) {
  const c = open.choice;
  const title = c === 'social' ? 'Social session' : c === 'plunge' ? 'Plunge only' : c === 'private' ? 'Private session' : 'Waitlist';
  const minutes = c === 'plunge' ? sessionKinds.plunge.minutes : sessionKinds.social.minutes;
  const amount = c === 'social' ? price.social : c === 'plunge' ? price.plunge : c === 'private' ? price.private : 0;
  const qr = useMemo(() => {
    if (!booked) return null;
    const q = qrcode(0, 'M'); q.addData(booked.code); q.make();
    const n = q.getModuleCount(), cells: string[] = [];
    for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (q.isDark(r, k)) cells.push(`M${k} ${r}h1v1h-1z`);
    return { n, d: cells.join('') };
  }, [booked]);

  return (
    <div className={`tag tag-${c === 'plunge' ? 'cold' : 'hot'}`} role="group" aria-label={`${title}, ${dayLabel}, ${open.time}`}>
      <span className="hole" aria-hidden="true" />
      <div className="tag-body">
        <div className="tag-top">
          <span className="tag-kind">{title}</span>
          <span className="tag-when">{dayLabel} · {open.time}{c !== 'waitlist' && ` · ${minutes} min`}</span>
        </div>

        {!booked ? (
          <div className="tag-swap" key="ask">
            {c === 'waitlist' ? (
              <p className="tag-say">{session.time} is full. Join the waitlist and you are number {session.waiting + 1}; if a place opens we email you and hold it for 30 minutes. Nothing to pay until then.</p>
            ) : c === 'private' ? (
              <p className="tag-say">The whole studio for up to six, from {open.time}. {baht(amount)}, paid ahead by PromptPay; packs do not cover private sessions.</p>
            ) : (
              <fieldset className="tag-pay">
                <legend>Pay with</legend>
                <label className={points < cost ? 'is-off' : undefined}>
                  <input type="radio" name="pay" checked={pay === 'points'} disabled={points < cost} onChange={() => setPay('points')} />
                  <span>Your pack</span>
                  <small>{points < cost ? 'not enough left on it' : `${inSessions(points)} left; ${inSessions(points - cost)} after`}</small>
                </label>
                <label>
                  <input type="radio" name="pay" checked={pay === 'promptpay'} onChange={() => setPay('promptpay')} />
                  <span>{baht(amount)} by PromptPay</span>
                  <small>scan and pay on the next step</small>
                </label>
              </fieldset>
            )}
            <div className="tag-acts">
              <button type="button" className="go" onClick={onConfirm}>{c === 'waitlist' ? 'Join the waitlist' : 'Confirm'}</button>
              <button type="button" className="quiet" onClick={onClose}>Not now</button>
            </div>
            <p className="tag-demo">Demo: nothing is booked or charged.</p>
          </div>
        ) : (
          <div className="tag-swap" key="done">
            {booked.choice === 'waitlist' ? (
              <p className="tag-say">You are number {booked.place} on the waitlist for {booked.time}. If a place opens we email you and hold it for 30 minutes.</p>
            ) : (
              <div className="tag-done">
                <svg className="qr" viewBox={`-2 -2 ${qr!.n + 4} ${qr!.n + 4}`} role="img" aria-label={`QR code for booking ${booked.code}`}>
                  <rect x="-2" y="-2" width={qr!.n + 4} height={qr!.n + 4} className="qr-ground" />
                  <path d={qr!.d} className="qr-ink" />
                </svg>
                <div>
                  <b className="locker">Locker {booked.locker}</b>
                  <span className="code">{booked.code}</span>
                  <span>{booked.paidWith === 'points' ? 'Paid from your pack' : `${baht(amount)} by PromptPay`}</span>
                  <span>Show this at reception. Cancel up to six hours before{booked.paidWith === 'points' ? ' and it goes back on your pack' : ' for a full refund'}.</span>
                </div>
              </div>
            )}
            <div className="tag-acts">
              <button type="button" className="quiet" onClick={onCancel}>{booked.choice === 'waitlist' ? 'Leave the waitlist' : 'Cancel booking'}</button>
              <button type="button" className="quiet" onClick={onClose}>Done</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
