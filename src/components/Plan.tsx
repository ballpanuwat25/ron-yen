'use client';

import { useEffect, useRef, useState } from 'react';
import { placeName, placeTemp, round } from '@/content/site';
import { whereAt } from '@/lib/walk';
import { onWheelTurn, smooth } from '@/lib/smooth';

// The studio from above, drawn in the page's thin cream line: reception, changing rooms, sauna, showers,
// the four tubs and the deck, with the one-way route through them. Three dots are the three ways to spend
// a session. The section holds still while you scroll through it, and the scroll is the clock: 75 minutes
// from the top of the section to the bottom, the dots walking from room to room as the minutes pass.

type Rect = { x: number; y: number; w: number; h: number };
const ROOM: Record<'sauna' | 'rinse' | 'ice' | 'deck' | 'lockers' | 'reception', Rect> = {
  sauna: { x: 40, y: 40, w: 380, h: 270 },
  rinse: { x: 440, y: 40, w: 120, h: 270 },
  ice: { x: 580, y: 40, w: 380, h: 270 },
  deck: { x: 440, y: 370, w: 520, h: 190 },
  lockers: { x: 170, y: 370, w: 210, h: 190 },
  reception: { x: 40, y: 370, w: 110, h: 190 },
};

const noteAt = (m: number) => [...round.notes].reverse().find((n) => m >= n.at) ?? round.notes[0];

