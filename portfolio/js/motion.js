// Motion layer: Lenis smooth scrolling site-wide, plus the GSAP scenes on the "How I work" view.
// Everything here is optional: with reduced motion (or if the vendor file fails) the page works as before.
import { gsap, ScrollTrigger, SplitText, ScrambleTextPlugin, Lenis } from '../vendor/motion.module.min.js';

gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin);

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const narrow = matchMedia('(max-width: 820px), (max-aspect-ratio: 85/100)');
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

export const motion = { lenis: null, reduce };

// ---------- smooth scrolling ----------
export function initLenis() {
  if (reduce) return null;
  const lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 0.95, touchMultiplier: 1.4, anchors: false });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  motion.lenis = lenis;
  return lenis;
}
export function scrollToY(y, smooth = false) {
  if (motion.lenis) motion.lenis.scrollTo(y, smooth ? { duration: 1.2 } : { immediate: true, force: true });
  else window.scrollTo({ top: y, behavior: smooth ? 'smooth' : 'auto' });
}
export function setScrollLock(on) {
  if (!motion.lenis) return;
  if (on) motion.lenis.stop(); else motion.lenis.start();
}

// ---------- numbers that count to their new value ----------
export function countTo(el, value, fmt, from) {
  if (!el) return;
  const start = from ?? el._v;
  el._v = value;
  el._fmt = fmt;
  if (reduce || start === undefined || !isFinite(value) || !isFinite(start)) { el.textContent = fmt(value); return; }
  const o = { v: start };
  gsap.killTweensOf(el._o || {});
  el._o = o;
  gsap.to(o, { v: value, duration: 0.9, ease: 'power2.out', onUpdate: () => { el.textContent = fmt(o.v); } });
}

// ---------- liquid glass ----------
// Real refraction where the browser can do it (Chromium: an SVG displacement map as backdrop-filter),
// frosted glass with a specular rim everywhere else.
const NS = 'http://www.w3.org/2000/svg';
const canRefract = !reduce && typeof CSS !== 'undefined' && CSS.supports('backdrop-filter', 'url(#a)')
  && /Chrome\//.test(navigator.userAgent);
let defs = null, glassId = 0;

function bezelMap(w, h, r, bezel) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d'), img = ctx.createImageData(w, h), d = img.data;
  const hw = w / 2, hh = h / 2;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    // signed distance to the rounded rectangle (negative inside)
    const px = Math.abs(x + 0.5 - hw) - (hw - r), py = Math.abs(y + 0.5 - hh) - (hh - r);
    const ox = Math.max(px, 0), oy = Math.max(py, 0);
    const dist = Math.hypot(ox, oy) + Math.min(Math.max(px, py), 0) - r;
    const inside = -dist;
    let rx = 0, ry = 0;
    if (inside > 0 && inside < bezel) {
      // outward normal of the shape at this point
      let nx, ny;
      if (ox > 0 || oy > 0) { const l = Math.hypot(ox, oy) || 1; nx = ox / l; ny = oy / l; }
      else if (px > py) { nx = 1; ny = 0; } else { nx = 0; ny = 1; }
      nx *= Math.sign(x + 0.5 - hw) || 1; ny *= Math.sign(y + 0.5 - hh) || 1;
      const t = 1 - inside / bezel, m = t * t * (3 - 2 * t);   // strongest right at the rim
      rx = -nx * m; ry = -ny * m;                              // sample inward: the edge bends light like a lens
    }
    const i = (y * w + x) * 4;
    d[i] = 128 + rx * 127; d[i + 1] = 128 + ry * 127; d[i + 2] = 128; d[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return c.toDataURL();
}

