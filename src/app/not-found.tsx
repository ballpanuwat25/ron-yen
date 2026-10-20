import type { Metadata } from 'next';
import Link from 'next/link';
import { lost, studio } from '@/content/site';

// Any address the site does not have: an empty locker. The locker tag from the booking, hung on its hook
// by the cord through its hole, with 404 for the locker's number, and the way back.

export const metadata: Metadata = { title: `Not here · ${studio.name}`, robots: { index: false } };

export default function NotFound() {
  return (
    <main className="lost">
      <Link className="mark lost-mark" href="/" lang="th" aria-label={studio.name}>{studio.wordmark}</Link>
      <div className="lost-hang">
        <span className="lost-hook" aria-hidden="true" />
        <span className="lost-cord" aria-hidden="true" />
        <div className="lost-tag">
          <span className="lost-hole" aria-hidden="true" />
          <p className="lost-no"><small>{lost.tag}</small>404</p>
          <h1>{lost.heading}</h1>
          <p className="lost-text">{lost.text}</p>
          <div className="lost-act">
            <Link className="lost-home" href="/">{lost.home}</Link>
            <Link className="lost-book" href="/#book">{lost.book}</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
