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
};

export default nextConfig;
