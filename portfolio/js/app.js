// Page behaviour: tabs, the scroll engine, the pinned journey, and the smaller scroll-linked pieces.
import { Stage } from './stage.js';
import { initCV } from './cvchat.js';

const root = document.documentElement;
root.classList.add('js');
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const easeOut = (t) => 1 - Math.pow(1 - clamp(t), 3);
const narrow = matchMedia('(max-width: 820px), (max-aspect-ratio: 85/100)');
const VIEWS = ['intro', 'projects', 'approach', 'content', 'ai-cv'];

const S = { y: 0, vh: innerHeight, vw: innerWidth, view: null, last: performance.now() };
const tracks = [];
let stage = null;
let M = null;       // smooth scrolling (Lenis), loaded after first paint; the page works without it
const toTop = () => (M ? M.scrollToY(0) : window.scrollTo(0, 0));

// ---------- scroll engine ----------
function docTop(el) { let y = 0; while (el) { y += el.offsetTop; el = el.offsetParent; } return y; }
function track(el, fn, onMeasure) {
  const v = el.closest('.view');
  tracks.push({ el, fn, onMeasure, view: v ? v.id.slice(5) : null, top: 0, h: 0 });
}
function measure() {
  S.vh = innerHeight; S.vw = innerWidth;
  const mine = tracks.filter((t) => t.view === S.view);
  mine.forEach((t) => t.onMeasure && t.onMeasure(t));
  mine.forEach((t) => { t.top = docTop(t.el); t.h = t.el.offsetHeight; });
}
function tick(now) {
  const dt = Math.min(0.05, (now - S.last) / 1000);
  S.last = now;
  const ty = window.scrollY;
  if (M && M.motion.lenis) S.y = ty;   // Lenis already eases the scroll
  else S.y += (ty - S.y) * (1 - Math.exp(-dt * 10));
  if (Math.abs(ty - S.y) < 0.1) S.y = ty;
  for (const t of tracks) if (t.view === S.view) t.fn(t);
  requestAnimationFrame(tick);
}

// ---------- the pinned journey ----------
// scroll progress -> which state the particles are in (with holds on each state)
const KF = [[0, 0], [0.045, 0], [0.17, 1], [0.24, 1], [0.36, 2], [0.44, 2], [0.56, 3], [0.64, 3], [0.75, 4], [0.83, 4], [0.93, 5], [1, 5]];
const phaseAt = (p) => {
  for (let i = 1; i < KF.length; i++) if (p <= KF[i][0]) {
    const a = KF[i - 1], b = KF[i];
    return a[1] + (b[1] - a[1]) * ((p - a[0]) / (b[0] - a[0] || 1));
  }
  return 5;
};
// when each caption fades in and out
const WIN = [[-1, -0.5, 0.03, 0.11], [0.125, 0.175, 0.235, 0.285], [0.315, 0.365, 0.435, 0.485], [0.515, 0.565, 0.635, 0.685], [0.705, 0.755, 0.825, 0.865], [0.885, 0.94, 2, 3]];

function setupJourney() {
  const el = $('#journey');
  if (!el) return;
  const caps = $$('.cap', el), lines = $$('.name .ln', el), cols = $$('.col', el), rail = $$('.rail li', el), hint = $('.hint', el);
  track(el, (t) => {
    const p = clamp((S.y - t.top) / Math.max(1, t.h - S.vh));
    const ph = phaseAt(p);
    if (stage && stage.mode === 'journey') { stage.setPhase(ph); stage.travel = p * 420; }
    let best = -1, bo = 0.05;
    caps.forEach((c, i) => {
      const w = WIN[i], a = smooth(w[0], w[1], p), b = smooth(w[2], w[3], p), o = a * (1 - b);
      const side = c.classList.contains('at-left') ? -1 : c.classList.contains('at-right') ? 1 : 0;
      c.style.setProperty('--o', o.toFixed(3));
      c.style.setProperty('--y', ((1 - a) * 44 - b * 44).toFixed(1) + 'px');
      c.style.setProperty('--x', (side && !narrow.matches ? side * (1 - a) * 70 : 0).toFixed(1) + 'px');
      c.classList.toggle('on', o > 0.01);
      if (o > bo) { bo = o; best = i; }
      if (i === 0) {
        const d = b * S.vw * 0.16;
        lines[0].style.setProperty('--sx', (-d).toFixed(1) + 'px');
        lines[1].style.setProperty('--sx', d.toFixed(1) + 'px');
      }
      if (i === 5) {
        const d = (1 - a) * (narrow.matches ? 40 : 150);
        cols[0].style.setProperty('--cx', (-d).toFixed(1) + 'px');
        cols[1].style.setProperty('--cx', d.toFixed(1) + 'px');
      }
    });
    // keep the streaming dust off whichever caption is being read
    if (stage && stage.mode === 'journey') {
      if (best < 0) stage.setText(null, 0);
      else {
        const els = best === 5 ? cols : [caps[best]];
        let l = 1e9, r = -1e9, tp = 1e9, bt = -1e9;
        els.forEach((e) => { const q = e.getBoundingClientRect(); l = Math.min(l, q.left); r = Math.max(r, q.right); tp = Math.min(tp, q.top); bt = Math.max(bt, q.bottom); });
        stage.setText([((l + r) / S.vw) - 1, 1 - ((tp + bt) / S.vh), (r - l) / S.vw, (bt - tp) / S.vh], bo);
      }
    }
    const idx = Math.round(ph);
    rail.forEach((r, i) => r.classList.toggle('on', i === idx));
    hint.style.setProperty('--o', (1 - smooth(0, 0.02, p)).toFixed(2));
  });
}