function glass(el, { scale = 38, bezel = 22 } = {}) {
  el.classList.add('lg');
  if (!canRefract) return;
  if (!defs) {
    defs = document.createElementNS(NS, 'svg');
    defs.setAttribute('class', 'fx-defs');
    defs.setAttribute('aria-hidden', 'true');
    defs.setAttribute('focusable', 'false');
    document.body.appendChild(defs);
  }
  const id = 'lg' + (++glassId);
  const f = document.createElementNS(NS, 'filter');
  f.setAttribute('id', id);
  f.setAttribute('filterUnits', 'userSpaceOnUse');
  f.setAttribute('color-interpolation-filters', 'sRGB');
  const im = document.createElementNS(NS, 'feImage');
  im.setAttribute('result', 'map');
  im.setAttribute('preserveAspectRatio', 'none');
  const dm = document.createElementNS(NS, 'feDisplacementMap');
  dm.setAttribute('in', 'SourceGraphic');
  dm.setAttribute('in2', 'map');
  dm.setAttribute('scale', String(scale));
  dm.setAttribute('xChannelSelector', 'R');
  dm.setAttribute('yChannelSelector', 'G');
  f.append(im, dm);
  defs.appendChild(f);
  let lastW = 0, lastH = 0;
  const build = () => {
    const w = Math.round(el.offsetWidth), h = Math.round(el.offsetHeight);
    if (!w || !h || (w === lastW && h === lastH)) return;
    lastW = w; lastH = h;
    const r = Math.min(parseFloat(getComputedStyle(el).borderTopLeftRadius) || 16, h / 2, w / 2);
    for (const n of [f, im]) { n.setAttribute('x', '0'); n.setAttribute('y', '0'); n.setAttribute('width', String(w)); n.setAttribute('height', String(h)); }
    im.setAttribute('href', bezelMap(w, h, r, Math.min(bezel, h / 2, w / 2)));
    el.style.setProperty('--lg', `url(#${id}) blur(1.5px) saturate(1.7) brightness(1.04)`);
    el.classList.add('lg-on');
  };
  new ResizeObserver(build).observe(el);
  build();
}

// ---------- "How I work" ----------
const PACKETS = [
  ['Anna Weber, insulin order', 'Order status question'],
  ['Mr. Kaya, blood pressure', 'Question about opening hours'],
  ['Lena M., allergy pass', 'Stock check: nasal spray'],
];

