import { CV, IMPACT, PATH, flatten } from './cv.js';

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const sources = new Map(flatten().map((x) => [x.id, x]));
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const hasGsap = !reduced && window.gsap && window.ScrollTrigger;
const STARTERS = ['What business results can he prove?', 'How has he led teams?', 'What has he built with AI?', 'What does the CV not show?'];

/* ---------- Static content ---------- */

$('heroChips').innerHTML = STARTERS.map((q) => `<button type="button">${esc(q)}</button>`).join('');
$('starters').innerHTML = STARTERS.map((q) => `<button type="button">${esc(q)}</button>`).join('');

const VIZ = {
  bars: () => `<div class="viz-bar before"><span>Before</span></div><div class="viz-bar after"><span>After</span></div>`,
  team: () => `<div class="viz-team">${'<i></i>'.repeat(8)}</div>`,
  shrink: () => `<div class="viz-shrink"><small><span>Manual reporting, before</span></small><div><b class="was"></b></div><small><span>After</span><span>−70%+</span></small><div><b class="now"></b></div></div>`,
  clock: () => `<svg class="viz-clock" viewBox="0 0 96 96"><circle cx="48" cy="48" r="40" fill="none" stroke="#18365F" stroke-width="10"/><circle class="arc" cx="48" cy="48" r="40" fill="none" stroke="#FFD84D" stroke-width="10" stroke-linecap="round" transform="rotate(-90 48 48)" pathLength="100" stroke-dasharray="100" stroke-dashoffset="50"/><text x="48" y="54" text-anchor="middle" fill="#EEF3F9" font-size="15" font-weight="650">−30m</text></svg>`,
  down: () => `<svg class="viz-line" viewBox="0 0 200 96" preserveAspectRatio="none"><path class="trend" d="M0 22 L40 26 L80 20 L120 44 L160 62 L200 70" fill="none" stroke="#5AA9FF" stroke-width="4" stroke-linejoin="round" pathLength="100" stroke-dasharray="100" stroke-dashoffset="0" vector-effect="non-scaling-stroke"/></svg>`,
  up: () => `<svg class="viz-line" viewBox="0 0 200 96" preserveAspectRatio="none"><path class="trend" d="M0 74 L40 70 L80 72 L120 50 L160 34 L200 22" fill="none" stroke="#FFD84D" stroke-width="4" stroke-linejoin="round" pathLength="100" stroke-dasharray="100" stroke-dashoffset="0" vector-effect="non-scaling-stroke"/></svg>`,
};

$('impactGrid').innerHTML = IMPACT.map((m, i) => `
  <article class="metric" data-i="${i}">
    <span class="metric-where">${esc(m.where)}</span>
    <div class="metric-num"><span>${esc(m.before)}</span><span class="count" data-to="${m.num}">${m.num}</span><span>${esc(m.after)}</span></div>
    <div class="metric-label">${esc(m.label)}</div>
    <div class="metric-detail">${esc(m.detail)}</div>
    <div class="metric-viz kind-${m.viz}">${VIZ[m.viz]()}</div>
    <span class="metric-ask" aria-hidden="true">Ask how</span>
    <button class="metric-link" type="button" data-ask="${esc(m.ask)}" aria-label="${esc(m.ask)}"></button>
  </article>`).join('');

// Final visual state. GSAP animates from zero if motion is allowed.
document.querySelectorAll('.kind-bars .before').forEach((b) => { b.style.height = '62%'; });
document.querySelectorAll('.kind-bars .after').forEach((b) => { b.style.height = '93%'; });
document.querySelectorAll('.viz-shrink .now').forEach((b) => { b.style.transform = 'scaleX(.3)'; });

$('careerStops').innerHTML = PATH.map((p, i) => `
  <li class="stop ${p.kind} ${i === PATH.length - 1 ? 'now' : ''} below">
    <span class="stop-dot"></span>
    <div class="stop-card"><div class="stop-year">${esc(p.year)}</div><div class="stop-title">${esc(p.title)}</div><div class="stop-org">${esc(p.org)}</div></div>
  </li>`).join('');