// ---------- text that lights up word by word ----------
function setupWords() {
  $$('[data-words]').forEach((el) => {
    const words = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    const spans = words.map((w, i) => {
      const s = document.createElement('span');
      s.className = 'w';
      s.textContent = w;
      el.append(s, i < words.length - 1 ? ' ' : '');
      return s;
    });
    track(el, (t) => {
      const p = clamp((S.y + S.vh * 0.86 - t.top) / (S.vh * 0.55 + t.h));
      spans.forEach((s, i) => { s.style.opacity = (0.14 + 0.86 * clamp(p * (spans.length + 2) - i)).toFixed(2); });
    });
  });
}

// ---------- blocks that slide in from their own side ----------
function setupSlides() {
  $$('[data-slide]').forEach((el) => {
    const dir = +el.dataset.slide;
    track(el, (t) => {
      const e = easeOut((S.y + S.vh - t.top) / (S.vh * 0.62));
      el.style.setProperty('--sx', (narrow.matches ? 0 : dir * (1 - e) * 150).toFixed(1) + 'px');
      el.style.setProperty('--so', e.toFixed(3));
    });
  });
}

// ---------- selected work: vertical scroll moves the row sideways ----------
function setupPicks() {
  const sec = $('#picks'), tr = $('#picksTrack');
  if (!sec) return;
  let dist = 0;
  track(sec, (t) => {
    if (narrow.matches) return;
    const p = clamp((S.y - t.top) / Math.max(1, t.h - S.vh));
    tr.style.setProperty('--tx', (-p * dist).toFixed(1) + 'px');
  }, () => {
    if (narrow.matches) { sec.style.height = ''; tr.style.setProperty('--tx', '0px'); return; }
    dist = Math.max(0, tr.scrollWidth - S.vw);
    sec.style.height = Math.round(S.vh + dist * 1.15) + 'px';
  });
}

// ---------- the thread that draws itself between the career steps ----------
function setupThread() {
  const box = $('#thread');
  if (!box) return;
  const svg = $('.thread-svg', box), steps = $$('.step', box), NS = 'http://www.w3.org/2000/svg';
  const mk = (tag, cls) => { const p = document.createElementNS(NS, tag); if (cls) p.setAttribute('class', cls); svg.appendChild(p); return p; };
  const base = mk('path', 't-base'), glow = mk('path', 't-glow'), line = mk('path', 't-line'), dot = mk('circle');
  dot.setAttribute('r', '4');
  let len = 0, marks = [];
  track(box, (t) => {
    const p = clamp((S.y + S.vh * 0.6 - t.top) / Math.max(1, t.h));
    const off = (len * (1 - p)).toFixed(1);
    line.style.strokeDashoffset = off;
    glow.style.strokeDashoffset = off;
    if (len) { const pt = line.getPointAtLength(len * p); dot.setAttribute('cx', pt.x.toFixed(1)); dot.setAttribute('cy', pt.y.toFixed(1)); }
    steps.forEach((s, i) => {
      const e = smooth(marks[i] - 0.05, marks[i] + 0.02, p);
      const dir = narrow.matches ? 1 : s.classList.contains('left') ? -1 : 1;
      s.style.setProperty('--so', e.toFixed(3));
      s.style.setProperty('--sx', (dir * (1 - e) * 70).toFixed(1) + 'px');
    });
  }, () => {
    const W = box.clientWidth, H = box.offsetHeight, mid = narrow.matches ? 6 : W / 2;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const pts = steps.map((s) => {
      const x = narrow.matches ? 6 : s.classList.contains('left') ? s.offsetLeft + s.offsetWidth + 50 : s.offsetLeft - 50;
      return [x, s.offsetTop + 34];
    });
    let d = `M ${mid} 0`, px = mid, py = 0;
    pts.forEach(([x, y]) => { const m = (py + y) / 2; d += ` C ${px} ${m}, ${x} ${m}, ${x} ${y}`; px = x; py = y; });
    d += ` C ${px} ${(py + H) / 2}, ${mid} ${(py + H) / 2}, ${mid} ${H}`;
    [base, glow, line].forEach((p) => p.setAttribute('d', d));
    len = line.getTotalLength();
    line.style.strokeDasharray = len.toFixed(1);
    glow.style.strokeDasharray = len.toFixed(1);
    // where along the line each step sits
    marks = pts.map(([, y]) => {
      let lo = 0, hi = len;
      for (let i = 0; i < 16; i++) { const m = (lo + hi) / 2; if (line.getPointAtLength(m).y < y) lo = m; else hi = m; }
      return len ? lo / len : 0;
    });
  });
}

