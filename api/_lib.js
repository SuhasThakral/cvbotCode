import { createHmac } from 'node:crypto';

const memory = new Map();

export const apiKey = () => process.env.openAI || process.env.OPENAI_API_KEY || '';

const MODELS = () => [process.env.OPENAI_MODEL, 'gpt-5-mini', 'gpt-4o-mini'].filter(Boolean);
let workingModel = null;

export function clientIp(req) {
  const h = req.headers['x-vercel-forwarded-for'] || req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || '';
  return String(h).split(',')[0].trim() || 'unknown';
}

export const hashIp = (ip) => createHmac('sha256', apiKey() || 'local').update(ip).digest('hex').slice(0, 32);

// Shared limits live in Supabase. If it is unreachable, a strict per-instance limit applies.
export async function take(ipHash, kind) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (url && key) {
    try {
      const r = await fetch(`${url}/rest/v1/rpc/cvbot_take`, {
        method: 'POST',
        headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ p_ip_hash: ipHash, p_kind: kind }),
        signal: AbortSignal.timeout(2500),
      });
      if (r.ok) return { ...(await r.json()), store: 'supabase' };
      console.error('limit store error', r.status);
    } catch (e) {
      console.error('limit store unreachable', e.name);
    }
  }
  const hour = Math.floor(Date.now() / 3600000);
  const k = `${ipHash}:${hour}`;
  const n = (memory.get(k) || 0) + 1;
  memory.set(k, n);
  if (memory.size > 2000) memory.clear();
  return { allowed: n <= 5, reason: 'ip', store: 'memory' };
}

// Calls OpenAI and falls through the model list if a model is unavailable.
export async function openai(messages, { maxTokens, stream }) {
  const models = workingModel ? [workingModel] : MODELS();
  let last = null;
  for (const model of models) {
    for (const effort of ['low', null]) {
      const body = { model, messages, max_completion_tokens: maxTokens, stream };
      if (effort) body.reasoning_effort = effort;
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (r.ok) {
        workingModel = model;
        return { response: r, model };
      }
      const text = await r.text();
      last = { status: r.status, text: text.slice(0, 300) };
      if (r.status !== 400 && r.status !== 404) {
        console.error('openai error', r.status, last.text);
        const err = new Error('upstream');
        err.status = r.status;
        throw err;
      }
      if (!/reasoning/i.test(text)) break;
    }
  }
  console.error('openai no model', last);
  const err = new Error('no model');
  err.status = last?.status || 500;
  throw err;
}