$('stackRows').innerHTML = CV.skills.map((s) => `
  <div class="stack-row ${/AI/.test(s.label) ? 'ai' : ''}"><h3>${esc(s.label)}</h3>
  <div class="stack-tools">${s.text.split(/,\s*/).map((t) => `<span class="tool">${esc(t)}</span>`).join('')}</div></div>`).join('');

$('builtGrid').innerHTML = CV.projects.map((p) => `
  <a class="build" href="${esc(p.href)}" rel="noopener" target="_blank">
    <h3>${esc(p.label)}</h3><p>${esc(p.text)}</p>
    <span>${p.href.includes('medium') ? 'Read on Medium' : 'View on GitHub'}</span>
  </a>`).join('');

$('quotes').innerHTML = CV.recommendations.map((q) => `
  <blockquote><p>“${esc(q.text)}”</p><cite>${esc(q.by)}</cite></blockquote>`).join('');

$('contactLinks').innerHTML = CV.links.map((l) => `<a href="${esc(l.href)}" rel="noopener" ${l.href.startsWith('http') ? 'target="_blank"' : ''}>${esc(l.label)}</a>`).join('');

const line = (x) => {
  const inner = `${x.label ? `<b>${esc(x.label)}:</b> ` : ''}${esc(x.text)}${x.by ? ` <i>${esc(x.by)}</i>` : ''}`;
  return `<li class="line" id="cv-${x.id}"><span class="item">${inner}</span></li>`;
};
const list = (a) => `<ul>${a.map(line).join('')}</ul>`;
$('fullCv').innerHTML = `
  <p class="print-only"><b>${esc(CV.name)}</b>, ${esc(CV.title)}, ${esc(CV.location)}. suhas.thakral@whu.edu, linkedin.com/in/suhas-thakral-6974a479</p>
  <h3>Summary</h3><p>${esc(CV.lead)}</p>${list(CV.summary)}
  <h3>Key achievements</h3>${list(CV.achievements)}
  <h3>Experience</h3>
  ${CV.experience.map((j) => `
    <article class="job"><div class="dates">${esc(j.dates)}</div>
      <div><h4>${esc(j.role)}</h4><p class="where">${esc(j.company)}, ${esc(j.place)}${j.context ? `. ${esc(j.context)}` : ''}</p>${list(j.bullets)}</div>
    </article>`).join('')}
  <h3>Side projects and writing</h3>${list(CV.projects)}
  <h3>Skills</h3>${list(CV.skills)}
  <h3>Education</h3>${list(CV.education)}
  <h3>What colleagues say</h3>${list(CV.recommendations)}`;
$('printCv').addEventListener('click', () => window.print());

// Photo: drop photo.jpg in the repo root and it replaces the monogram.
const photo = new Image();
photo.alt = 'Suhas Thakral';
photo.onload = () => { const f = document.querySelector('.portrait-frame'); f.innerHTML = ''; f.appendChild(photo); };
photo.src = '/photo.jpg';

/* ---------- Data graph ---------- */

