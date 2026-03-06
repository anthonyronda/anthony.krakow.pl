/**
 * One-time script to create the admin user in the better-auth `user` and
 * `account` tables. Run once on the server after initial deployment:
 *
 *   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=s3cret npx tsx scripts/seed-admin.ts
 *
 * Required env vars:
 *   ADMIN_EMAIL    — the admin's login email
 *   ADMIN_PASSWORD — the admin's login password (min 8 chars recommended)
 *   DB_PATH        — path to db.sqlite (defaults to ./db.sqlite)
 *   BETTER_AUTH_SECRET — must match the value used by the running server
 */

import { auth } from '../src/lib/auth.ts';

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
const name = process.env.ADMIN_NAME ?? 'Admin';

if (!email || !password) {
  console.error('ERROR: ADMIN_EMAIL and ADMIN_PASSWORD must be set.');
  process.exit(1);
}

try {
  await auth.api.signUpEmail({
    body: { email, password, name },
  });
  console.log(`Admin user created: ${email}`);
} catch (err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  if (message.toLowerCase().includes('already') || message.toLowerCase().includes('exist') || message.toLowerCase().includes('unique')) {
    console.log(`Admin user already exists: ${email}`);
  } else {
    console.error('Failed to create admin user:', message);
    process.exit(1);
  }
}