// ---------- closing: two giant lines crossing behind and in front of the photo ----------
function setupClosing() {
  const st = $('.closing-stage');
  if (!st) return;
  const g1 = $('.g1', st), g2 = $('.g2', st), me = $('.closing-me', st);
  track(st, (t) => {
    const q = clamp((S.y + S.vh - t.top) / (S.vh + t.h));
    g1.style.setProperty('--gx', (S.vw * (0.3 - q * 0.9)).toFixed(1) + 'px');
    g2.style.setProperty('--gx', (S.vw * (-0.75 + q * 0.95)).toFixed(1) + 'px');
    me.style.setProperty('--my', ((0.5 - q) * 90).toFixed(1) + 'px');
  });
}

// ---------- projects: media that turns in 3D as it passes ----------
function setupCases() {
  $$('.case').forEach((c) => {
    const box = $('.tiltbox', c), side = +box.dataset.tilt, stack = $('.stack3d', c), shots = $('.shots3d', c);
    const m = { x: 0, y: 0, tx: 0, ty: 0 };
    box.addEventListener('pointermove', (e) => {
      const r = box.getBoundingClientRect();
      m.tx = (e.clientX - r.left) / r.width - 0.5;
      m.ty = (e.clientY - r.top) / r.height - 0.5;
    });
    box.addEventListener('pointerleave', () => { m.tx = 0; m.ty = 0; });
    track(c, (t) => {
      const off = clamp(((t.top + t.h / 2) - (S.y + S.vh / 2)) / (t.h * 0.5 + S.vh * 0.5), -1, 1);
      m.x += (m.tx - m.x) * 0.08;
      m.y += (m.ty - m.y) * 0.08;
      const k = narrow.matches ? 0.35 : 1, a = Math.abs(off);
      box.style.setProperty('--ry', ((side * (5 + 15 * a) + m.x * 10) * k).toFixed(2) + 'deg');
      box.style.setProperty('--rx', ((off * 8 - m.y * 8) * k).toFixed(2) + 'deg');
      box.style.setProperty('--ty', (off * -26 * k).toFixed(1) + 'px');
      if (stack) stack.style.setProperty('--gap', (40 + (1 - a) * 34).toFixed(1) + 'px');
      if (shots) shots.style.setProperty('--sp', ((1 - a) * 44).toFixed(1) + 'px');
    });
  });
}

// ---------- cards that lean toward the pointer ----------
function setupCards() {
  $$('[data-card]').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      el.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
      el.style.setProperty('--my', (y * 100).toFixed(1) + '%');
      el.style.setProperty('--hy', ((x - 0.5) * 5).toFixed(2) + 'deg');
      el.style.setProperty('--hx', ((0.5 - y) * 4).toFixed(2) + 'deg');
    });
    el.addEventListener('pointerleave', () => { el.style.setProperty('--hx', '0deg'); el.style.setProperty('--hy', '0deg'); });
  });
}

// ---------- things that react to being seen ----------
function setupObservers() {
  const rise = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('in'); rise.unobserve(e.target); }
  }), { rootMargin: '0px 0px -8% 0px' });
  $$('[data-rise]').forEach((el) => rise.observe(el));
  const demo = new IntersectionObserver((es) => es.forEach((e) => e.target.classList.toggle('play', e.isIntersecting)), { threshold: 0.45 });
  $$('[data-demo]').forEach((el) => demo.observe(el));
}

