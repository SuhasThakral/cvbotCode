// Smooth scrolling with Lenis. Optional: skipped with reduced motion, and the page works without it.
import { Lenis } from '../vendor/lenis.module.min.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const motion = { lenis: null };

// Feel: lerp = how quickly the page catches up with the wheel (higher = snappier),
// wheelMultiplier = how far one swipe travels. Tuned between native scrolling and the first, floatier version.
const FEEL = { lerp: 0.2, wheelMultiplier: 1.1 };

export function initLenis() {
  if (reduce) return null;
  const lenis = new Lenis({ ...FEEL, anchors: false });
  const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
  motion.lenis = lenis;
  return lenis;
}
export function scrollToY(y, smooth = false) {
  if (motion.lenis) motion.lenis.scrollTo(y, smooth ? { duration: 1 } : { immediate: true, force: true });
  else window.scrollTo({ top: y, behavior: smooth ? 'smooth' : 'auto' });
}
export function setScrollLock(on) {
  if (!motion.lenis) return;
  if (on) motion.lenis.stop(); else motion.lenis.start();
}