const graph = (() => {
  const canvas = $('graph');
  const ctx = canvas.getContext('2d');
  const tip = $('graphTip');
  const groupOf = (x) => {
    if (x.section === 'Summary') return 'Profile';
    if (x.section === 'Key achievements') return 'Impact';
    if (x.section.includes('HYGH')) return 'HYGH';
    if (x.section.includes('Atheneum')) return 'Atheneum';
    if (/Smunch|Medigo|Aon/.test(x.section)) return 'Early career';
    if (x.section === 'Side projects') return 'Builds';
    if (x.section === 'Skills') return 'Stack';
    if (x.section === 'Education') return 'Education';
    return 'Voices';
  };
  const GROUPS = ['Impact', 'HYGH', 'Stack', 'Builds', 'Voices', 'Education', 'Early career', 'Atheneum', 'Profile'];
  const items = flatten();
  let W = 0; let H = 0; let dpr = 1; let centers = {}; let origin = { x: 0, y: 0 };
  let mouse = { x: -999, y: -999, px: 0, py: 0 };
  let hover = null; let running = true; let t0 = performance.now();
  const glow = new Map();

  const nodes = items.map((x, i) => {
    const g = groupOf(x);
    const seed = Math.sin(i * 91.7) * 10000;
    const rnd = (k) => { const v = Math.sin(seed + k * 12.9898) * 43758.5453; return v - Math.floor(v); };
    return { ...x, g, a: rnd(1) * Math.PI * 2, r: 0.35 + rnd(2) * 0.65, ph: rnd(3) * 6.28, sp: 0.2 + rnd(4) * 0.4,
      size: g === 'Impact' ? 5.5 : g === 'Stack' ? 3 : 4, x: 0, y: 0 };
  });
  const byGroup = GROUPS.map((g) => nodes.filter((n) => n.g === g));
  const links = [];
  byGroup.forEach((ns) => ns.forEach((n, i) => { if (i) links.push([ns[i - 1], n]); if (i > 1 && i % 2 === 0) links.push([ns[0], n]); }));
  const cross = [['Impact', 'HYGH'], ['Impact', 'Atheneum'], ['HYGH', 'Stack'], ['Stack', 'Builds'], ['Atheneum', 'Voices'], ['Profile', 'Education'], ['Early career', 'Atheneum'], ['Profile', 'Impact']];

  function layout() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    const mobile = W < 760;
    const pr = document.querySelector('.portrait').getBoundingClientRect(); const cr = canvas.getBoundingClientRect();
    const cx = pr.left - cr.left + pr.width / 2; const cy = pr.top - cr.top + pr.height / 2;
    origin = { x: cx, y: cy };
    const rx = mobile ? W * 0.34 : Math.min(cx - W * 0.42, W - cx - 24, 520); const ry = mobile ? pr.height * 0.95 : Math.min(cy - 110, H - cy - 60, 330);
    GROUPS.forEach((g, i) => {
      const a = (i / GROUPS.length) * Math.PI * 2 - Math.PI / 2;
      centers[g] = { x: cx + Math.cos(a) * rx, y: cy + Math.sin(a) * ry, label: g };
    });
    nodes.forEach((n) => { n.spread = (mobile ? 22 : 54) * n.r; });
  }

  function frame(now) {
    if (!running) return;
    const t = Math.max(0, (now - t0) / 1000);
    const intro = reduced ? 1 : Math.min(1, t / 1.8);
    const ease = 1 - Math.pow(1 - intro, 3);
    mouse.px += ((mouse.x > 0 ? (mouse.x - W / 2) / W : 0) - mouse.px) * 0.05;
    mouse.py += ((mouse.y > 0 ? (mouse.y - H / 2) / H : 0) - mouse.py) * 0.05;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    nodes.forEach((n) => {
      const c = centers[n.g];
      const wob = reduced ? 0 : Math.sin(t * n.sp + n.ph) * 6;
      const tx = c.x + Math.cos(n.a + (reduced ? 0 : t * 0.04)) * (n.spread + wob) - mouse.px * 30 * n.r;
      const ty = c.y + Math.sin(n.a + (reduced ? 0 : t * 0.04)) * (n.spread + wob) * 0.8 - mouse.py * 30 * n.r;
      n.x = origin.x + (tx - origin.x) * ease; n.y = origin.y + (ty - origin.y) * ease;
    });

    ctx.lineWidth = 1;
    cross.forEach(([a, b]) => {
      const A = centers[a]; const B = centers[b];
      ctx.strokeStyle = 'rgba(90,169,255,0.10)';
      ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke();
    });
    links.forEach(([a, b]) => {
      const lit = glow.has(a.id) && glow.has(b.id);
      ctx.strokeStyle = lit ? 'rgba(255,216,77,0.7)' : 'rgba(154,176,203,0.16)';
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    });
    const lit = [...glow.keys()].map((id) => nodes.find((n) => n.id === id)).filter(Boolean);
    for (let i = 1; i < lit.length; i++) {
      ctx.strokeStyle = 'rgba(255,216,77,0.55)'; ctx.setLineDash([4, 6]);
      ctx.beginPath(); ctx.moveTo(lit[i - 1].x, lit[i - 1].y); ctx.lineTo(lit[i].x, lit[i].y); ctx.stroke();
      ctx.setLineDash([]);
    }

    nodes.forEach((n) => {
      const g = glow.get(n.id);
      const isHover = hover === n;
      if (g !== undefined) {
        const p = (t * 1.6 + g) % 1;
        ctx.strokeStyle = `rgba(255,216,77,${0.6 * (1 - p)})`;
        ctx.beginPath(); ctx.arc(n.x, n.y, n.size + 4 + p * 18, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.fillStyle = g !== undefined || isHover ? '#FFD84D' : n.g === 'Impact' ? 'rgba(255,216,77,0.85)' : n.g === 'Stack' ? 'rgba(154,176,203,0.7)' : 'rgba(90,169,255,0.9)';
      ctx.beginPath(); ctx.arc(n.x, n.y, (isHover ? n.size + 2 : n.size) * ease, 0, Math.PI * 2); ctx.fill();
    });

    ctx.font = '600 12px Bricolage, system-ui, sans-serif';
    ctx.textAlign = 'center';
    GROUPS.forEach((g) => {
      const c = centers[g];
      ctx.fillStyle = `rgba(238,243,249,${0.55 * ease})`;
      ctx.fillText(g, c.x - mouse.px * 12, c.y - mouse.py * 12 + 4);
    });

    if (!reduced) requestAnimationFrame(frame);
  }

  function pick(x, y) {
    let best = null; let d = 16;
    nodes.forEach((n) => { const dd = Math.hypot(n.x - x, n.y - y); if (dd < d) { d = dd; best = n; } });
    return best;
  }

  const hero = canvas.parentElement;
  hero.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    if (e.target.closest('.hero-copy, .portrait, form, button')) { hover = null; tip.hidden = true; canvas.style.cursor = ''; return; }
    hover = pick(mouse.x, mouse.y);
    canvas.style.cursor = hover ? 'pointer' : '';
    if (hover) {
      tip.innerHTML = `<b>${esc(hover.g)}</b>${esc(hover.text.length > 160 ? hover.text.slice(0, 157) + '…' : hover.text)}`;
      tip.hidden = false;
      const tx = Math.min(mouse.x + 16, W - 316); const ty = Math.max(mouse.y - 20, 70);
      tip.style.left = `${tx}px`; tip.style.top = `${ty}px`;
    } else tip.hidden = true;
    if (reduced) frame(performance.now());
  });
  hero.addEventListener('pointerleave', () => { mouse.x = mouse.y = -999; hover = null; tip.hidden = true; });
  canvas.addEventListener('click', () => {
    if (!hover) return;
    const subject = hover.text.split(':')[0].slice(0, 80);
    openDrawer();
    ask(`Tell me more about this: ${subject}`);
  });

  new IntersectionObserver(([e]) => {
    const was = running; running = e.isIntersecting;
    if (running && !was && !reduced) requestAnimationFrame(frame);
  }).observe(canvas);

  addEventListener('resize', () => { layout(); if (reduced) frame(performance.now()); });
  document.fonts?.ready.then(() => { layout(); frame(performance.now()); });
  layout();
  requestAnimationFrame(frame);

  return {
    nodes,
    light(ids) { glow.clear(); ids.forEach((id, i) => glow.set(id, i * 0.17)); if (reduced) frame(performance.now()); },
  };
})();