// ---------- cost calculator ----------
function setupCalc() {
  const g = (id) => document.getElementById(id);
  if (!g('c_conv')) return;
  const eur = (v) => '€' + Math.round(v).toLocaleString('en-US');
  const run = () => {
    const n = (id) => +g(id).value || 0;
    const tin = n('c_tin') / 0.75, tout = n('c_tout') / 0.75, days = n('c_days') || 1;
    const per = (tin * n('c_pin') + tout * n('c_pout')) / 1e6, api = per * n('c_conv') * days;
    const onp = n('c_hw') / 36 + n('c_ops'), be = per > 0 ? onp / (per * days) : Infinity;
    g('r_per').textContent = (per * 100).toFixed(1) + ' ct';
    g('r_api').textContent = eur(api);
    g('r_onp').textContent = eur(onp);
    g('r_be').textContent = isFinite(be) ? Math.round(be).toLocaleString('en-US') : 'never';
    g('verdict').textContent = api < onp
      ? `At this volume an AI service is about ${eur(onp - api)} a month cheaper. For patient data, running it yourself is a data protection decision, and that difference is what keeping everything in-house would cost.`
      : `At this volume your own server is about ${eur(api - onp)} a month cheaper and keeps the data in-house, so cost and data protection point the same way.`;
  };
  $$('.calc input').forEach((i) => i.addEventListener('input', run));
  run();
}

// ---------- sections and the menu ----------
const menuBtn = $('#menuBtn');
function setMenu(open) {
  root.classList.toggle('menu-open', open);
  if (M) M.setScrollLock(open);
  menuBtn.setAttribute('aria-expanded', String(open));
  menuBtn.firstElementChild.textContent = open ? 'Close' : 'Menu';
}
menuBtn.addEventListener('click', () => setMenu(!root.classList.contains('menu-open')));
addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
function heroText() {
  if (!stage || stage.mode !== 'static' || !stage.slot) return;
  const s = stage.slot.getBoundingClientRect(), c = $('.view.on .tab-hero-copy');
  if (!c || !s.width) return;
  const q = c.getBoundingClientRect();
  stage.setText([((q.left + q.right) / 2 - s.left) / s.width * 2 - 1, 1 - ((q.top + q.bottom) / 2 - s.top) / s.height * 2, q.width / s.width, q.height / s.height], 1);
}
function mountStage() {
  if (!stage) return;
  const slot = $('.view.on .slot');
  if (slot) stage.mount(slot, { mode: slot.dataset.stage, state: +(slot.dataset.state || 0) });
  stage.setText(null, 0);
  heroText();
}
function show(name, setHash = true) {
  if (!VIEWS.includes(name)) name = 'intro';
  setMenu(false);
  if (name === S.view) { toTop(); return; }
  S.view = name;
  $$('.view').forEach((v) => v.classList.toggle('on', v.id === 'view-' + name));
  $$('.menu-list a').forEach((a) => { if (a.dataset.view === name) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  toTop();
  S.y = 0;
  if (setHash && location.hash !== '#' + name) {
    try { history.replaceState(null, '', '#' + name); } catch (e) { location.hash = name; }
  }
  if (name === 'ai-cv') initCV();
  mountStage();
  measure();
}
function openCase(id) {
  show('projects');
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const el = document.getElementById('case-' + id);
    if (el) { if (M) M.scrollToY(docTop(el) - 60, true); else window.scrollTo({ top: docTop(el) - 60, behavior: 'smooth' }); }
  }));
}
document.addEventListener('click', (e) => {
  const open = e.target.closest('[data-open]');
  if (open) { e.preventDefault(); openCase(open.dataset.open); return; }
  const go = e.target.closest('[data-view],[data-go]');
  if (go) { e.preventDefault(); show(go.dataset.view || go.dataset.go); }
});
addEventListener('hashchange', () => show(location.hash.slice(1), false));

// ---------- buttons: the label rolls over, the button leans toward the pointer, a light follows it ----------
function setupButtons() {
  const fine = matchMedia('(pointer: fine)').matches;
  $$('.btn').forEach((b) => {
    const label = b.textContent.trim();
    if (!label || b.querySelector('.b-roll')) return;
    const roll = document.createElement('span'), a = document.createElement('span'), c = document.createElement('span');
    roll.className = 'b-roll'; a.textContent = label; c.textContent = label; c.setAttribute('aria-hidden', 'true');
    roll.append(a, c); b.textContent = ''; b.append(roll);
    if (!fine) return;
    b.addEventListener('pointermove', (e) => {
      const r = b.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      b.style.setProperty('--gx', x.toFixed(0) + 'px');
      b.style.setProperty('--gy', y.toFixed(0) + 'px');
      b.style.setProperty('--bx', ((x / r.width - 0.5) * 10).toFixed(1) + 'px');
      b.style.setProperty('--by', ((y / r.height - 0.5) * 8).toFixed(1) + 'px');
    });
    b.addEventListener('pointerleave', () => { b.style.setProperty('--bx', '0px'); b.style.setProperty('--by', '0px'); });
  });
}

