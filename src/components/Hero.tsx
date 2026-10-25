'use client';
/* eslint-disable @next/next/no-img-element -- the room is a plain print, and the glass is painted from a plain image */

import { useEffect, useRef } from 'react';
import { hero, nav, studio } from '@/content/site';
import { mountHeroGlass } from '@/lib/glass';
import { whenOpen } from '@/lib/opening';

// The first view is the sauna, printed in ember and ruled along its own lines: the two edges of the back
// wall and the top of the benches, where the rule is also a thermometer from 88° to 3°. The one cold thing
// in the room is a long low window in the back wall onto the ice, fogged, which the visitor wipes clear.

// the room's lines and the window, as fractions of the source photo; the window is narrower on a phone
const ROOM = { w: 7008, h: 4672, wallL: .168, wallR: .832, bench: .51 };
const GLASS = { wide: [.27, .29, .73, .375], tall: [.385, .29, .615, .345] };
// each crop is the source cut to its size about the middle (scripts/export-photos.py)
const SHOTS = { wide: { w: 2400, h: 1600 }, tall: { w: 1440, h: 2560 } };

// the view through the glass: the ice, and the same ice blurred and veiled as condensation
const ICE = { base: '#6f8ea3', fog: 'brightness(1.2)', blur: 16, veil: 'rgba(225, 240, 250, .3)' };

const TICKS = Array.from({ length: 18 }, (_, i) => 88 - i * 5);
const tick = (t: number) => `${((88 - t) / 85) * 100}%`;