/* ---------- Answers ---------- */

const CITE = /\[((?:[a-z]\d)(?:\s*,\s*[a-z]\d)*)\]/g;

function inline(text) {
  return esc(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(CITE, (_, ids) => ids.split(',').map((raw) => {
      const id = raw.trim();
      if (!sources.has(id)) return '';
      return `<button type="button" class="cite" data-id="${id}" aria-expanded="false" aria-label="Show source ${id}">${id}</button>`;
    }).join(''));
}

function render(text) {
  const clean = text.replace(/\[[a-z]?\d?(?:\s*,\s*[a-z]?\d?)*$/, '');
  const out = []; let bullets = [];
  const flush = () => { if (bullets.length) { out.push(`<ul>${bullets.join('')}</ul>`); bullets = []; } };
  for (const l of clean.split('\n')) {
    const t = l.trim();
    if (!t) { flush(); continue; }
    if (/^[-•*]\s/.test(t)) bullets.push(`<li>${inline(t.replace(/^[-•*]\s+/, ''))}</li>`);
    else { flush(); out.push(`<p>${inline(t)}</p>`); }
  }
  flush();
  return out.join('');
}

const citedIds = (el) => [...new Set([...el.querySelectorAll('.cite')].map((b) => b.dataset.id))];

function markCited(el) {
  document.querySelectorAll('.item.marked').forEach((m) => m.classList.remove('marked'));
  const ids = citedIds(el);
  ids.forEach((id) => $(`cv-${id}`)?.querySelector('.item').classList.add('marked'));
  graph.light(ids);
}

document.addEventListener('click', (e) => {
  const b = e.target.closest('.cite');
  if (!b) return;
  const open = b.getAttribute('aria-expanded') === 'true';
  const host = b.closest('li, p, .req-why');
  host.parentElement.querySelectorAll(`.quote[data-for="${b.dataset.id}"]`).forEach((q) => q.remove());
  b.setAttribute('aria-expanded', String(!open));
  if (open) return;
  const q = document.createElement('blockquote');
  q.className = 'quote';
  q.dataset.for = b.dataset.id;
  q.textContent = sources.get(b.dataset.id).text;
  host.after(q);
});

let busy = false;
function setBusy(v) { busy = v; document.querySelectorAll('#askForm button, #heroAsk button, #fitForm button').forEach((b) => { b.disabled = v; }); }

async function stream(kind, messages, target, scroller, onDone) {
  target.innerHTML = '<p class="waiting">Reading the CV</p>';
  target.classList.remove('error');
  setBusy(true);
  let text = '';
  try {
    const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind, messages }) });
    if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || "The assistant couldn't answer. Try again in a moment."); }
    const reader = res.body.getReader(); const dec = new TextDecoder();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      text += dec.decode(value, { stream: true });
      target.innerHTML = render(text);
      if (scroller) scroller.scrollTop = scroller.scrollHeight;
    }
    if (!text.trim()) throw new Error("The assistant couldn't answer. Try again in a moment.");
    if (onDone) onDone(text);
    markCited(target);
    return text;
  } catch (e) {
    target.classList.add('error');
    target.textContent = e instanceof TypeError ? 'The connection failed. Check your network and try again.' : e.message;
    return null;
  } finally { setBusy(false); }
}

