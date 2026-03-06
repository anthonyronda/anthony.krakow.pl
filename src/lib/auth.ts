import { betterAuth } from 'better-auth';
import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = process.env.DB_PATH ?? path.join(process.cwd(), 'db.sqlite');

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET ?? 'change-me',
  baseURL: process.env.BETTER_AUTH_URL ?? process.env.SITE_URL ?? 'http://localhost:4321',
  database: new Database(DB_PATH),
  emailAndPassword: {
    enabled: true,
  },
});
