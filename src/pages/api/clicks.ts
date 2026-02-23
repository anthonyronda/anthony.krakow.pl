import type { APIRoute } from 'astro';
import { getDb } from '../../lib/db';

export const POST: APIRoute = async ({ request }) => {
  let url: string;
  try {
    const body = await request.json();
    url = body?.url;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  if (!url || typeof url !== 'string' || !url.startsWith('http')) {
    return new Response(JSON.stringify({ error: 'Invalid url' }), { status: 400 });
  }

  try {
    const db = getDb();
    db.prepare('INSERT OR IGNORE INTO link_clicks (url, clicks) VALUES (?, 0)').run(url);
    db.prepare('UPDATE link_clicks SET clicks = clicks + 1 WHERE url = ?').run(url);
    const row = db.prepare('SELECT clicks FROM link_clicks WHERE url = ?').get(url) as { clicks: number };
    return new Response(JSON.stringify({ clicks: row.clicks }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('clicks error', err);
    return new Response(JSON.stringify({ error: 'DB error' }), { status: 500 });
  }
};
