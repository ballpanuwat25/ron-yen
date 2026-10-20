'use client';

import { useEffect, useState } from 'react';
import { hero, nav, studio } from '@/content/site';
import { nextOpen } from '@/content/demo';
import Seats from './Seats';

// Once the hero has scrolled away, a plain bar follows down the page: the mark, the sections, and the
// next session with places left beside the button that books it.
export default function Header() {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const heroEl = document.querySelector('.hero');
    if (!heroEl) return;
    const io = new IntersectionObserver(([e]) => setShown(!e.isIntersecting), { rootMargin: '-80px 0px 0px 0px' });
    io.observe(heroEl);
    return () => io.disconnect();
  }, []);

  const left = 10 - nextOpen.taken;
  return (
    <header className={`bar${shown ? ' is-shown' : ''}`} aria-hidden={!shown}>
      <a className="mark" href="#" lang="th" aria-label={studio.name} tabIndex={shown ? 0 : -1}>{studio.wordmark}</a>
      <nav aria-label="Sections">
        {nav.map((n) => <a key={n.href} href={n.href} tabIndex={shown ? 0 : -1}>{n.label}</a>)}
      </nav>
      <a className="bar-book" href="#book" tabIndex={shown ? 0 : -1}>
        <span className="bar-next">
          <span>Next {nextOpen.time}</span>
          <Seats taken={nextOpen.taken} />
          <span className="bar-left">{left} left</span>
        </span>
        <b>{hero.book}</b>
      </a>
    </header>
  );
}
