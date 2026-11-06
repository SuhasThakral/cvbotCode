import { apiKey, openai } from './_lib.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const out = { key: !!apiKey(), limits: !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) };
  if (!out.key) return res.status(503).json({ ok: false, ...out });
  try {
    const { response, model } = await openai([{ role: 'user', content: 'Reply with: ok' }], { maxTokens: 200, stream: false });
    const data = await response.json();
    out.model = model;
    out.reply = !!data.choices?.[0]?.message?.content;
    return res.status(out.reply ? 200 : 502).json({ ok: out.reply, ...out });
  } catch (e) {
    return res.status(502).json({ ok: false, ...out, upstream: e.status || 0 });
  }
}
