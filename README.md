# Suhas Thakral's AI CV

A CV page with an assistant that answers only from the CV and cites the exact lines it used.

- `cv.js` holds all content. Edit this file to update the page and the assistant.
- `api/chat.js` streams answers from OpenAI. `api/health.js` checks the setup.
- Limits are enforced in Supabase by `cvbot_take`: 20 requests per hour per visitor, 5 job checks per day per visitor, 300 requests per day overall.

Environment variables: `openAI` (or `OPENAI_API_KEY`), `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and optionally `OPENAI_MODEL`.