export default function Plan() {
  // the minute as the text and the list show it, a quarter-minute at a time; the dots and the frame
  // move every frame in the loop below, without React
  const [minute, setMinute] = useState(0);
  const [pick, setPick] = useState<number | null>(null);
  const pickRef = useRef<number | null>(null);
  pickRef.current = pick;
  const trackRef = useRef<HTMLDivElement>(null);
  const camRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const dotRefs = useRef<(SVGGElement | null)[]>([]);
  const markRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // One loop moves everything, so the dots, the frame and the edge markers are always drawn from the same
  // instant and can never fall a frame out of step with each other.
  useEffect(() => {
    const frame = camRef.current, svg = svgRef.current;
    if (!frame || !svg) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0, prev = performance.now(), shown = 0, first = true;
    const cam = { x: 0, y: 0, s: 1 }, vel = { x: 0, y: 0, s: 0 };
    const glide: { x: number; y: number }[] = [];

    const tick = (now: number) => {
      const dt = Math.min(64, now - prev); prev = now;

      // The scroll is the clock: the top of the track is minute 0, the bottom minute 75. The clock eases
      // toward where the scroll is rather than jumping a wheel notch at a time.
      const trackEl = trackRef.current;
      if (!trackEl) { raf = requestAnimationFrame(tick); return; }
      const track = trackEl.getBoundingClientRect();
      const goal = Math.min(1, Math.max(0, -track.top / (track.height - innerHeight))) * round.minutes;
      shown = first || reduced || Math.abs(goal - shown) < .02 ? goal : shown + (goal - shown) * (1 - Math.exp(-dt / 220));
      const q = Math.round(shown * 4) / 4;
      setMinute((m) => (m === q ? m : q));

      // the guests, walking through the doors between rooms
      const ways = round.ways.map((w, i) => whereAt(w.stays, shown, i));
      ways.forEach((p, i) => {
        const g = dotRefs.current[i];
        if (!g) return;
        g.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`);
        g.style.opacity = String(1 - p.gone);
        g.style.pointerEvents = p.gone >= 1 ? 'none' : '';
      });
      // a tapped guest stays followed until tapped again, or until they leave the studio
      if (pickRef.current !== null && ways[pickRef.current].gone >= 1) { pickRef.current = null; setPick(null); }

      // On a phone the frame follows the whole-morning guest, who keeps moving through every room to the
      // end, unless another guest has been tapped. On a wide screen the whole plan is in view and the frame
      // never moves.
      const phone = getComputedStyle(frame).overflow === 'hidden';
      const W = frame.clientWidth, H = frame.clientHeight, unit = W / 1000;
      const aim = [pickRef.current ?? 1];
      let to = { x: 0, y: 0, s: 1 };
      if (phone && aim.length) {
        const xs = aim.map((i) => ways[i].x), ys = aim.map((i) => ways[i].y), pad = 150;
        const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
        const s = Math.max(1, Math.min(2.2, W / ((x1 - x0 + pad * 2) * unit), H / ((y1 - y0 + pad * 2) * unit)));
        const clamp = (v: number, max: number) => (max <= 0 ? max / 2 : Math.max(0, Math.min(max, v)));
        to = { s, x: clamp((x0 + x1) / 2 * unit * s - W / 2, 1000 * unit * s - W), y: clamp((y0 + y1) / 2 * unit * s - H / 2, 620 * unit * s - H) };
      }
      // The frame moves on a critically damped spring: it sets off gently, glides, and settles without
      // overshooting, where a plain ease would lurch at the start of every move.
      if (first) { cam.x = to.x; cam.y = to.y; cam.s = to.s; }
      const w = 5.5, h = dt / 1000;
      for (const key of ['x', 'y', 's'] as const) {
        const a = w * w * (to[key] - cam[key]) - 2 * w * vel[key];
        vel[key] += a * h; cam[key] += vel[key] * h;
      }
      svg.style.transform = phone ? `translate(${-cam.x}px, ${-cam.y}px) scale(${cam.s})` : '';
      // while the frame makes a long move (to a newly tapped guest) the markers step aside, and come back
      // once it has arrived; following a guest across a room is not a long move, so they stay
      const travelling = Math.hypot(to.x - cam.x, to.y - cam.y) > 90;

      // Anyone out of the frame gets a drop pinned to the edge nearest them, its point toward them. It
      // shows only once the dot is wholly out of view and goes only once the dot is well back in, so a
      // guest at the edge never shows twice or blinks; it glides along the edge rather than jumping, and
      // two guests off the same edge are stepped apart.
      const r = 13 * unit * cam.s + 3;
      const flagged: { i: number; el: HTMLButtonElement; sx: number; sy: number; mx: number; my: number; side: string; was: boolean }[] = [];
      ways.forEach((p, i) => {
        const el = markRefs.current[i];
        if (!el) return;
        const sx = p.x * unit * cam.s - cam.x, sy = p.y * unit * cam.s - cam.y;
        const was = el.dataset.out === '1';
        const beyond = (m: number) => sx < -m || sx > W + m || sy < -m || sy > H + m;
        // the guest the frame is following never has a marker: the frame is already on its way to them,
        // so their marker goes at once, without fading, the moment they are tapped
        const followed = aim.includes(i);
        let out = phone && p.gone < 1 && !followed && !travelling && (was ? beyond(-r - 24) : beyond(r + 4));
        // A marker goes at once, with only the quickest fade. Coming back is what waits: one that has just
        // gone may not return for a moment, so nothing can flick it on and off.
        if (out && !was && now - Number(el.dataset.since || 0) < 600) out = false;
        if (out !== was) {
          el.dataset.out = out ? '1' : '0'; el.dataset.since = String(now);
          el.style.transition = out ? 'opacity .25s' : followed ? 'none' : 'opacity .08s';
          el.style.opacity = out ? '1' : '0'; el.style.pointerEvents = out ? 'auto' : 'none';
        }
        if (!out) return;
        const mx = Math.max(18, Math.min(W - 18, sx)), my = Math.max(18, Math.min(H - 18, sy));
        const side = mx <= 18 ? 'l' : mx >= W - 18 ? 'r' : my <= 18 ? 't' : 'b';
        flagged.push({ i, el, sx, sy, mx, my, side, was });
      });
      // Markers on the same edge that would touch are laid out as one group, side by side about the
      // group's middle and always in the guests' order, so none of them hops past another as things move.
      for (const side of ['l', 'r', 't', 'b']) {
        const row = flagged.filter((m) => m.side === side);
        const vertical = side === 'l' || side === 'r';
        const at = (m: (typeof row)[number]) => (vertical ? m.my : m.mx);
        row.sort((a, b2) => at(a) - at(b2) || a.i - b2.i);
        const groups: (typeof row)[] = [];
        for (const m of row) {
          const g = groups[groups.length - 1];
          if (g && at(m) - at(g[g.length - 1]) < 36) g.push(m); else groups.push([m]);
        }
        for (const g of groups) {
          g.sort((a, b2) => a.i - b2.i);
          const mid = g.reduce((t, m) => t + at(m), 0) / g.length, max = (vertical ? H : W) - 18;
          const start = Math.max(18, Math.min(max - 36 * (g.length - 1), mid - 18 * (g.length - 1)));
          g.forEach((m, k) => { if (vertical) m.my = start + 36 * k; else m.mx = start + 36 * k; });
        }
      }
      for (const { i, el, sx, sy, mx, my, was } of flagged) {
        const g = glide[i] ?? (glide[i] = { x: mx, y: my });
        if (!was) { g.x = mx; g.y = my; }
        g.x += (mx - g.x) * .2; g.y += (my - g.y) * .2;
        el.style.transform = `translate(${g.x}px, ${g.y}px)`;
        // the drop's point turns toward the guest it stands for
        el.style.setProperty('--a', `${Math.atan2(sy - g.y, sx - g.x) * 180 / Math.PI + 90}deg`);
      }

      first = false;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Past minute 75 the plan lets go, and the stretch between the end of the clock (stop a) and the top of
  // the next section (stop b) is a gate rather than a page. The page's smooth scroll hands each wheel turn
  // here first, so the turn that would carry the page past 75 eases it to 75 instead and it stops there;
  // only a new turn, begun once the page rests at 75, glides on to the next section. Going up, the top of
  // the next section is the same kind of stop, and a new turn there glides back to 75. Touch, keys and
  // the scrollbar scroll freely and are carried on if they come to rest inside the stretch.
  useEffect(() => {
    const trackEl = trackRef.current, next = trackEl?.closest('section')?.nextElementSibling;
    if (!trackEl || !next) return;
    const stops = () => [scrollY + trackEl.getBoundingClientRect().bottom - innerHeight, scrollY + next.getBoundingClientRect().top] as const;
    const near = (y: number, s: number) => Math.abs(y - s) <= 2;
    const ease = (t: number) => (t < .5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
    let gliding = false, lastTurn = 0, last = scrollY, dir = 0, rest = 0;
    const glide = (to: number) => {
      const lenis = smooth();
      if (!lenis) { scrollTo({ top: to, behavior: 'smooth' }); return; }
      gliding = true;
      lenis.scrollTo(to, { duration: 1.1, easing: ease, lock: true, onComplete: () => { gliding = false; } });
    };

    const stopWheel = onWheelTurn(({ deltaY, event }) => {
      const lenis = smooth();
      if (!lenis || !(event instanceof WheelEvent)) return true;
      const now = performance.now(), fresh = now - lastTurn > 220;
      lastTurn = now;
      // the turn is the plan's: the page does not scroll for it
      const take = () => { if (event.cancelable) event.preventDefault(); return false; };
      if (gliding) return take();
      const [a, b] = stops(), to = lenis.targetScroll, at = lenis.scroll;
      if (deltaY > 0) {
        if (to < a - 1 && to + deltaY > a) { lenis.scrollTo(a); return take(); }
        if (to >= a - 1 && to < b - 1) { if (fresh && near(at, a) || at > a + 2) glide(b); return take(); }
      } else if (deltaY < 0) {
        if (to > b + 1 && to + deltaY < b) { lenis.scrollTo(b); return take(); }
        if (to > a + 1 && to <= b + 1) { if (fresh && near(at, b) || at < b - 2) glide(a); return take(); }
      }
      return true;
    });

    // anything else that comes to rest inside the stretch is taken on the way it was going
    const onScroll = () => {
      if (scrollY !== last) dir = Math.sign(scrollY - last);
      last = scrollY;
      clearTimeout(rest);
      rest = window.setTimeout(() => {
        const [a, b] = stops();
        if (!gliding && scrollY > a + 2 && scrollY < b - 2) glide(dir > 0 ? b : a);
      }, 200);
    };
    addEventListener('scroll', onScroll, { passive: true });
    return () => { stopWheel(); removeEventListener('scroll', onScroll); clearTimeout(rest); };
  }, []);

  const now = round.ways.map((w, i) => ({ ...w, ...whereAt(w.stays, minute, i) }));
  const loyly = now.some((w) => w.place === 'loyly');
  const note = noteAt(minute);
  const shownMinute = minute > round.minutes - .5 ? round.minutes : Math.floor(minute);

  return (
    <section className="plan" id="round">
      <div className="plan-head">
        <h2>{round.heading}</h2>
        <p>{round.text}</p>
      </div>

      <div className="plan-track" ref={trackRef}>
      <div className="plan-pin">
      <div className="plan-body">
        <div className="plan-cam" ref={camRef}>
        <svg className="plan-map" ref={svgRef} viewBox="0 0 1000 620" role="img" aria-label="Plan of the studio: reception, changing rooms, sauna, showers, four ice baths outside and the deck">
          {/* rooms; the tubs and the deck are outside, behind a fence rather than a wall */}
          <g className={`room room-sauna${loyly ? ' is-loyly' : ''}`}>
            <rect {...box(ROOM.sauna)} />
            {/* three tiers of bench along two walls, and the stove in the corner */}
            {[0, 1, 2].map((k) => <path key={k} d={`M${60 + k * 34} 290 V${60 + k * 34} H${400 - k * 34}`} className="bench" />)}
            <circle cx="375" cy="265" r="26" className="stove" />
            {[[-10, -8], [8, -10], [0, 6], [-12, 10], [12, 8]].map(([dx, dy], k) => <circle key={k} cx={375 + dx} cy={265 + dy} r="6" className="stone" />)}
            <text x="40" y="32">Sauna {placeTemp.sauna}°</text>
          </g>
          <g className="room room-rinse">
            <rect {...box(ROOM.rinse)} />
            <circle cx="470" cy="70" r="9" className="head" /><circle cx="530" cy="70" r="9" className="head" />
            {/* a slatted floor to stand on, and the towel rail by the way out to the tubs */}
            {Array.from({ length: 6 }, (_, k) => <line key={k} x1="456" x2="544" y1={190 + k * 14} y2={190 + k * 14} className="slat" />)}
            <line x1="548" x2="548" y1="240" y2="290" className="rail" />
            <text x="440" y="32">Showers</text>
          </g>
          <g className="room room-ice outdoor">
            <rect {...box(ROOM.ice)} />
            {/* four round tubs, one person each */}
            {[[650, 108], [760, 108], [650, 238], [760, 238]].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="36" className="tub" />)}
            <Tree x={890} y={95} r={44} />
            <Tree x={905} y={245} r={36} />
            <Tree x={835} y={292} r={18} />
            <text x="580" y="32">Ice baths {placeTemp.ice}°, outside</text>
          </g>
          <g className="room room-deck outdoor">
            <rect {...box(ROOM.deck)} />
            {Array.from({ length: 9 }, (_, k) => <line key={k} x1="440" x2="960" y1={390 + k * 19} y2={390 + k * 19} className="plank" />)}
            {/* a roof over the half with the counter, for the afternoon sun and the rain */}
            <rect x="648" y="378" width="304" height="174" className="roof" />
            {/* twelve seats, more than the bench holds, so nobody waits standing */}
            {Array.from({ length: 12 }, (_, k) => <rect key={k} x={470 + (k % 6) * 66} y={k < 6 ? 405 : 510} width="34" height="22" rx="4" className="seat" />)}
            <circle cx="680" cy="465" r="16" className="table" />
            {/* the counter: tea, coconut water and something to eat after the last round */}
            <rect x="880" y="392" width="52" height="150" rx="4" className="counter" />
            {[420, 450, 480].map((y) => <circle key={y} cx="906" cy={y} r="7" className="cup" />)}
            {[410, 460, 510].map((y) => <circle key={y} cx="860" cy={y + 8} r="8" className="stool" />)}
            <text x="440" y="362">Deck {placeTemp.deck}°</text>
            <text x="960" y="362" textAnchor="end">Tea and snack counter</text>
          </g>
          <g className="room room-reception">
            <rect {...box(ROOM.reception)} />
            {/* the desk where a booking's QR is scanned and towels are handed over: staff stand in the
                corner behind it, guests come up to its front from the street door */}
            <path d="M46 436 H114 V376" className="desk" />
            {/* the tablet on the desk that scans a booking's QR */}
            <rect x="62" y="428" width="22" height="16" rx="2" className="tablet" />
            <rect x="66" y="431" width="14" height="10" className="tablet-screen" />
            <text x="50" y="462" className="note">check in</text>
            <text x="40" y="362">Reception</text>
            <text x="96" y="592">Way in, from Soi Ari</text>
          </g>
          <g className="room room-lockers">
            <rect {...box(ROOM.lockers)} />
            {[184, 290, 332].map((x) => <rect key={x} x={x} y="385" width="34" height="46" className="locker" />)}
            {/* the WC sits in the changing rooms rather than a room of its own on the plan */}
            <rect x="300" y="488" width="66" height="58" rx="3" className="wc" />
            <ellipse cx="333" cy="526" rx="10" ry="13" className="wc-bowl" />
            <text x="312" y="505" className="wc-label">WC</text>
            <text x="170" y="362">Changing rooms</text>
          </g>

          {/* Two real doors, drawn as on an architect's plan: the way in from the street, and the sauna
              door, which is shut to keep the heat in. Every other way through is just a gap in the wall,
              and the tubs and the deck, being outside, have gaps in their fence. */}
          <Door hinge={[60, 560]} leaf={[0, -40]} shut={[40, 0]} sweep={1} />
          <Door hinge={[236, 310]} leaf={[0, -36]} shut={[36, 0]} sweep={1} />
          {[[150, 480, 150, 516], [170, 480, 170, 516], [236, 370, 272, 370], [420, 132, 420, 168], [440, 132, 440, 168],
            [560, 132, 560, 168], [580, 128, 580, 172], [748, 310, 792, 310], [748, 370, 792, 370], [440, 446, 440, 490]]
            .map(([x1, y1, x2, y2], k) => <line key={k} x1={x1} y1={y1} x2={x2} y2={y2} className="doorway" />)}

          {/* the one way round: in from the street, check in, change, sauna, showers, tubs, deck, and
              back to the sauna. No arrow runs through the swing of a door. */}
          <path className="route" d="M80 604 V572 M80 540 V498 H254 V322 M330 150 H604 M770 290 V392 M452 468 H410 V340 H268" />
          <path className="route-arrow" d={[up(80, 572), right(178, 498), up(254, 372), up(254, 322), right(432, 150), right(572, 150), right(604, 150), down(770, 392), left(268, 340)].join(' ')} />

          {/* the three ways, where they are now */}
          {now.map((w, i) => (
            <g key={w.id} className={`who${pick === i ? ' is-picked' : ''}`} ref={(el) => { dotRefs.current[i] = el; }}
              onClick={() => setPick(pick === i ? null : i)}>
              {/* a larger, invisible target for a finger */}
              <circle r="30" className="hit" />
              <circle r="13" />
              <text className="n" y="5" textAnchor="middle">{i + 1}</text>
            </g>
          ))}
        </svg>
        {now.map((w, i) => (
          <button key={w.id} type="button" className={`edge${pick === i ? ' is-picked' : ''}`} ref={(el) => { markRefs.current[i] = el; }} tabIndex={-1}
            aria-label={`Follow ${w.name}`} onClick={() => setPick(pick === i ? null : i)}>
            {/* the drop's round part is centred on the number and its point drawn at the top; the marker turns it toward the guest */}
            <svg viewBox="-17 -17 34 34" aria-hidden="true"><path d="M0 -21 C4 -14 12 -8 12 0 A12 12 0 0 1 -12 0 C-12 -8 -4 -14 0 -21 Z" /></svg>
            <b>{i + 1}</b>
          </button>
        ))}
        </div>

        <aside className="plan-now">
          <div className="clock"><b>{shownMinute}</b><span>of {round.minutes} min</span></div>
          <p className="plan-note">{note.text}</p>
          <p className="plan-hint"><span className="w">{round.hint.wide}</span><span className="n">{round.hint.narrow}</span></p>
          <ul>
            {now.map((w, i) => (
              <li key={w.id} className={[w.place === 'out' && 'is-gone', pick === i && 'is-picked'].filter(Boolean).join(' ') || undefined}>
                {/* tap to have the frame follow this guest; tap again to go back to the story */}
                <button type="button" aria-pressed={pick === i} onClick={() => setPick(pick === i ? null : i)}>
                  <i>{i + 1}</i>
                  <b>{w.name}</b>
                  <span>{w.note}</span>
                  <em>{placeName[w.place]}{w.place !== 'out' && ` · ${placeTemp[w.place]}°`}</em>
                </button>
              </li>
            ))}
          </ul>
        </aside>
      </div>
      </div>
      </div>
    </section>
  );
}

function box(r: Rect) {
  return { x: r.x, y: r.y, width: r.w, height: r.h, rx: 6 };
}

// a door on an architect's plan: `hinge` on the wall, the open `leaf`, the point it closes to on the
// wall (`shut`), and the arc it swings through between them
function Door({ hinge: [x, y], leaf: [lx, ly], shut: [sx, sy], sweep }: { hinge: [number, number]; leaf: [number, number]; shut: [number, number]; sweep: 0 | 1 }) {
  const r = Math.hypot(lx, ly);
  return (
    <g className="doorset">
      <line x1={x} y1={y} x2={x + sx} y2={y + sy} className="doorway" />
      <path d={`M${x} ${y} L${x + lx} ${y + ly} A${r} ${r} 0 0 ${sweep} ${x + sx} ${y + sy}`} className="door" />
    </g>
  );
}

// a tree as plans draw it from above: a scalloped crown, a few branches and the trunk at the centre
function Tree({ x, y, r }: { x: number; y: number; r: number }) {
  const n = 9;
  let d = '';
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2, b = ((i - .5) / n) * Math.PI * 2;
    const px = x + Math.cos(a) * r * .86, py = y + Math.sin(a) * r * .86;
    if (i === 0) d += `M${px.toFixed(1)} ${py.toFixed(1)}`;
    else d += ` Q${(x + Math.cos(b) * r * 1.12).toFixed(1)} ${(y + Math.sin(b) * r * 1.12).toFixed(1)} ${px.toFixed(1)} ${py.toFixed(1)}`;
  }
  return (
    <g className="tree">
      <path d={d} />
      {[0, 1, 2, 3, 4].map((k) => {
        const a = k * 1.3 + .4;
        return <line key={k} x1={x} y1={y} x2={x + Math.cos(a) * r * .55} y2={y + Math.sin(a) * r * .55} />;
      })}
      <circle cx={x} cy={y} r={2.5} />
    </g>
  );
}

const up = (x: number, y: number) => `M${x - 5} ${y + 6} l5 -6 5 6`;
const down = (x: number, y: number) => `M${x - 5} ${y - 6} l5 6 5 -6`;
const right = (x: number, y: number) => `M${x - 6} ${y - 5} l6 5 -6 5`;
const left = (x: number, y: number) => `M${x + 6} ${y - 5} l-6 5 6 5`;
