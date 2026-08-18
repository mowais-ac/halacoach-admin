import type {NextConfig} from 'next';

/**
 * Dev (`next dev`) writes to `.next`.
 * Production build (`next build` / `next start`) writes to `.next-build`.
 * Keeping them separate stops ENOENT crashes when a build runs while dev is up.
 */
const nextConfig: NextConfig = {
  distDir: process.env.NODE_ENV === 'production' ? '.next-build' : '.next',
};

export default nextConfig;
