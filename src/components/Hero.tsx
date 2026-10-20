'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';
import { hero, nav, studio } from '@/content/site';
import { demoNow, upcoming } from '@/content/demo';
import { mountHeroGlass } from '@/lib/glass';
import Seats from './Seats';

// The sauna fills the page in one hot ink; the only cold place is the window on the right, fogged
// over, which you wipe to see the ice bath outside. The reading on the left follows how much ice shows.
export default function Hero() {
  const heroRef = useRef<HTMLElement>(null);
  const paneRef = useRef<HTMLDivElement>(null);
  const fogRef = useRef<HTMLCanvasElement>(null);
  const steamRef = useRef<HTMLCanvasElement>(null);
  const saunaRef = useRef<HTMLImageElement>(null);
  const readingRef = useRef<HTMLDivElement>(null);
  const degRef = useRef<HTMLSpanElement>(null);
  const whereRef = useRef<HTMLDivElement>(null);
  const sayRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const [el, pane, fog, steam, sauna] = [heroRef.current, paneRef.current, fogRef.current, steamRef.current, saunaRef.current];
    if (!el || !pane || !fog || !steam || !sauna) return;
    if (matchMedia('(pointer: coarse)').matches && sayRef.current) sayRef.current.textContent = hero.wipe.touch;

    // the reading is written straight into the page every frame, not through React state
    const onReading = ({ degrees, cleared }: { degrees: number; cleared: number }) => {
      if (degRef.current) degRef.current.textContent = String(Math.round(degrees));
      readingRef.current?.classList.toggle('cold', degrees < 45);
      if (whereRef.current) whereRef.current.textContent = degrees > 60 ? hero.where.hot : degrees > 20 ? hero.where.between : hero.where.cold;
      if (sayRef.current) sayRef.current.style.opacity = cleared > .05 ? '0' : '1';
    };

    let unmount: (() => void) | undefined;
    const start = () => { unmount = mountHeroGlass({ hero: el, pane, fog, steam, sauna, onReading }); };
    if (sauna.complete && sauna.naturalWidth) start();
    else sauna.addEventListener('load', start, { once: true });
    return () => { sauna.removeEventListener('load', start); unmount?.(); };
  }, []);

  return (
    <section className="hero" id="top" ref={heroRef}>
      <picture className="hero-base">
        <source media="(max-width: 860px)" srcSet={hero.sauna.tall.src} />
        <img ref={saunaRef} src={hero.sauna.wide.src} alt="" width={hero.sauna.wide.width} height={hero.sauna.wide.height} />
      </picture>
      <div className="hero-vignette" />
      <canvas className="hero-steam" ref={steamRef} aria-hidden="true" />

      <header className="hero-top">
        {/* the Thai mark alone, as Saeng House's header carries only แสง; the gloss waits for the footer */}
        <a className="mark" href="#" lang="th" aria-label={studio.name}>{studio.wordmark}</a>
        <nav aria-label="Sections">
          {nav.map((n) => <a key={n.href} href={n.href}>{n.label}</a>)}
        </nav>
        <a className="book" href="#book">{hero.book}</a>
      </header>

      <div className="hero-grid">
        <div className="hero-info">
          <div>
            <span className="kicker">{demoNow.day.label}</span>
            <ul className="today">
              {upcoming.map((s) => (
                <li key={s.time}>
                  <time>{s.time}</time>
                  {s.kind === 'private' ? <span className="seats" /> : <Seats taken={s.taken} />}
                  <span className="left">{s.kind === 'private' ? 'Private, up to six' : s.taken >= 10 ? 'Full, join the waitlist' : `${10 - s.taken} of 10 left`}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="reading" ref={readingRef} aria-live="off">
            <div className="num"><span ref={degRef}>{studio.sauna.temp}</span><sup>°C</sup></div>
            <div className="where" ref={whereRef}>{hero.where.hot}</div>
          </div>
        </div>

        <div className="hero-view">
          <div className="pane" ref={paneRef}>
            <div className="coldprint"><Image src={hero.window.src} alt={hero.window.alt} fill sizes="(max-width: 860px) 100vw, 60vw" /></div>
            <canvas ref={fogRef} aria-hidden="true" />
          </div>
          <span className="say" ref={sayRef}>{hero.wipe.mouse}</span>
        </div>
      </div>

      <div className="hero-foot">
        <h1>{hero.headline[0]}<br /><em>{hero.headline[1]}</em></h1>
        <p>{hero.text}</p>
      </div>
    </section>
  );
}
