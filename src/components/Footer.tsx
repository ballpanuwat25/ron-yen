'use client';

import { useEffect, useRef } from 'react';
import { ariMap } from '@/content/ari-map';
import { findUs, foot, hero, studio } from '@/content/site';

// The foot of the page signs off the way people do in a sauna: the name written with a finger on the
// steamed-up window. The pane is fogged all over; where the letters are written it clears, ร้อน onto the
// ember of the sauna and เย็น onto the ice outside, and once written the letters start to drip. It is
// written as the footer arrives (with reduced motion it is simply there). A wide screen writes the two
// words side by side; a phone writes them one above the other on a taller pane.

type Pt = readonly [number, number];
type Layout = {
  id: string; w: number; h: number; size: number;
  // each word: where it sits, how it is anchored, and the part of the pane its view fills
  words: readonly { at: Pt; anchor: 'start' | 'middle' | 'end'; view: readonly [number, number, number, number] }[];
  dot?: Pt;
  // where each drip runs from and how far it runs: from inside the foot of a stroke, measured from the
  // font where the letters meet the baseline, so every drip hangs from a letter
  drips: readonly (readonly [number, number, number])[];
};

const WIDE: Layout = {
  id: 'wide', w: 1200, h: 380, size: 236,
  words: [
    { at: [566, 282], anchor: 'end', view: [0, 0, 600, 380] },
    { at: [634, 282], anchor: 'start', view: [600, 0, 600, 380] },
  ],
  dot: [600, 220],
  drips: [[362, 270, 70], [538, 270, 100], [680, 270, 82], [949, 270, 58]],
};
const TALL: Layout = {
  id: 'tall', w: 600, h: 620, size: 220,
  words: [
    { at: [300, 262], anchor: 'middle', view: [0, 0, 600, 310] },
    { at: [300, 548], anchor: 'middle', view: [0, 310, 600, 310] },
  ],
  drips: [[286, 250, 44], [450, 250, 34], [183, 536, 56], [434, 536, 44]],
};

const photo = [hero.stones.src, hero.window.src];

function Pane({ l }: { l: Layout }) {
  const id = (s: string) => `foot-${l.id}-${s}`;
  return (
    <svg className={`steam steam-${l.id}`} viewBox={`0 0 ${l.w} ${l.h}`} role="img" aria-label={`${studio.wordmark}, ${studio.wordmarkGloss}`}>
      <defs>
        {/* the hero's duotones, the sauna in ember and the ice in the cold blue; the clear view is the
            brighter of the two, as glass is once the fog is wiped off */}
        <filter id={id('ember')} colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values=".30 1.0 .10 0 0  .105 .353 .035 0 0  .036 .122 .012 0 0  0 0 0 1 0" />
        </filter>
        <filter id={id('ice')} colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values=".157 .525 .053 0 0  .221 .742 .074 0 0  .266 .894 .090 0 0  0 0 0 1 0" />
        </filter>
        <filter id={id('fog')} colorInterpolationFilters="sRGB"><feGaussianBlur stdDeviation="16" /></filter>
        <linearGradient id={id('edge')}>
          <stop offset="0" stopColor="#000" stopOpacity="0" />
          <stop offset=".06" stopColor="#000" />
        </linearGradient>
        {/* what the finger has written so far: the letters, uncovered from left to right, then the drips */}
        <mask id={id('written')} maskUnits="userSpaceOnUse" x="0" y="0" width={l.w} height={l.h}>
          {l.words.map((w, i) => (
            <text key={i} className="steam-word" style={{ fontSize: l.size }} x={w.at[0]} y={w.at[1]} textAnchor={w.anchor} lang="th" fill="#fff">{foot.words[i]}</text>
          ))}
          {l.dot && <circle cx={l.dot[0]} cy={l.dot[1]} r="15" fill="#fff" />}
          <rect className="steam-hand" x="-80" y="0" width={l.w + 160} height={l.h} fill={`url(#${id('edge')})`} />
          {l.drips.map(([x, y, len], i) => (
            <g key={i} className="steam-drip" style={{ animationDelay: `${2.1 + i * .35}s`, ['--run' as string]: `${len}px` }}>
              <line x1={x} y1={y} x2={x} y2={y + len} pathLength={1} stroke="#fff" strokeWidth="5" strokeLinecap="round" />
              <circle cx={x} cy={y} r="5.5" fill="#fff" />
            </g>
          ))}
        </mask>
        <clipPath id={id('pane')}><rect width={l.w} height={l.h} rx="22" /></clipPath>
      </defs>

      <g clipPath={`url(#${id('pane')})`}>
        {/* the fogged pane: both views, blurred and veiled */}
        <g filter={`url(#${id('fog')})`}>
          {l.words.map(({ view }, i) => {
            // run past the pane's own edges so the blur does not fade there, but meet the other view
            // exactly where the two halves meet
            const [x, y, w, h] = view, out = 40;
            const x0 = x === 0 ? -out : x, y0 = y === 0 ? -out : y;
            const x1 = x + w === l.w ? l.w + out : x + w, y1 = y + h === l.h ? l.h + out : y + h;
            return <image key={i} href={photo[i]} x={x0} y={y0} width={x1 - x0} height={y1 - y0} preserveAspectRatio="xMidYMid slice" filter={`url(#${id(i ? 'ice' : 'ember')})`} />;
          })}
        </g>
        <rect width={l.w} height={l.h} className="steam-veil" />
        {/* and where it has been written, the same views seen clearly */}
        <g mask={`url(#${id('written')})`}>
          {l.words.map(({ view: [x, y, w, h] }, i) => (
            <image key={i} href={photo[i]} x={x} y={y} width={w} height={h} preserveAspectRatio="xMidYMid slice" filter={`url(#${id(i ? 'ice' : 'ember')})`} />
          ))}
        </g>
      </g>
      <rect width={l.w} height={l.h} rx="22" className="steam-frame" />
    </svg>
  );
}

export default function Footer() {
  const panes = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = panes.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      el.classList.add('is-written');
      io.disconnect();
    }, { rootMargin: '0px 0px -20% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <footer className="foot">
      <div className="steam-panes" ref={panes}>
        <Pane l={WIDE} />
        <Pane l={TALL} />
      </div>
      <p className="steam-gloss">{studio.wordmarkGloss}</p>

      <div className="foot-cols">
        <p><strong>{studio.name}</strong>{findUs.address.map((a) => <span key={a}>{a}</span>)}</p>
        <p><strong>{foot.hours}</strong>{findUs.hours.map((h) => <span key={h.days}>{h.days} {h.time}</span>)}<span>LINE {findUs.line}</span></p>
        <p><strong>{findUs.station}</strong><span>{ariMap.walk.minutes} minutes on foot</span><a className="foot-top" href="#top">{foot.top}</a></p>
      </div>
      <p className="foot-note">{foot.note}</p>
    </footer>
  );
}
