import type { APIRoute } from 'astro';
import { getDb } from '../../lib/db';

export const POST: APIRoute = async ({ request }) => {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const { page_slug, locale, anchor_text, range_start, range_end, author_name, author_email, body: commentBody, honeypot } = body as Record<string, unknown>;

  // Honeypot spam check
  if (honeypot) {
    return new Response(JSON.stringify({ ok: true }), { status: 201 });
  }

  if (
    typeof page_slug !== 'string' || !page_slug ||
    typeof locale !== 'string' || !['en', 'pl'].includes(locale) ||
    typeof anchor_text !== 'string' || !anchor_text || anchor_text.length > 500 ||
    typeof range_start !== 'number' ||
    typeof range_end !== 'number' ||
    typeof author_name !== 'string' || !author_name || author_name.length > 100 ||
    typeof author_email !== 'string' || !author_email || author_email.length > 200 ||
    typeof commentBody !== 'string' || !commentBody || commentBody.length > 2000
  ) {
    return new Response(JSON.stringify({ error: 'Invalid fields' }), { status: 400 });
  }

  try {
    const db = getDb();
    db.prepare(
      `INSERT INTO comments (page_slug, locale, anchor_text, range_start, range_end, author_name, author_email, body)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(page_slug, locale, anchor_text, range_start, range_end, author_name, author_email, commentBody);
    return new Response(JSON.stringify({ ok: true }), { status: 201, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('comments POST error', err);
    return new Response(JSON.stringify({ error: 'DB error' }), { status: 500 });
  }
};