function approachScenes(view) {
  const cleanups = [];
  // section titles rise line by line out of a mask
  $$('.split-head .h2, .plain .h2', view).forEach((h) => {
    const st = SplitText.create(h, { type: 'lines', mask: 'lines', linesClass: 'ln-m' });
    gsap.from(st.lines, {
      yPercent: 105, duration: 1.05, ease: 'expo.out', stagger: 0.09,
      scrollTrigger: { trigger: h, start: 'top 86%', once: true },
    });
  });

  // "First / Second / Third" decode like a terminal
  $$('.split-head .num', view).forEach((n) => {
    const txt = n.textContent;
    gsap.from(n, {
      duration: 1.1, scrambleText: { text: txt, chars: 'upperAndLowerCase', revealDelay: 0.25, speed: 0.6 },
      scrollTrigger: { trigger: n, start: 'top 88%', once: true },
      onStart() { n.textContent = '·····'; },
    });
  });

  // the calculator counts up the first time it is seen
  const out = $('.calc-out', view);
  if (out) {
    ScrollTrigger.create({
      trigger: out, start: 'top 80%', once: true,
      onEnter: () => $$('.out b', out).forEach((b) => { if (b._fmt && isFinite(b._v)) countTo(b, b._v, b._fmt, 0); }),
    });
    gsap.from($$('.out', out), {
      y: 40, opacity: 0, scale: 0.94, duration: 1, ease: 'expo.out', stagger: 0.08,
      scrollTrigger: { trigger: out, start: 'top 82%', once: true },
    });
  }

  // the five habits: a line draws down the list and each point lands on it
  const habits = $('.habits', view);
  if (habits) {
    gsap.fromTo(habits, { '--hp': 0 }, {
      '--hp': 1, ease: 'none',
      scrollTrigger: { trigger: habits, start: 'top 78%', end: 'bottom 62%', scrub: 0.6 },
    });
    $$('li', habits).forEach((li) => {
      gsap.from(li, {
        x: narrow.matches ? 0 : -46, opacity: 0, duration: 0.9, ease: 'expo.out',
        scrollTrigger: { trigger: li, start: 'top 84%', once: true, onEnter: () => li.classList.add('hit') },
      });
    });
  }

  // data protection: personal details go in, get scrubbed at the gate, only the neutral question leaves
  const zones = $('.zones', view), gate = $('.gate', view);
  if (zones && gate) {
    const lane = document.createElement('div');
    lane.className = 'lane';
    lane.setAttribute('aria-hidden', 'true');
    gate.appendChild(lane);
    const zin = $('.zone.in', zones), zout = $('.zone.out', zones);
    const tl = gsap.timeline({ repeat: -1, paused: true });
    PACKETS.forEach(([raw, clean]) => {
      const chip = document.createElement('span');
      chip.className = 'chip';
      chip.textContent = raw;
      lane.appendChild(chip);
      // distances are measured live so it follows the layout (side by side or stacked)
      const span = () => {
        const g = gate.getBoundingClientRect(), a = zin.getBoundingClientRect(), b = zout.getBoundingClientRect();
        return narrow.matches
          ? { ax: 'y', from: a.bottom - g.top - g.height / 2 - 18, to: b.top - g.top - g.height / 2 + 18 }
          : { ax: 'x', from: a.right - g.left - g.width / 2 - 40, to: b.left - g.left - g.width / 2 + 40 };
      };
      const k = (p) => () => { const s = span(); return s.from + (s.to - s.from) * p; };
      tl.call(() => { chip.className = 'chip'; chip.textContent = raw; })
        .fromTo(chip, { [narrow.matches ? 'y' : 'x']: k(0), opacity: 0, scale: 0.9 },
          { [narrow.matches ? 'y' : 'x']: k(0.42), opacity: 1, scale: 1, duration: 0.9, ease: 'power2.out' })
        .to(chip, { duration: 0.75, scrambleText: { text: clean, chars: '█▓▒░', speed: 0.9 }, onStart: () => chip.classList.add('scrub') }, '>-0.05')
        .to(chip, { [narrow.matches ? 'y' : 'x']: k(1), duration: 1, ease: 'power2.in', onStart: () => chip.classList.add('clean') }, '>')
        .to(chip, { opacity: 0, duration: 0.3 }, '>-0.3');
    });
    ScrollTrigger.create({ trigger: zones, start: 'top 85%', end: 'bottom 10%', onToggle: (s) => (s.isActive ? tl.play() : tl.pause()) });
    const inv = () => tl.invalidate();
    ScrollTrigger.addEventListener('refresh', inv);
    cleanups.push(() => { ScrollTrigger.removeEventListener('refresh', inv); tl.kill(); lane.remove(); });
  }

  // the honest note: its gold rule draws itself
  const plain = $('.plain', view);
  if (plain) gsap.fromTo(plain, { '--pr': 0 }, { '--pr': 1, ease: 'none', scrollTrigger: { trigger: plain, start: 'top 85%', end: 'top 35%', scrub: 0.5 } });

  // hero title: letters drop in
  const h1 = $('.tab-hero h1', view);
  if (h1) {
    const st = SplitText.create(h1, { type: 'words,chars', mask: 'words' });
    gsap.from(st.chars, { yPercent: 110, rotate: 4, duration: 1.1, ease: 'expo.out', stagger: 0.018, delay: 0.1 });
  }
  cleanups.push(() => $$('.habits li.hit', view).forEach((li) => li.classList.remove('hit')));
  return () => cleanups.forEach((f) => f());
}

let ctx = null;
let glassDone = false;
export function enterView(name) {
  if (ctx) { ctx.revert(); ctx = null; }
  if (reduce) return;
  const view = document.getElementById('view-' + name);
  if (!view) return;
  if (name === 'approach') {
    // glass is built once and stays (it is plain styling, nothing to replay)
    if (!glassDone) {
      glassDone = true;
      $$('.calc-out .out', view).forEach((o) => glass(o, { scale: 34, bezel: 20 }));
    }
    ctx = gsap.context(() => approachScenes(view), view);
  }
  requestAnimationFrame(() => ScrollTrigger.refresh());
}
export function refreshMotion() { ScrollTrigger.refresh(); }
