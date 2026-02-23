import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/db';
import { validateToken } from '../../../lib/auth';

export const GET: APIRoute = ({ request }) => {
  if (!validateToken(request)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    const db = getDb();
    const rows = db
      .prepare(`SELECT * FROM comments WHERE status = 'pending' ORDER BY created_at ASC`)
      .all();
    return new Response(JSON.stringify(rows), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('pending comments error', err);
    return new Response(JSON.stringify({ error: 'DB error' }), { status: 500 });
  }
};
