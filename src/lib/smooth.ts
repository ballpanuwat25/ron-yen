import Lenis, { type VirtualScrollData } from 'lenis';

// One smooth scroll for the whole page (Lenis): the wheel and the links in the bar ease the page along
// instead of stepping it, and because every wheel turn passes through here first, a section can stop or
// steer the page without the browser's own scrolling getting there first. Touch scrolls natively.

let lenis: Lenis | null = null;
let hook: ((data: VirtualScrollData) => boolean) | null = null;

export function mountSmooth() {
  lenis = new Lenis({
    autoRaf: true,
    anchors: true,
    lerp: 0.12,
    // a section may take a wheel turn for itself; it returns false and cancels the event when it does
    virtualScroll: (data) => hook?.(data) ?? true,
  });
  return () => { lenis?.destroy(); lenis = null; };
}

export const smooth = () => lenis;

// Lets one section see each wheel turn before the page scrolls. Returns the way to stop listening.
export function onWheelTurn(fn: (data: VirtualScrollData) => boolean) {
  hook = fn;
  return () => { if (hook === fn) hook = null; };
}
