import os from 'node:os';

/** LAN IPv4 addresses for Android / device testing (Next.js 16 dev HMR). */
function discoverLanDevOrigins() {
  const origins = new Set();
  for (const nets of Object.values(os.networkInterfaces())) {
    for (const net of nets ?? []) {
      const isIpv4 = net.family === 'IPv4' || net.family === 4;
      if (isIpv4 && !net.internal) {
        origins.add(net.address);
      }
    }
  }
  for (const extra of (process.env.ALLOWED_DEV_ORIGINS ?? '').split(',')) {
    const trimmed = extra.trim();
    if (trimmed) origins.add(trimmed);
  }
  return [...origins];
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // api-contract is symlinked from crossub_web; Turbopack cannot resolve it yet.
  transpilePackages: ['@crossub-thongz/api-contract'],
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    // BFF proxy forwards base64 photo uploads to the Nest API (≤ 25 MB per file).
    proxyClientMaxBodySize: '30mb',
  },
  // Allow phones on the same Wi‑Fi to load dev assets (http://192.168.x.x:3006).
  allowedDevOrigins: discoverLanDevOrigins(),
};

export default nextConfig;
