const ADMIN_TOKEN = process.env.ADMIN_TOKEN ?? '';

export function validateToken(request: Request): boolean {
  const auth = request.headers.get('Authorization') ?? '';
  const token = auth.replace(/^Bearer\s+/i, '').trim();
  return ADMIN_TOKEN.length > 0 && token === ADMIN_TOKEN;
}

export function validateCookie(request: Request): boolean {
  const cookies = request.headers.get('cookie') ?? '';
  const match = cookies.match(/admin_session=([^;]+)/);
  if (!match) return false;
  return match[1] === ADMIN_TOKEN;
}
