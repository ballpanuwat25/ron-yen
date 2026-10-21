'use client';

import { useEffect, useState } from 'react';
import { hero, nav, studio } from '@/content/site';
import { nextSession } from '@/lib/bangkok';

// Once the hero has scrolled away, a plain bar follows down the page: the mark, the sections, and the
// next session to start, by the studio's clock, beside the button to the times.
export default function Header() {
  const [shown, setShown] = useState(false);
  const [next, setNext] = useState<ReturnType<typeof nextSession> | null>(null);
  useEffect(() => {
    const heroEl = document.querySelector('.hero');
    if (!heroEl) return;
    const io = new IntersectionObserver(([e]) => setShown(!e.isIntersecting), { rootMargin: '-80px 0px 0px 0px' });
    io.observe(heroEl);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    const read = () => setNext(nextSession());
    read();
    const id = window.setInterval(read, 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className={`bar${shown ? ' is-shown' : ''}`} aria-hidden={!shown}>
      <a className="mark" href="#" lang="th" aria-label={studio.name} tabIndex={shown ? 0 : -1}>{studio.wordmark}</a>
      <nav aria-label="Sections">
        {nav.map((n) => <a key={n.href} href={n.href} tabIndex={shown ? 0 : -1}>{n.label}</a>)}
      </nav>
      <a className="bar-book" href="#book" tabIndex={shown ? 0 : -1}>
        {next && <span className="bar-next">{next.today ? 'Next' : 'Tomorrow'} {next.time}</span>}
        <b>{hero.book}</b>
      </a>
    </header>
  );
}
