import { auth } from '../../../lib/auth';
import type { APIRoute } from 'astro';

export const prerender = false;

export const ALL: APIRoute = ({ request }) => auth.handler(request);
