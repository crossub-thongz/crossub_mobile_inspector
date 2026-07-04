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
};

export default nextConfig;