export default function Hero() {
  const heroRef = useRef<HTMLElement>(null), windowRef = useRef<HTMLDivElement>(null), paneRef = useRef<HTMLDivElement>(null);
  const iceRef = useRef<HTMLImageElement>(null), fogRef = useRef<HTMLCanvasElement>(null), steamRef = useRef<HTMLCanvasElement>(null);
  const wideRef = useRef<HTMLImageElement>(null), tallRef = useRef<HTMLImageElement>(null), sayRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const [el, win, pane, ice, fog, steam, wide, tall] = [heroRef.current, windowRef.current, paneRef.current, iceRef.current, fogRef.current, steamRef.current, wideRef.current, tallRef.current];
    if (!el || !win || !pane || !ice || !fog || !steam || !wide || !tall) return;
    if (matchMedia('(pointer: coarse)').matches && sayRef.current) sayRef.current.textContent = hero.wipe.touch;

    // where a point of the source photo lands on screen, through the crop and object-fit: cover
    const place = () => {
      const img = wide.offsetParent ? wide : tall;
      if (!img.clientWidth) return;
      const shot = img === wide ? SHOTS.wide : SHOTS.tall;
      const k = Math.min(ROOM.w / shot.w, ROOM.h / shot.h);
      const cx = (ROOM.w - shot.w * k) / 2, cy = (ROOM.h - shot.h * k) / 2;
      const s = Math.max(img.clientWidth / shot.w, img.clientHeight / shot.h);
      const ox = (img.clientWidth - shot.w * s) / 2, oy = (img.clientHeight - shot.h * s) / 2;
      const X = (f: number) => ox + (f * ROOM.w - cx) / k * s, Y = (f: number) => oy + (f * ROOM.h - cy) / k * s;
      el.style.setProperty('--wall-l', `${X(ROOM.wallL)}px`);
      el.style.setProperty('--wall-r', `${X(ROOM.wallR)}px`);
      el.style.setProperty('--bench', `${Y(ROOM.bench)}px`);
      const [x0, y0, x1, y1] = img === wide ? GLASS.wide : GLASS.tall;
      Object.assign(win.style, { left: `${X(x0)}px`, top: `${Y(y0)}px`, width: `${X(x1) - X(x0)}px`, height: `${Y(y1) - Y(y0)}px` });
    };
    place();
    const watch = new ResizeObserver(place);
    watch.observe(el);

    const paintFog = (g: CanvasRenderingContext2D, w: number, h: number, dpr: number) => {
      const k = Math.max(w / ice.naturalWidth, h / ice.naturalHeight) * 1.06;
      g.fillStyle = ICE.base; g.fillRect(0, 0, w, h);
      g.filter = `blur(${ICE.blur * (w / pane.clientWidth)}px) ${ICE.fog}`;
      g.drawImage(ice, (w - ice.naturalWidth * k) / 2, (h - ice.naturalHeight * k) / 2, ice.naturalWidth * k, ice.naturalHeight * k);
      g.filter = 'none';
      g.fillStyle = ICE.veil; g.fillRect(0, 0, w, h);
      // the drops on the glass, rendered as water in Blender (scripts/build-glass-drops.py): the same size on
      // any screen, a drop's pixel to about a quarter of a CSS pixel, and cropped to the glass
      if (!drops.naturalWidth) return;
      const d = Math.max(w / drops.naturalWidth, h / drops.naturalHeight, dpr * .28);
      g.drawImage(drops, (w - drops.naturalWidth * d) / 2, (h - drops.naturalHeight * d) / 2, drops.naturalWidth * d, drops.naturalHeight * d);
    };
    const drops = new Image();
    drops.src = hero.window.drops;
    let unmount: (() => void) | undefined, gone = false;
    // the glass starts once both pictures it is painted from are in; the steam is thin, since the room is
    // the picture and the window the one thing to touch
    Promise.all([ice.decode(), drops.decode()].map((p) => p.catch(() => {}))).then(() => {
      if (!gone) unmount = mountHeroGlass({ hero: el, pane, fog, steam, photo: ice, paintFog, whenSeen: whenOpen, heat: .4 });
    });
    return () => { gone = true; watch.disconnect(); unmount?.(); };
  }, []);

  return (
    <section className="hero" id="top" ref={heroRef}>
      <img ref={wideRef} className="hero-room hero-room-wide" src={hero.room.wide} alt={hero.room.alt} />
      <img ref={tallRef} className="hero-room hero-room-tall" src={hero.room.tall} alt="" />
      <canvas className="hero-steam" ref={steamRef} aria-hidden="true" />
      <div className="hero-rules" aria-hidden="true"><i className="hero-rule-top" /><i className="hero-rule-l" /><i className="hero-rule-r" /><i className="hero-rule-bench" /></div>
      <div className="hero-scale" aria-hidden="true">{TICKS.map((t) => <i key={t} style={{ left: tick(t) }} />)}</div>

      <header className="hero-top">
        {/* the Thai mark alone, as Saeng House's header carries only แสง; the gloss waits for the footer */}
        <a className="mark" href="#top" lang="th" aria-label={studio.name}>{studio.wordmark}</a>
        <nav aria-label="Sections">
          {nav.map((n) => <a key={n.href} href={n.href}>{n.label}</a>)}
        </nav>
        <a className="book" href="#book">{hero.book}</a>
      </header>

      <p className="hero-hot"><span>{studio.sauna.temp}°</span>{hero.hot}</p>
      {/* on a phone the two readings pair up at the top, and the glass carries no words */}
      <p className="hero-hot hero-pair" aria-hidden="true"><span>{studio.iceBath.temp}°</span>{hero.cold}</p>
      <p className="hero-where">{studio.area}, Bangkok<br />{hero.opens}</p>
      <div className="hero-window" ref={windowRef}>
        <div className="hero-glass" ref={paneRef}>
          <img ref={iceRef} src={hero.window.src} alt={hero.window.alt} />
          <canvas ref={fogRef} aria-hidden="true" />
        </div>
        <p className="hero-cold"><span>{studio.iceBath.temp}°</span>{hero.cold}</p>
      </div>

      <div className="hero-copy">
        <h1>{hero.headline[0]}<br />{hero.headline[1]}</h1>
        <div className="hero-side">
          <p>{hero.text}</p>
          <a className="hero-book" href="#book">{hero.book}</a>
          <p className="hero-say" ref={sayRef}>{hero.wipe.mouse}</p>
        </div>
      </div>
    </section>
  );
}
