import { CV, flatten } from './cv.js';

const $ = (id) => document.getElementById(id);
const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const sources = new Map(flatten().map((x) => [x.id, x]));
const STARTERS = [
  'What business results can he prove?',
  'How has he led teams?',
  'What has he built with AI?',
  'What does the CV not show?',
];

// CV
const item = (x) => {
  const inner = `${x.label ? `<b>${esc(x.label)}:</b> ` : ''}${esc(x.text)}${x.by ? ` <i>${esc(x.by)}</i>` : ''}`;
  const body = x.href ? `${inner} <a href="${esc(x.href)}" rel="noopener">View</a>` : inner;
  return `<li class="line" id="cv-${x.id}"><span class="item">${body}</span></li>`;
};
const list = (a) => `<ul>${a.map(item).join('')}</ul>`;

$('cv').innerHTML = `
  <header>
    <h1>${esc(CV.name)}</h1>
    <p class="role-line">${esc(CV.title)}, ${esc(CV.location)}</p>
    <p class="contact">
      ${CV.links.map((l) => `<a href="${esc(l.href)}" rel="noopener">${esc(l.label)}</a>`).join('')}
      <button type="button" id="printCv">Save as PDF</button>
    </p>
    <p class="lead">${esc(CV.lead)}</p>
  </header>
  ${list(CV.summary)}
  <section><h2>Key achievements</h2>${list(CV.achievements)}</section>
  <section><h2>Experience</h2>
    ${CV.experience.map((j) => `
      <article class="job">
        <div class="dates">${esc(j.dates)}</div>
        <div class="body">
          <h3>${esc(j.role)}</h3>
          <p class="where">${esc(j.company)}, ${esc(j.place)}</p>
          ${j.context ? `<p class="context">${esc(j.context)}</p>` : ''}
          ${list(j.bullets)}
        </div>
      </article>`).join('')}
  </section>
  <section><h2>Side projects and writing</h2>${list(CV.projects)}</section>
  <section><h2>Skills</h2>${list(CV.skills)}</section>
  <section><h2>Education</h2>${list(CV.education)}</section>
  <section><h2>What colleagues say</h2>${list(CV.recommendations)}</section>
  <p class="note">Questions and job ads go to OpenAI to create the answer, and this page doesn't save them. A hashed version of your IP address is kept for up to two days to limit usage. AI answers can contain mistakes, so check them against the CV.</p>
`;
$('printCv').addEventListener('click', () => window.print());

// Rendering
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
  const out = [];
  let bullets = [];
  const flush = () => { if (bullets.length) { out.push(`<ul>${bullets.join('')}</ul>`); bullets = []; } };
  for (const line of clean.split('\n')) {
    const t = line.trim();
    if (!t) { flush(); continue; }
    if (/^[-•*]\s/.test(t)) bullets.push(`<li>${inline(t.replace(/^[-•*]\s+/, ''))}</li>`);
    else { flush(); out.push(`<p>${inline(t)}</p>`); }
  }
  flush();
  return out.join('');
}

function markCited(el) {
  el.querySelectorAll('.cite').forEach((b) => $(`cv-${b.dataset.id}`)?.querySelector('.item').classList.add('marked'));
}
const clearMarks = () => document.querySelectorAll('.item.marked').forEach((m) => m.classList.remove('marked'));

document.addEventListener('click', (e) => {
  const b = e.target.closest('.cite');
  if (!b) return;
  const open = b.getAttribute('aria-expanded') === 'true';
  const host = b.closest('li, p');
  host.parentElement.querySelectorAll(`.quote[data-for="${b.dataset.id}"]`).forEach((q) => q.remove());
  b.setAttribute('aria-expanded', String(!open));
  if (open) return;
  const q = document.createElement('blockquote');
  q.className = 'quote';
  q.dataset.for = b.dataset.id;
  q.textContent = sources.get(b.dataset.id).text;
  host.after(q);
  if (matchMedia('(min-width: 1001px)').matches) $(`cv-${b.dataset.id}`)?.scrollIntoView({ block: 'center' });
});

// Requests
const history = [];
let busy = false;

function setBusy(v) {
  busy = v;
  document.querySelectorAll('.panel button[type=submit]').forEach((b) => { b.disabled = v; });
}

async function stream(kind, messages, target, scroller) {
  target.innerHTML = '<p class="waiting">Reading the CV</p>';
  setBusy(true);
  let text = '';
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind, messages }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "The assistant couldn't answer. Try again in a moment.");
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      text += decoder.decode(value, { stream: true });
      target.innerHTML = render(text);
      scroller.scrollTop = scroller.scrollHeight;
    }
    if (!text.trim()) throw new Error("The assistant couldn't answer. Try again in a moment.");
    markCited(target);
    return text;
  } catch (e) {
    const offline = e instanceof TypeError;
    target.classList.add('error');
    target.textContent = offline ? 'The connection failed. Check your network and try again.' : e.message;
    return null;
  } finally {
    setBusy(false);
  }
}

function bubble(parent, cls) {
  const d = document.createElement('div');
  d.className = `msg ${cls}`;
  parent.appendChild(d);
  return d;
}

async function ask(question) {
  if (busy || !question.trim()) return;
  $('starters').hidden = true;
  const log = $('log');
  bubble(log, 'user').textContent = question;
  const answer = bubble(log, 'bot');
  log.scrollTop = log.scrollHeight;
  history.push({ role: 'user', content: question });
  clearMarks();
  const reply = await stream('ask', history, answer, log);
  if (reply) history.push({ role: 'assistant', content: reply });
  else history.pop();
}

$('starters').innerHTML = STARTERS.map((q) => `<button type="button">${esc(q)}</button>`).join('');
$('starters').addEventListener('click', (e) => { if (e.target.tagName === 'BUTTON') ask(e.target.textContent); });

$('askForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const q = $('question').value;
  $('question').value = '';
  ask(q);
});
$('question').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); $('askForm').requestSubmit(); }
});

$('fitForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const ad = $('jobAd').value.trim();
  if (busy) return;
  const box = $('fitResult');
  box.className = 'msg bot';
  if (ad.length < 80) {
    box.classList.add('error');
    box.textContent = 'Paste more of the job ad so it can be compared with the CV.';
    return;
  }
  clearMarks();
  await stream('fit', [{ role: 'user', content: ad }], box, $('fitLog'));
});

// Tabs and mobile sheet
function selectTab(fit) {
  $('tabAsk').setAttribute('aria-selected', String(!fit));
  $('tabFit').setAttribute('aria-selected', String(fit));
  $('viewAsk').hidden = fit;
  $('viewFit').hidden = !fit;
}
$('tabAsk').addEventListener('click', () => selectTab(false));
$('tabFit').addEventListener('click', () => selectTab(true));
$('openPanel').addEventListener('click', () => { $('panel').classList.add('open-sheet'); $('closePanel').focus(); });
$('closePanel').addEventListener('click', () => { $('panel').classList.remove('open-sheet'); $('openPanel').focus(); });