/* ---------- Drawer ---------- */

const drawer = $('drawer'); const scrim = $('scrim');
let lastFocus = null;
function openDrawer() {
  if (drawer.classList.contains('open')) return;
  lastFocus = document.activeElement;
  drawer.classList.add('open'); drawer.setAttribute('aria-hidden', 'false'); scrim.hidden = false;
  window.__lenis?.stop();
  setTimeout(() => $('question').focus({ preventScroll: true }), 50);
}
function closeDrawer() {
  drawer.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true'); scrim.hidden = true;
  window.__lenis?.start();
  lastFocus?.focus?.({ preventScroll: true });
}
document.querySelectorAll('[data-open-ask]').forEach((b) => b.addEventListener('click', openDrawer));
$('closeDrawer').addEventListener('click', closeDrawer);
scrim.addEventListener('click', closeDrawer);
addEventListener('keydown', (e) => { if (e.key === 'Escape' && drawer.classList.contains('open')) closeDrawer(); });

const history = [];
function bubble(cls) { const d = document.createElement('div'); d.className = `msg ${cls}`; $('log').appendChild(d); return d; }

async function ask(question) {
  if (busy || !question.trim()) return;
  openDrawer();
  $('starters').hidden = true;
  bubble('user').textContent = question;
  const answer = bubble('bot');
  history.push({ role: 'user', content: question });
  const reply = await stream('ask', history, answer, $('log'));
  if (reply) history.push({ role: 'assistant', content: reply }); else history.pop();
}

