/**
 * Rewrite upstream auth Set-Cookie headers for the Next.js BFF proxy.
 *
 * Render/staging Nest runs with NODE_ENV=production and emits
 * `Secure; SameSite=None`. Browsers reject Secure cookies on http://localhost,
 * so sign-in appears to fail even when credentials are valid.
 */
export function rewriteBffSetCookie(cookie: string, requestHost: string): string {
  const isLocalHost =
    requestHost.includes('localhost') ||
    requestHost.startsWith('127.0.0.1') ||
    requestHost.endsWith('.local');

  const parts = cookie.split(';').map((p) => p.trim());
  const nameValue = parts[0] ?? '';
  const attrs = parts.slice(1).filter((part) => {
    const lower = part.toLowerCase();
    if (lower.startsWith('domain=')) return false;
    if (lower.startsWith('samesite=')) return false;
    if (isLocalHost && lower === 'secure') return false;
    return part.length > 0;
  });

  attrs.push('SameSite=Lax');
  if (!isLocalHost) {
    attrs.push('Secure');
  }

  return [nameValue, ...attrs].join('; ');
}
