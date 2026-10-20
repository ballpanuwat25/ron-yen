// The hero's two moving parts, drawn on canvases: the fogged window you wipe to see the ice bath,
// and the steam that trails the pointer around the sauna. Browser-only; the Hero mounts it.

export type Reading = { degrees: number; cleared: number };

type Options = {
  hero: HTMLElement;
  pane: HTMLElement;
  fog: HTMLCanvasElement;
  steam: HTMLCanvasElement;
  // the sauna photo as the page shows it, so the fog can be the same picture seen through wet glass
  sauna: HTMLImageElement;
  onReading: (r: Reading) => void;
};

const HOLD = 4000;      // ms a wiped patch stays clear
const REFOG = 5000;     // ms for it to fog over again after that
const CELL = 3;         // CSS px per cell of the wipe mask

const smooth = (a: number, b: number, x: number) => {
  const k = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return k * k * (3 - 2 * k);
};

type Drip = { pts: [number, number][]; v: number; w: number; slow: number; born: number; fade: number; seed: number };
type Puff = { x: number; y: number; vx: number; vy: number; r: number; grow: number; life: number; max: number; seed: number };

export function mountHeroGlass({ hero, pane, fog, steam, sauna, onReading }: Options): () => void {
  const cx = fog.getContext('2d')!;
  const sx = steam.getContext('2d')!;
  const coarse = matchMedia('(pointer: coarse)').matches;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- the fogged window ----------
  let W = 0, H = 0, DPR = 1, MW = 0, MH = 0;
  let fogTex = document.createElement('canvas');
  // each cell remembers how clear it was wiped and when; its clearness is worked out from those
  // two, so fog eases back in one smooth curve and a new wipe never leaves a hard seam
  let peak = new Float32Array(0), wipedAt = new Float32Array(0);
  const maskCv = document.createElement('canvas');
  const mctx = maskCv.getContext('2d')!;
  let maskImg = mctx.createImageData(1, 1);
  const drips: Drip[] = [];
  let nextDrip = performance.now() + 5000;

  function build() {
    DPR = Math.min(2, devicePixelRatio || 1);
    W = pane.clientWidth; H = pane.clientHeight;
    fog.width = W * DPR; fog.height = H * DPR;
    steam.width = hero.clientWidth * DPR; steam.height = hero.clientHeight * DPR;

    // the fog: the slice of the sauna photo behind the pane, blurred, in the same ember print,
    // with beads of condensation and a sheen so it reads as glass
    fogTex = document.createElement('canvas'); fogTex.width = fog.width; fogTex.height = fog.height;
    const f = fogTex.getContext('2d')!;
    const hr = hero.getBoundingClientRect(), pr = pane.getBoundingClientRect();
    const s = Math.max(hr.width / sauna.naturalWidth, hr.height / sauna.naturalHeight);
    const ox = (hr.width - sauna.naturalWidth * s) / 2 - (pr.left - hr.left);
    const oy = (hr.height - sauna.naturalHeight * s) / 2 - (pr.top - hr.top);
    f.fillStyle = '#b8461c'; f.fillRect(0, 0, fogTex.width, fogTex.height);
    f.filter = `grayscale(1) contrast(1.35) brightness(.85) blur(${10 * DPR}px)`;
    f.drawImage(sauna, ox * DPR, oy * DPR, sauna.naturalWidth * s * DPR, sauna.naturalHeight * s * DPR);
    f.filter = 'none';
    f.globalCompositeOperation = 'multiply'; f.fillStyle = '#ff6a2a'; f.fillRect(0, 0, fogTex.width, fogTex.height);
    f.globalCompositeOperation = 'source-over'; f.fillStyle = 'rgba(255, 196, 160, .22)'; f.fillRect(0, 0, fogTex.width, fogTex.height);
    const sheen = f.createLinearGradient(0, 0, fogTex.width * .6, fogTex.height);
    sheen.addColorStop(0, 'rgba(255,236,220,.2)'); sheen.addColorStop(.4, 'rgba(255,236,220,0)');
    f.fillStyle = sheen; f.fillRect(0, 0, fogTex.width, fogTex.height);
    const beads = Math.round(W * H / 140);
    for (let i = 0; i < beads; i++) {
      const x = Math.random() * fogTex.width, y = Math.random() * fogTex.height;
      const r = (Math.random() ** 3 * 3 + .5) * DPR;
      const g = f.createRadialGradient(x - r * .3, y - r * .3, 0, x, y, r);
      g.addColorStop(0, 'rgba(255,244,232,.6)'); g.addColorStop(.7, 'rgba(255,230,210,.14)'); g.addColorStop(1, 'rgba(70,20,8,.28)');
      f.fillStyle = g; f.beginPath(); f.arc(x, y, r, 0, 7); f.fill();
    }

    MW = Math.ceil(W / CELL); MH = Math.ceil(H / CELL);
    peak = new Float32Array(MW * MH); wipedAt = new Float32Array(MW * MH).fill(-1e9);
    maskCv.width = MW; maskCv.height = MH;
    maskImg = mctx.createImageData(MW, MH);
    drips.length = 0;
  }

  const clearAt = (i: number, now: number) => peak[i] * (1 - smooth(HOLD, HOLD + REFOG, now - wipedAt[i]));

  let last: { x: number; y: number } | null = null;
  let lastInput = -1e9;
  function stamp(px: number, py: number, now: number) {
    const r = (coarse ? 36 : 46) / CELL;
    const c0 = px / CELL, r0 = py / CELL;
    const x0 = Math.max(0, Math.floor(c0 - r)), x1 = Math.min(MW - 1, Math.ceil(c0 + r));
    const y0 = Math.max(0, Math.floor(r0 - r)), y1 = Math.min(MH - 1, Math.ceil(r0 + r));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const d = Math.hypot(x - c0, y - r0) / r;
      if (d >= 1) continue;
      const k = 1 - smooth(.55, 1, d), i = y * MW + x;
      // only where this wipe makes the glass clearer than it is now does the cell start over
      if (k > clearAt(i, now)) { peak[i] = k; wipedAt[i] = now; }
    }
  }
  function wipeTo(x: number, y: number) {
    const now = performance.now();
    const from = last ?? { x, y };
    const steps = Math.max(1, Math.ceil(Math.hypot(x - from.x, y - from.y) / 4));
    for (let i = 1; i <= steps; i++) {
      const px = from.x + (x - from.x) * i / steps, py = from.y + (y - from.y) * i / steps;
      stamp(px, py, now);
      // water gathers along the bottom of a wipe and now and then runs
      if (Math.random() < .008) drips.push({ pts: [[px + (Math.random() - .5) * 40, py + 30]], v: .5 + Math.random() * .8, w: 1.6 + Math.random() * 1.2, slow: .99, born: now, fade: 1, seed: Math.random() * 9 });
    }
    last = { x, y }; lastInput = now;
  }
  const local = (e: PointerEvent): [number, number] => { const r = pane.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  const onPaneMove = (e: PointerEvent) => { if (e.pointerType === 'mouse' || e.buttons) wipeTo(...local(e)); };
  const onPaneDown = (e: PointerEvent) => { last = null; pane.setPointerCapture(e.pointerId); wipeTo(...local(e)); };
  const onPaneUp = () => { last = null; };

  // a first wipe on its own, so a visitor sees what the glass does
  let demo = 0;
  function demoWipe() {
    const pts: [number, number][] = [];
    for (let i = 0; i <= 40; i++) { const k = i / 40; pts.push([W * (.18 + k * .64), H * .5 + Math.sin(k * Math.PI * 2) * H * .1]); }
    let i = 0; last = null;
    demo = window.setInterval(() => {
      if (i >= pts.length) { clearInterval(demo); last = null; return; }
      wipeTo(...pts[i++]);
    }, 22);
  }

  function drawFog(now: number, dt: number) {
    let sum = 0;
    const px = maskImg.data;
    for (let i = 0; i < peak.length; i++) {
      const c = clearAt(i, now);
      sum += c; px[i * 4 + 3] = c * 255;
    }
    mctx.putImageData(maskImg, 0, 0);
    cx.globalCompositeOperation = 'source-over';
    cx.clearRect(0, 0, fog.width, fog.height);
    cx.drawImage(fogTex, 0, 0);
    cx.globalCompositeOperation = 'destination-out';
    cx.imageSmoothingQuality = 'high';
    cx.filter = `blur(${3 * DPR}px)`;
    cx.drawImage(maskCv, 0, 0, MW * CELL * DPR, MH * CELL * DPR);
    cx.filter = 'none';

    // left alone, now and then a drop runs down the glass on its own, leaving a thin clear line
    if (!reduced && now > nextDrip) {
      drips.push({ pts: [[W * (.08 + Math.random() * .84), H * (.04 + Math.random() * .3)]], v: .8 + Math.random() * .8,
        w: 2.2 + Math.random() * 1.6, slow: .9975, born: now, fade: 1, seed: Math.random() * 9 });
      nextDrip = now + 8000 + Math.random() * 4000;
    }
    cx.lineCap = 'round';
    for (let i = drips.length - 1; i >= 0; i--) {
      const d = drips[i];
      if (d.v > .06) {
        const ly = d.pts[d.pts.length - 1][1];
        // water runs straight down; it only kinks a pixel or so around its line, never drifts off it
        const ny = ly + d.v * dt * .06, x0 = d.pts[0][0];
        d.pts.push([x0 + Math.sin(ny * .09 + d.seed) * .7 + Math.sin(ny * .23 + d.seed * 3) * .35, ny]);
        d.v *= d.slow;
        d.born = now;                         // the line starts to fog over once the drop stops
      }
      if (now - d.born > HOLD) d.fade -= dt / REFOG;
      if (d.fade <= 0 || d.pts[d.pts.length - 1][1] > H + 10) { drips.splice(i, 1); continue; }
      // a drip is just glass the water washed clear: a soft line, thin where it started and fuller
      // toward where the water still is, with no outline of its own
      const n = d.pts.length, step = Math.max(1, Math.floor(n / 24));
      cx.strokeStyle = `rgba(0,0,0,${.6 * d.fade})`;
      cx.filter = `blur(${.6 * DPR}px)`;
      for (let j = step; j < n; j += step) {
        const a0 = d.pts[j - step], a1 = d.pts[Math.min(n - 1, j)];
        cx.lineWidth = d.w * (.3 + .6 * (j / n)) * DPR;
        cx.beginPath(); cx.moveTo(a0[0] * DPR, a0[1] * DPR); cx.lineTo(a1[0] * DPR, a1[1] * DPR); cx.stroke();
      }
      const [hx, hy] = d.pts[n - 1];
      cx.filter = `blur(${1.2 * DPR}px)`;
      cx.fillStyle = `rgba(0,0,0,${.75 * d.fade})`;
      cx.beginPath(); cx.ellipse(hx * DPR, (hy - d.w * .6) * DPR, d.w * .8 * DPR, d.w * 1.5 * DPR, 0, 0, 7); cx.fill();
      cx.filter = 'none';
    }
    return peak.length ? sum / peak.length : 0;
  }

  // ---------- steam rising in the room, which the pointer stirs; none over the glass ----------
  const puff = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d')!, r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    r.addColorStop(0, 'rgba(255,236,220,.5)'); r.addColorStop(.45, 'rgba(255,226,205,.2)'); r.addColorStop(1, 'rgba(255,226,205,0)');
    g.fillStyle = r; g.fillRect(0, 0, 128, 128);
    return c;
  })();
  const puffs: Puff[] = [];
  const ptr = { x: -1e4, y: -1e4, vx: 0, vy: 0, inside: false, onPane: false, at: -1e9 };
  const onHeroMove = (e: PointerEvent) => {
    const r = hero.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    if (ptr.inside) { ptr.vx = x - ptr.x; ptr.vy = y - ptr.y; }
    ptr.x = x; ptr.y = y; ptr.inside = true; ptr.at = performance.now();
    const pr = pane.getBoundingClientRect();
    ptr.onPane = e.clientX > pr.left - 8 && e.clientX < pr.right + 8 && e.clientY > pr.top - 8 && e.clientY < pr.bottom + 8;
  };
  const onHeroLeave = () => { ptr.inside = false; };

  function drawSteam(now: number, dt: number) {
    // steam rises off the stones all the time; the pointer never makes it, it only stirs it
    if (!reduced && Math.random() < .12) {
      puffs.push({ x: steam.width / DPR * Math.random(), y: steam.height / DPR + 40, vx: (Math.random() - .5) * .15, vy: -(.6 + Math.random() * .4),
        r: 60 + Math.random() * 80, grow: .22 + Math.random() * .22, life: 0, max: 6500 + Math.random() * 3000, seed: Math.random() * 99 });
    }
    const stir = ptr.inside && !ptr.onPane && now - ptr.at < 1500;
    sx.setTransform(DPR, 0, 0, DPR, 0, 0);
    sx.clearRect(0, 0, steam.width, steam.height);
    sx.globalCompositeOperation = 'screen';
    for (let i = puffs.length - 1; i >= 0; i--) {
      const p = puffs[i];
      p.life += dt;
      if (stir) {
        // near the pointer the steam parts, and is dragged a little along the way the hand moves
        const dx = p.x - ptr.x, dy = p.y - ptr.y, d = Math.hypot(dx, dy) + 1, reach = 190 + p.r * .6;
        if (d < reach) {
          const f = 1 - d / reach;
          p.vx += (dx / d * .35 + ptr.vx * .05) * f;
          p.vy += (dy / d * .35 + ptr.vy * .05) * f;
        }
      }
      p.vx += Math.sin(now / 1100 + p.seed) * .004;
      p.vx *= .985; p.vy += (-.85 - p.vy) * .02;   // eases back to a steady rise once stirred
      p.x += p.vx * dt * .06; p.y += p.vy * dt * .06; p.r += p.grow * dt * .06;
      const k = p.life / p.max;
      if (k >= 1) { puffs.splice(i, 1); continue; }
      sx.globalAlpha = Math.sin(Math.min(1, k * 2) * Math.PI / 2) * (1 - k) * .28;
      sx.drawImage(puff, p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
    }
    ptr.vx *= .8; ptr.vy *= .8;
    // a soft warm light right at the pointer, like the lantern light in Saeng House
    if (ptr.inside && !ptr.onPane) {
      // small and faint: warmth at the fingertip, not a spotlight
      const R = 90;
      const g = sx.createRadialGradient(ptr.x, ptr.y, 0, ptr.x, ptr.y, R);
      g.addColorStop(0, 'rgba(255,190,140,.12)'); g.addColorStop(1, 'rgba(255,190,140,0)');
      sx.globalAlpha = 1; sx.fillStyle = g; sx.fillRect(ptr.x - R, ptr.y - R, R * 2, R * 2);
    }
    sx.globalAlpha = 1;
  }

  // ---------- one loop for both ----------
  let shown = 88, prev = performance.now(), raf = 0;
  function frame(now: number) {
    const dt = Math.min(50, now - prev); prev = now;
    const cleared = smooth(.03, .4, drawFog(now, dt));
    // the reading: how much ice shows through the window takes it from the bench toward the bath
    shown += (88 - 85 * cleared - shown) * (1 - Math.exp(-dt / 260));
    onReading({ degrees: shown, cleared });
    drawSteam(now, dt);
    raf = requestAnimationFrame(frame);
  }

  pane.addEventListener('pointermove', onPaneMove);
  pane.addEventListener('pointerdown', onPaneDown);
  pane.addEventListener('pointerleave', onPaneUp);
  pane.addEventListener('pointerup', onPaneUp);
  hero.addEventListener('pointermove', onHeroMove);
  hero.addEventListener('pointerleave', onHeroLeave);
  addEventListener('resize', build);
  // the picture element swaps the wide and tall crops at the phone breakpoint; rebuild the fog when it does
  sauna.addEventListener('load', build);
  build();
  raf = requestAnimationFrame(frame);
  const demoTimer = window.setTimeout(() => { if (performance.now() - lastInput > 1500) demoWipe(); }, 1200);

  return () => {
    cancelAnimationFrame(raf);
    clearTimeout(demoTimer); clearInterval(demo);
    pane.removeEventListener('pointermove', onPaneMove);
    pane.removeEventListener('pointerdown', onPaneDown);
    pane.removeEventListener('pointerleave', onPaneUp);
    pane.removeEventListener('pointerup', onPaneUp);
    hero.removeEventListener('pointermove', onHeroMove);
    hero.removeEventListener('pointerleave', onHeroLeave);
    removeEventListener('resize', build);
    sauna.removeEventListener('load', build);
  };
}