const pickStarter = (e) => { if (e.target.tagName === 'BUTTON') ask(e.target.textContent); };
$('starters').addEventListener('click', pickStarter);
$('heroChips').addEventListener('click', pickStarter);
$('impactGrid').addEventListener('click', (e) => { const b = e.target.closest('[data-ask]'); if (b) ask(b.dataset.ask); });
$('heroAsk').addEventListener('submit', (e) => { e.preventDefault(); const q = $('heroQuestion').value; $('heroQuestion').value = ''; ask(q); });
$('askForm').addEventListener('submit', (e) => { e.preventDefault(); const q = $('question').value; $('question').value = ''; ask(q); });
$('question').addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); $('askForm').requestSubmit(); } });

/* ---------- Job fit ---------- */

const REQ = /^[-•*]\s+\*\*(.+?)\*\*\s*\((Strong|Partial|Gap)\)\s*:?\s*(.*)$/i;
function fitVisual(text, box) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const reqs = []; const intro = [];
  lines.forEach((l) => { const m = l.match(REQ); if (m) reqs.push({ name: m[1], level: m[2].toLowerCase(), why: m[3] }); else if (!reqs.length) intro.push(l); });
  if (reqs.length < 2) return;
  const cls = { strong: 's', partial: 'p', gap: 'g' };
  const label = { strong: 'Strong', partial: 'Partial', gap: 'Gap' };
  box.innerHTML = `
    <p class="fit-overall">${inline(intro.join(' '))}</p>
    <div class="fit-score" aria-hidden="true">${reqs.map((r) => `<i class="${cls[r.level]}"></i>`).join('')}</div>
    ${reqs.map((r) => `
      <div class="req ${cls[r.level]}">
        <div class="req-name">${inline(r.name)}</div><span class="req-tag ${cls[r.level]}">${label[r.level]}</span>
        <div class="req-bar"><b></b></div>
        <div class="req-why">${inline(r.why)}</div>
      </div>`).join('')}`;
  box.querySelectorAll('.req').forEach((el) => { const b = el.querySelector('.req-bar b'); b.style.transform = `scaleX(${el.classList.contains('s') ? 1 : el.classList.contains('p') ? 0.55 : 0.12})`; });
  if (hasGsap) {
    gsap.from(box.querySelectorAll('.fit-score i'), { scaleX: 0, duration: 0.5, stagger: 0.06, ease: 'power3.out' });
    gsap.from(box.querySelectorAll('.req'), { opacity: 0, y: 12, duration: 0.5, stagger: 0.08, ease: 'power3.out' });
    gsap.from(box.querySelectorAll('.req-bar b'), { scaleX: 0, duration: 0.9, stagger: 0.08, ease: 'power3.out', delay: 0.15 });
  }
}

$('fitForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (busy) return;
  const ad = $('jobAd').value.trim();
  const box = $('fitResult');
  if (ad.length < 80) { box.classList.add('error'); box.textContent = 'Paste more of the job ad so it can be compared with the CV.'; return; }
  await stream('fit', [{ role: 'user', content: ad }], box, null, (text) => fitVisual(text, box));
});

/* ---------- Career curve ---------- */

function drawCareer() {
  const track = $('careerTrack'); const svg = $('careerCurve');
  if (innerWidth <= 760) return;
  const W = track.clientWidth; const H = track.clientHeight; const pad = 24; const top = 70;
  const pts = PATH.map((p, i) => [pad + (i * (W - pad * 2 - 150)) / (PATH.length - 1), H - 60 - (p.level / 5) * (H - 60 - top)]);
  document.querySelectorAll('.stop').forEach((s, i) => { s.style.left = `${pts[i][0]}px`; s.style.top = `${pts[i][1]}px`; });
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1]; const [x1, y1] = pts[i]; const mx = (x0 + x1) / 2;
    d += ` C${mx} ${y0} ${mx} ${y1} ${x1} ${y1}`;
  }
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  if (!svg.firstChild) svg.innerHTML = '<path class="base" fill="none" stroke="#18365F" stroke-width="2"/><path id="careerLine" fill="none" stroke="#FFD84D" stroke-width="3" stroke-linecap="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="0"/>';
  svg.querySelectorAll('path').forEach((p) => p.setAttribute('d', d));
}
drawCareer();

/* ---------- Motion ---------- */