// ---------- opening reel (plays once per visit; the hero has a button to watch it again) ----------
const reelEl = $('#reelIntro');
let reelBusy = false;
function playReel(force = false) {
  const el = reelEl;
  if (!el || reelBusy || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!force) {
    if (location.hash.replace('#', '') && location.hash !== '#intro') return;
    try { if (sessionStorage.getItem('reelSeen')) return; sessionStorage.setItem('reelSeen', '1'); } catch (e) { /* storage blocked: just play it */ }
  }
  reelBusy = true;
  const frames = $$('.rf', el), bar = $('.reel-bar', el);
  frames.forEach((f) => f.classList.remove('on', 'gone'));
  bar.style.setProperty('--rp', '0');
  el.classList.remove('leaving');
  root.classList.add('reeling');
  if (M) M.setScrollLock(true);
  let i = -1, timer = 0, ended = false;
  const STEP = 430, LAST = 1500;
  const finish = () => {
    if (ended) return; ended = true; clearTimeout(timer);
    el.classList.add('leaving');
    setTimeout(() => {
      root.classList.remove('reeling');
      el.classList.remove('leaving');
      frames.forEach((f) => f.classList.remove('on', 'gone'));
      if (M) M.setScrollLock(false);
      reelBusy = false;
    }, 820);
    $('#reelSkip').removeEventListener('click', finish);
    removeEventListener('wheel', finish); removeEventListener('touchstart', finish); removeEventListener('keydown', finish);
  };
  const next = () => {
    if (i >= 0) { frames[i].classList.remove('on'); frames[i].classList.add('gone'); const f = frames[i]; setTimeout(() => f.classList.remove('gone'), 300); }
    i++;
    if (i >= frames.length) return finish();
    frames[i].classList.add('on');
    bar.style.setProperty('--rp', ((i + 1) / frames.length).toFixed(3));
    timer = setTimeout(next, i === frames.length - 1 ? LAST : STEP);
  };
  $('#reelSkip').addEventListener('click', finish);
  // listen for "skip" gestures from the next frame on, so the click that started a replay doesn't end it
  setTimeout(() => {
    if (ended) return;
    addEventListener('wheel', finish, { passive: true }); addEventListener('touchstart', finish, { passive: true }); addEventListener('keydown', finish);
  }, 0);
  // start once the first pictures are ready, or after a short wait at most
  const ready = frames.map((f) => { const im = $('img', f); return im.decode ? im.decode().catch(() => {}) : Promise.resolve(); });
  Promise.race([Promise.all(ready), new Promise((r) => setTimeout(r, 2500))]).then(() => { if (!ended) timer = setTimeout(next, 120); });
}
const replayBtn = $('#reelReplay');
if (replayBtn) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) replayBtn.hidden = true;
  replayBtn.addEventListener('click', () => playReel(true));
}

// ---------- start ----------
playReel();
setupButtons();
setupJourney();
setupWords();
setupSlides();
setupPicks();
setupThread();
setupClosing();
setupCases();
setupCards();
setupObservers();
setupCalc();
show(location.hash.slice(1) || 'intro', false);
requestAnimationFrame(tick);

let rz = 0;
addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { measure(); heroText(); }, 120); });
new ResizeObserver(() => { clearTimeout(rz); rz = setTimeout(measure, 120); }).observe($('#main'));
(document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
  measure();
  heroText();
  requestAnimationFrame(() => root.classList.add('ready'));
});

// smooth scrolling, loaded separately so a failure can't break the page
import('./motion.js').then((m) => {
  M = m;
  M.initLenis();
  if (root.classList.contains('reeling')) M.setScrollLock(true);
}).catch(() => { /* stay with plain scrolling */ });

(async () => {
  const canvas = $('#stage');
  const s = new Stage(canvas);
  let ok = false;
  try { ok = await s.init('img/me.webp'); } catch (e) { ok = false; }
  if (!ok) { root.classList.add('no-gl'); canvas.remove(); return; }
  s.isNarrow = () => narrow.matches;
  stage = s;
  if (location.hostname === 'localhost') window.__st = s;   // test hook, local only
  mountStage();
})();
