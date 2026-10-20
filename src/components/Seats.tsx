// A session's ten seats as ten drops, filled for each one taken: the studio's drop at icon size.
export const DROP = 'M9 1 C9 1 2 10 2 15.2 A7 7 0 0 0 16 15.2 C16 10 9 1 9 1 Z';

export default function Seats({ taken, of = 10 }: { taken: number; of?: number }) {
  return (
    <span className="seats" aria-hidden="true">
      {Array.from({ length: of }, (_, i) => (
        <svg key={i} viewBox="0 0 18 24">
          <path d={DROP} className={i < taken ? 'taken' : undefined} />
        </svg>
      ))}
    </span>
  );
}
