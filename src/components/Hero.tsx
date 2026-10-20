'use client';
/* eslint-disable @next/next/no-img-element -- the glass is painted from these plain images, and the wall's glass is cut with a mask */

import { useEffect, useRef } from 'react';
import { heroWall } from '@/content/hero-wall';
import { hero, nav, studio } from '@/content/site';
import { mountHeroGlass } from '@/lib/glass';
import { whenOpen } from '@/lib/opening';

// The first view is the sauna itself: its wall, the bench and the light under it, and a window in the
// wall onto the ice bath outside, fogged over. Wiping the glass clears it to the ice. The wall is a
// picture with its glass cut out along four straight edges; the fogged view sits behind it, placed
// where the glass falls once the picture is cropped to the screen.

type Wall = (typeof heroWall)[keyof typeof heroWall];

// a mask the size of the wall picture: all wall, with the glass cut out. It is cropped with the
// picture (mask-size: cover at the same position), so its edges stay sharp at any size.
const cutOut = (wall: Wall) => {
  const glass = wall.hole.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ') + 'Z';
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${wall.width}' height='${wall.height}' viewBox='0 0 ${wall.width} ${wall.height}'><path fill-rule='evenodd' d='M0 0H${wall.width}V${wall.height}H0Z ${glass}'/></svg>`;
  const url = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  return { maskImage: url, WebkitMaskImage: url };
};

// the view through the glass: the ice, and the same ice blurred and veiled as condensation
const ICE = { base: '#9aa7b0', fog: 'grayscale(.3) brightness(1.15)', blur: 16, veil: 'rgba(230, 240, 248, .32)' };

export default function Hero() {
  const heroRef = useRef<HTMLElement>(null), paneRef = useRef<HTMLDivElement>(null), iceRef = useRef<HTMLImageElement>(null);
  const fogRef = useRef<HTMLCanvasElement>(null), steamRef = useRef<HTMLCanvasElement>(null), sayRef = useRef<HTMLParagraphElement>(null);
  const wideRef = useRef<HTMLImageElement>(null), tallRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const [el, pane, ice, fog, steam, wide, tall] = [heroRef.current, paneRef.current, iceRef.current, fogRef.current, steamRef.current, wideRef.current, tallRef.current];
    if (!el || !pane || !ice || !fog || !steam || !wide || !tall) return;
    if (matchMedia('(pointer: coarse)').matches && sayRef.current) sayRef.current.textContent = hero.wipe.touch;

    // Put the glass behind the wall's window, measured from the wall picture on screen: which of the two
    // is showing, its size, and where object-fit and object-position crop it.
    const place = () => {
      const img = wide.offsetParent ? wide : tall.offsetParent ? tall : null;
      if (!img || !img.clientWidth || !img.clientHeight) return;
      const wall = img === wide ? heroWall.wide : heroWall.tall;
      const [fx, fy] = getComputedStyle(img).objectPosition.split(' ').map((v) => parseFloat(v) / 100);
      const s = Math.max(img.clientWidth / wall.width, img.clientHeight / wall.height);
      const ox = (img.clientWidth - wall.width * s) * fx, oy = (img.clientHeight - wall.height * s) * fy, pad = 6;
      const [x0, y0, x1, y1] = wall.glass;
      Object.assign(pane.style, { left: `${ox + x0 * s - pad}px`, top: `${oy + y0 * s - pad}px`, width: `${(x1 - x0) * s + pad * 2}px`, height: `${(y1 - y0) * s + pad * 2}px` });
    };
    place();
    const watch = new ResizeObserver(place);
    watch.observe(el);

    const paintFog = (g: CanvasRenderingContext2D, w: number, h: number) => {
      const k = Math.max(w / ice.naturalWidth, h / ice.naturalHeight) * 1.06;
      g.fillStyle = ICE.base; g.fillRect(0, 0, w, h);
      g.filter = `blur(${ICE.blur * (w / pane.clientWidth)}px) ${ICE.fog}`;
      g.drawImage(ice, (w - ice.naturalWidth * k) / 2, (h - ice.naturalHeight * k) / 2, ice.naturalWidth * k, ice.naturalHeight * k);
      g.filter = 'none';
      g.fillStyle = ICE.veil; g.fillRect(0, 0, w, h);
    };
    let unmount: (() => void) | undefined;
    const start = () => { unmount = mountHeroGlass({ hero: el, pane, fog, steam, photo: ice, paintFog, whenSeen: whenOpen }); };
    if (ice.complete && ice.naturalWidth) start(); else ice.addEventListener('load', start, { once: true });
    return () => { watch.disconnect(); ice.removeEventListener('load', start); unmount?.(); };
  }, []);

  return (
    <section className="hero" id="top" ref={heroRef}>
      <div className="hero-glass" ref={paneRef}>
        <img ref={iceRef} src={hero.window.src} alt={hero.window.alt} />
        <canvas ref={fogRef} aria-hidden="true" />
      </div>
      {/* the wall for wide screens and the wall for phones, each with its glass cut out */}
      <div className="hero-wall">
        <img ref={wideRef} className="hero-wall-wide" src={heroWall.wide.src} alt="" style={cutOut(heroWall.wide)} />
        <img ref={tallRef} className="hero-wall-tall" src={heroWall.tall.src} alt="" style={cutOut(heroWall.tall)} />
      </div>
      <div className="hero-shade" />
      <canvas className="hero-steam" ref={steamRef} aria-hidden="true" />

      <header className="hero-top">
        {/* the Thai mark alone, as Saeng House's header carries only แสง; the gloss waits for the footer */}
        <a className="mark" href="#top" lang="th" aria-label={studio.name}>{studio.wordmark}</a>
        <nav aria-label="Sections">
          {nav.map((n) => <a key={n.href} href={n.href}>{n.label}</a>)}
        </nav>
        <a className="book" href="#book">{hero.book}</a>
      </header>

      <div className="hero-copy">
        <p className="hero-kicker">{hero.kicker}</p>
        <h1>{hero.headline[0]}<br /><em>{hero.headline[1]}</em></h1>
        <p className="hero-text">{hero.text}</p>
        <a className="hero-book" href="#book">{hero.book}</a>
      </div>
      <p className="hero-say" ref={sayRef}>{hero.wipe.mouse}</p>
    </section>
  );
}
