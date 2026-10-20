'use client';

import { useEffect, useRef, useState } from 'react';
import { loader, studio } from '@/content/site';
import { markOpen } from '@/lib/opening';
import { smooth } from '@/lib/smooth';

// The loading screen is the sauna heating up: in the dark, the dot of the studio's name and a reading
// that climbs from the 3° of the ice bath to the 88° of the bench as the first view's pictures and
// fonts arrive, with the stove's light rising from the floor. At 88° it opens onto the page. It is in
// the server's HTML, so it covers the page from the first frame; a fast connection still sees it heat
// for a moment, and a slow one reaches 88° the moment everything is in.

const COLD = studio.iceBath.temp, HOT = studio.sauna.temp;
const MIN_MS = 1400;     // the shortest heat-up, so it is seen at all
const MAX_MS = 8000;     // after this it opens whatever is still loading
const FADE_MS = 900;

export default function Loader() {
  const [phase, setPhase] = useState<'heating' | 'ready' | 'opening' | 'done'>('heating');
  const box = useRef<HTMLDivElement>(null), deg = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const minMs = reduced ? 300 : MIN_MS;
    smooth()?.stop();

    // what the first view needs: the glass's view of the ice, the wall picture showing, and the fonts
    const shown = [...document.querySelectorAll<HTMLImageElement>('.hero img')].filter((img) => img.offsetParent);
    const waits: Promise<unknown>[] = [
      ...shown.map((img) => (img.complete ? Promise.resolve() : new Promise((done) => { img.addEventListener('load', done, { once: true }); img.addEventListener('error', done, { once: true }); }))),
      document.fonts.ready,
    ];
    let loaded = 0;
    waits.forEach((w) => w.then(() => { loaded++; }));

    const born = performance.now();
    let heat = 0, raf = 0, opened = false;
    const open = () => {
      if (opened) return;
      opened = true;
      cancelAnimationFrame(raf);
      if (deg.current) deg.current.textContent = String(HOT);
      el.style.setProperty('--heat', '1');
      setPhase('ready');
      window.setTimeout(() => { setPhase('opening'); smooth()?.start(); markOpen(); }, reduced ? 0 : 450);
    };
    const frame = (now: number) => {
      const t = now - born;
      // never faster than minMs; on a slow connection the real progress holds it back
      const goal = Math.min(loaded / waits.length, t / minMs);
      heat += (goal - heat) * .14;
      if (goal - heat < .002) heat = goal;
      if (deg.current) deg.current.textContent = String(Math.round(COLD + (HOT - COLD) * heat));
      el.style.setProperty('--heat', heat.toFixed(3));
      if (heat >= 1 || t > MAX_MS) { open(); return; }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    // animation frames can be paused (a background tab, power saving); this opens it all the same
    const late = window.setTimeout(open, MAX_MS + 500);
    Promise.all(waits).then(() => window.setTimeout(open, Math.max(0, minMs - (performance.now() - born)) + 600));
    return () => { cancelAnimationFrame(raf); clearTimeout(late); smooth()?.start(); };
  }, []);

  useEffect(() => {
    if (phase !== 'opening') return;
    const id = window.setTimeout(() => setPhase('done'), FADE_MS);
    return () => clearTimeout(id);
  }, [phase]);

  if (phase === 'done') return null;
  return (
    <div ref={box} className={`loader${phase === 'opening' ? ' is-open' : ''}`} role="status" aria-live="polite">
      <div className="loader-glow" aria-hidden="true" />
      <div className="loader-read">
        <svg className="loader-dot" viewBox="-14 -14 28 28" aria-hidden="true">
          <circle r="14" className="ring" />
          <path d="M0 -10.5A10.5 10.5 0 0 0 0 10.5Z" className="hot" />
          <path d="M0 -10.5A10.5 10.5 0 0 1 0 10.5Z" className="cold" />
        </svg>
        <p className="loader-deg"><span ref={deg}>{COLD}</span>°</p>
        <p className="loader-say">{phase === 'heating' ? loader.heating : loader.ready}</p>
      </div>
    </div>
  );
}
