import { defineMiddleware } from 'astro:middleware';
import { auth } from './lib/auth';
import { getDb } from './lib/db';

// Ensure the DB schema (including better-auth tables) is initialized at startup
// before any request handler calls auth.api.getSession.
getDb();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? '';

export const onRequest = defineMiddleware(async (context, next) => {
  try {
    const session = await auth.api.getSession({ headers: context.request.headers });
    // Only the seeded admin email is treated as admin.
    // If ADMIN_EMAIL is unset we fall back to any authenticated session (dev convenience).
    context.locals.isAdmin = !!(
      session && (!ADMIN_EMAIL || session.user.email === ADMIN_EMAIL)
    );
  } catch (err) {
    console.error('[middleware] auth.api.getSession error:', err);
    context.locals.isAdmin = false;
  }
  return next();
});