if (hasGsap) {
  gsap.registerPlugin(ScrollTrigger);
  if (window.Lenis) {
    const lenis = new Lenis({ lerp: 0.1 });
    window.__lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    document.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
      const el = document.querySelector(a.getAttribute('href'));
      if (el) { e.preventDefault(); lenis.scrollTo(el, { offset: -64 }); }
    }));
  }

  // Hero intro: the one orchestrated moment.
  const name = $('heroName');
  name.querySelectorAll('span').forEach((w) => { w.innerHTML = [...w.textContent].map((c) => `<span class="ch" aria-hidden="true">${esc(c)}</span>`).join(''); });
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  tl.from('.hero-name .ch', { yPercent: 110, rotate: 6, opacity: 0, duration: 1.2, stagger: 0.035 })
    .from('#heroKicker', { opacity: 0, y: 10, duration: 0.8 }, 0.2)
    .from('.hero-line, .hero-ask, .hero-chips', { opacity: 0, y: 20, duration: 1, stagger: 0.08 }, 0.5)
    .from('.portrait', { scale: 0.8, opacity: 0, duration: 1.4 }, 0.3)
    .from('.hero-hint', { opacity: 0, duration: 1 }, 1.2);

  ScrollTrigger.create({ start: 80, onUpdate: (s) => $('nav').classList.toggle('solid', s.scroll() > 80) });
  gsap.to('.hero-inner', { yPercent: -12, opacity: 0.3, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  // Impact counters and charts.
  document.querySelectorAll('.metric').forEach((m) => {
    const st = { trigger: m, start: 'top 82%', once: true };
    const c = m.querySelector('.count'); const to = +c.dataset.to; const v = { n: 0 };
    gsap.to(v, { n: to, duration: 1.6, ease: 'power3.out', scrollTrigger: st, onUpdate: () => { c.textContent = Math.round(v.n); } });
    c.textContent = '0';
    const viz = m.querySelector('.metric-viz');
    if (viz.classList.contains('kind-bars')) gsap.from(viz.querySelectorAll('.viz-bar'), { scaleY: 0, duration: 1.2, stagger: 0.2, ease: 'power3.out', scrollTrigger: st });
    if (viz.classList.contains('kind-team')) gsap.from(viz.querySelectorAll('i'), { scale: 0, duration: 0.6, stagger: 0.12, ease: 'back.out(2)', scrollTrigger: st });
    if (viz.classList.contains('kind-shrink')) {
      gsap.from(viz.querySelector('.was'), { scaleX: 0, duration: 0.8, ease: 'power3.out', scrollTrigger: st });
      gsap.fromTo(viz.querySelector('.now'), { scaleX: 1 }, { scaleX: 0.3, duration: 1.4, delay: 0.6, ease: 'power3.inOut', scrollTrigger: st });
    }
    if (viz.classList.contains('kind-clock')) gsap.from(viz.querySelector('.arc'), { attr: { 'stroke-dashoffset': 100 }, duration: 1.4, ease: 'power3.out', scrollTrigger: st });
    viz.querySelectorAll('.trend').forEach((p) => gsap.from(p, { attr: { 'stroke-dashoffset': 100 }, duration: 1.6, ease: 'power2.inOut', scrollTrigger: st }));
  });

  // Career: pin and draw the path as you scroll.
  const mm = gsap.matchMedia();
  mm.add('(min-width: 761px)', () => {
    const stops = gsap.utils.toArray('.stop');
    const tlc = gsap.timeline({ scrollTrigger: { trigger: '#careerPin', start: 'top top', end: '+=140%', scrub: 0.6, pin: true } });
    tlc.fromTo('#careerLine', { attr: { 'stroke-dashoffset': 1 } }, { attr: { 'stroke-dashoffset': 0 }, ease: 'none', duration: 1 }, 0);
    stops.forEach((s, i) => tlc.from(s.children, { opacity: 0, scale: 0.6, y: 10, duration: 0.08, stagger: 0.02 }, (i / (stops.length - 1)) * 0.92));
    return () => {};
  });

  addEventListener('resize', () => { drawCareer(); ScrollTrigger.refresh(); });
} else {
  addEventListener('scroll', () => $('nav').classList.toggle('solid', scrollY > 80), { passive: true });
  addEventListener('resize', drawCareer);
}
