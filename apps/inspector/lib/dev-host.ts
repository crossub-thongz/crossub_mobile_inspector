/** Host part of a request `Host` header (strips port). */
export function requestHostName(requestHost: string): string {
  return requestHost.split(':')[0]?.toLowerCase() ?? '';
}

/**
 * True for localhost and private LAN hosts used in local HTTP dev.
 * Auth cookies must omit `Secure` on these hosts or mobile browsers drop them.
 */
export function isDevBffHost(requestHost: string): boolean {
  const host = requestHostName(requestHost);
  if (
    host.includes('localhost') ||
    host.startsWith('127.0.0.1') ||
    host.endsWith('.local')
  ) {
    return true;
  }
  if (host.startsWith('192.168.')) return true;
  if (host.startsWith('10.')) return true;
  const secondOctet = /^172\.(\d+)\./.exec(host)?.[1];
  if (secondOctet) {
    const n = Number(secondOctet);
    if (n >= 16 && n <= 31) return true;
  }
  return false;
}
