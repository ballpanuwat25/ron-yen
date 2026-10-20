import { placeName, placeTemp, round, type Place, type Stay } from '@/content/site';

// The studio from above, drawn in the page's thin cream line: reception, changing rooms, sauna, showers,
// the four tubs and the deck, with the one-way route through them. Three dots are the three ways to spend the
// time, each in the room it is in at `minute`. This is the still; scrolling will move the minute later.

type Rect = { x: number; y: number; w: number; h: number };
const ROOM: Record<'sauna' | 'rinse' | 'ice' | 'deck' | 'lockers' | 'reception', Rect> = {
  sauna: { x: 40, y: 40, w: 380, h: 270 },
  rinse: { x: 440, y: 40, w: 120, h: 270 },
  ice: { x: 580, y: 40, w: 380, h: 270 },
  deck: { x: 440, y: 370, w: 520, h: 190 },
  lockers: { x: 170, y: 370, w: 210, h: 190 },
  reception: { x: 40, y: 370, w: 110, h: 190 },
};

// where each way stands in a room, so the three dots never sit on one another
const SPOT: Record<Exclude<Place, 'loyly'>, [number, number][]> = {
  sauna: [[150, 120], [230, 120], [310, 120]],
  rinse: [[470, 110], [530, 110], [500, 200]],
  ice: [[650, 108], [760, 238], [650, 238]],
  deck: [[560, 465], [690, 495], [820, 465]],
  out: [[70, 500], [95, 530], [120, 500]],
};

// the same, on the portrait plan phones get
const SPOT_TALL: Record<Exclude<Place, 'loyly'>, [number, number][]> = {
  sauna: [[110, 405], [200, 435], [290, 405]],
  rinse: [[110, 540], [290, 540], [200, 552]],
  ice: [[70, 690], [330, 690], [150, 690]],
  deck: [[100, 870], [200, 905], [300, 870]],
  out: [[100, 112], [150, 122], [270, 112]],
};

function placeAt(stays: readonly Stay[], m: number): Place {
  let t = 0;
  for (const [place, mins] of stays) { t += mins; if (m < t) return place; }
  return stays[stays.length - 1][0];
}

export default function Plan({ minute = 11.5 }: { minute?: number }) {
  const now = round.ways.map((w, i) => {
    const place = placeAt(w.stays, minute);
    const spot = place === 'loyly' ? 'sauna' : place;
    const [x, y] = SPOT[spot][i];
    const [tx, ty] = SPOT_TALL[spot][i];
    return { ...w, place, x, y, tx, ty };
  });
  const loyly = now.some((w) => w.place === 'loyly');

  return (
    <section className="plan" id="round">
      <div className="plan-head">
        <h2>{round.heading}</h2>
        <p>{round.text}</p>
      </div>

      <div className="plan-body">
        <svg className="plan-map plan-wide" viewBox="0 0 1000 620" role="img" aria-label="Plan of the studio: reception, changing rooms, sauna, showers, four ice baths outside and the deck">
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
            <text x="96" y="592">Way in, from Soi Ari 7</text>
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
            <g key={w.id} className="who" transform={`translate(${w.x} ${w.y})`}>
              <circle r="13" />
              <text className="n" y="5" textAnchor="middle">{i + 1}</text>
            </g>
          ))}
        </svg>

        <TallPlan now={now} loyly={loyly} />

        <aside className="plan-now">
          <div className="clock"><b>{Math.floor(minute)}</b><span>of {round.minutes} min</span></div>
          <ul>
            {now.map((w, i) => (
              <li key={w.id}>
                <i>{i + 1}</i>
                <b>{w.name}</b>
                <span>{w.note}</span>
                <em>{placeName[w.place]}{w.place !== 'out' && ` · ${placeTemp[w.place]}°`}</em>
              </li>
            ))}
          </ul>
        </aside>
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

// Phones get the same studio redrawn in portrait, the rooms stacked in the order you walk through them,
// with only what the story needs: rooms, the two doors, the tubs, the route and the three dots.
function TallPlan({ now, loyly }: { now: { id: string; tx: number; ty: number }[]; loyly: boolean }) {
  const room = (y: number, h: number, extra = '') => <rect x="20" y={y} width="360" height={h} rx="6" className={`shell ${extra}`} />;
  return (
    <svg className="plan-map plan-tall" viewBox="0 0 400 990" role="img" aria-label="Plan of the studio, from the street door to the deck">
      <text x="20" y="22" className="lbl-sm">Way in, from Soi Ari 7</text>

      <g className="room room-reception">{room(40, 100)}<text x="34" y="68">Reception</text><text x="34" y="90" className="lbl-sm">check in, towels</text></g>
      <g className="room room-lockers">{room(170, 100)}<text x="34" y="198">Changing rooms</text><text x="34" y="220" className="lbl-sm">lockers, WC</text></g>
      <g className={`room room-sauna${loyly ? ' is-loyly' : ''}`}>{room(300, 170)}<text x="34" y="328">Sauna {placeTemp.sauna}°</text>
        <circle cx="340" cy="430" r="20" className="stove" /></g>
      <g className="room room-rinse">{room(500, 70)}<text x="34" y="526">Showers</text></g>
      <g className="room room-ice outdoor">{room(600, 160)}<text x="34" y="628">Ice baths {placeTemp.ice}°, outside</text>
        {[70, 150, 250, 330].map((x) => <circle key={x} cx={x} cy="690" r="30" className="tub" />)}</g>
      <g className="room room-deck outdoor">{room(790, 170)}<text x="34" y="818">Deck {placeTemp.deck}°, tea</text>
        <rect x="200" y="798" width="172" height="154" className="roof" /></g>

      {/* the street door and the sauna door; everything else is a gap */}
      <Door hinge={[180, 40]} leaf={[0, 36]} shut={[40, 0]} sweep={0} />
      <Door hinge={[180, 300]} leaf={[0, 36]} shut={[40, 0]} sweep={0} />
      {[[180, 140, 220, 140], [180, 170, 220, 170], [180, 270, 220, 270], [180, 470, 220, 470], [180, 500, 220, 500],
        [180, 570, 220, 570], [180, 600, 220, 600], [180, 760, 220, 760], [180, 790, 220, 790], [380, 860, 380, 900], [380, 370, 380, 410]]
        .map(([x1, y1, x2, y2], k) => <line key={k} x1={x1} y1={y1} x2={x2} y2={y2} className="doorway" />)}

      <path className="route" d="M200 28 V32 M200 84 V160 M200 186 V290 M200 344 V492 M200 516 V592 M200 624 V782 M372 880 H392 V390 H386" />
      <path className="route-arrow" d={[down(200, 32), down(200, 160), down(200, 290), down(200, 492), down(200, 592), down(200, 782), left(386, 390)].join(' ')} />

      {now.map((w, i) => (
        <g key={w.id} className="who" transform={`translate(${w.tx} ${w.ty})`}>
          <circle r="15" />
          <text className="n" y="6" textAnchor="middle">{i + 1}</text>
        </g>
      ))}
    </svg>
  );
}
