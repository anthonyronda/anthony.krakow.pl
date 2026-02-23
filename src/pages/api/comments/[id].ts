import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/db';
import { validateToken } from '../../../lib/auth';

export const PATCH: APIRoute = async ({ request, params }) => {
  if (!validateToken(request)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return new Response(JSON.stringify({ error: 'Invalid id' }), { status: 400 });
  }

  let status: string;
  try {
    const body = await request.json();
    status = body?.status;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  if (status !== 'approved' && status !== 'rejected') {
    return new Response(JSON.stringify({ error: 'status must be approved or rejected' }), { status: 400 });
  }

  try {
    const db = getDb();
    const result = db.prepare('UPDATE comments SET status = ? WHERE id = ?').run(status, id);
    if (result.changes === 0) {
      return new Response(JSON.stringify({ error: 'Comment not found' }), { status: 404 });
    }
    return new Response(JSON.stringify({ ok: true, status }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('comment PATCH error', err);
    return new Response(JSON.stringify({ error: 'DB error' }), { status: 500 });
  }
};
