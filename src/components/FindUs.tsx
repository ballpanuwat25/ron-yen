import { ariMap } from '@/content/ari-map';
import { findUs } from '@/content/site';

// Where the studio is, as the walk from BTS Ari in three steps beside a map cropped to that walk. The
// streets come from OpenStreetMap; the walk is routed along them, and its legs (the metres on the map
// and in the steps) are measured from that route by scripts/build-map.mjs.

type Pt = readonly [number, number];
const m = ariMap;
const start = m.walk.route.match(/^M([\d.]+) ([\d.]+)/)!.slice(1).map(Number) as unknown as Pt;
const points: Pt[] = [start, ...m.walk.legs.map((l) => l.to)];
const angle = (a: Pt, b: Pt) => Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI;
// where each numbered step sits beside its point, in screen pixels, clear of the platform and the drop
const STEP_AT: Pt[] = [[-24, 0], [16, 4], [24, 24]];
// the map data holds the BTS as its two tracks, which pull apart at this scale; one is drawn, as one line
const RAIL = 'M' + m.rail.split('M')[1];

// k is how many screen pixels one map unit draws at, so text and markers keep their size in either crop
function Map({ viewBox, k, className }: { viewBox: string; k: number; className: string }) {
  const [S, T, P] = points;
  return (
    <svg viewBox={viewBox} className={className} role="img" aria-label={`Map: the studio on Soi Ari, ${m.walk.minutes} minutes on foot from BTS Ari`}>
      <path d={m.roads.lane} className="r-lane" />
      <path d={m.roads.street} className="r-street" />
      <path d={m.roads.major} className="r-major" />
      {/* the BTS runs overhead along Phahonyothin Road, drawn in the Sukhumvit line's own green */}
      <path d={RAIL} className="r-rail" />
      {/* street names placed by hand, clear of the walk */}
      <text className="r-name" fontSize={11 / k} transform={`translate(${T[0] - 10} ${T[1] - 22}) rotate(${angle(S, T)})`}>Phahonyothin Rd · BTS overhead</text>
      <text className="r-name" fontSize={11 / k} transform={`translate(${P[0] - 70} ${P[1] - 62}) rotate(${angle(P, T)})`}>Soi Ari</text>

      <path d={m.walk.route} className="r-walk" />
      {m.walk.legs.map((l, i) => {
        const a = points[i], b = l.to, turn = angle(a, b);
        const up = turn > 90 || turn < -90 ? turn + 180 : turn;
        return (
          <text key={l.street} className="r-leg" fontSize={12 / k} textAnchor="middle"
            transform={`translate(${(a[0] + b[0]) / 2} ${(a[1] + b[1]) / 2}) rotate(${up}) translate(0 ${-9 / k})`}>{l.metres} m</text>
        );
      })}
      {/* the station as a transit map marks it, with its code on the line */}
      <circle cx={S[0]} cy={S[1]} r={8 / k} className="r-station" />
      <text className="r-place" fontSize={14 / k} x={S[0] + 16 / k} y={S[1] + 22 / k}>
        {findUs.station}<tspan className="r-code" fontSize={11 / k} dx={6 / k}>{findUs.stationCode}</tspan>
      </text>
      {/* the studio marked with the dot of its own name, ร้อน·เย็น: half ember, half ice */}
      <g className="r-studio" transform={`translate(${P[0]} ${P[1]}) scale(${1 / k})`}>
        <circle r="14" />
        <path d="M0 -10.5A10.5 10.5 0 0 0 0 10.5Z" className="hot" />
        <path d="M0 -10.5A10.5 10.5 0 0 1 0 10.5Z" className="cold" />
      </g>
      <text className="r-mark" fontSize={17 / k} x={P[0] - 22 / k} y={P[1] + 6 / k} textAnchor="end" lang="th">{findUs.steps[2].title}</text>
      {points.map(([x, y], i) => (
        <g key={i} className="r-step" transform={`translate(${x + STEP_AT[i][0] / k} ${y + STEP_AT[i][1] / k})`}>
          <circle r={11 / k} />
          <text fontSize={12 / k} textAnchor="middle" dy={4.2 / k}>{i + 1}</text>
        </g>
      ))}
    </svg>
  );
}

export default function FindUs() {
  return (
    <section className="find" id="find">
      <div className="find-text">
        <h2>{findUs.heading}</h2>
        <p className="find-lead"><b>{m.walk.minutes} minutes</b> {findUs.lead}</p>
        <ol className="find-steps">
          {findUs.steps.map((s, i) => (
            <li key={s.title}>
              <i>{i + 1}</i>
              <span>
                <b lang={i === 2 ? 'th' : undefined}>{s.title}</b>
                {s.text}{m.walk.legs[i] && ` ${m.walk.legs[i].metres} m`}
              </span>
            </li>
          ))}
        </ol>
        <dl className="find-facts">
          <div><dt>{findUs.facts.address}</dt><dd>{findUs.address.map((l) => <span key={l}>{l}</span>)}</dd></div>
          <div><dt>{findUs.facts.open}</dt><dd>{findUs.hours.map((h) => <span key={h.days}>{h.days} <b>{h.time}</b></span>)}</dd></div>
          <div><dt>{findUs.facts.line}</dt><dd>{findUs.line}</dd></div>
        </dl>
      </div>

      <figure className="find-map">
        <Map viewBox="205 112 300 300" k={2.1} className="find-wide" />
        <Map viewBox="252 150 220 270" k={1.6} className="find-tall" />
        <figcaption>{findUs.credit}</figcaption>
      </figure>
    </section>
  );
}
