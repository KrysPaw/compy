import path from 'node:path';
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
  // Include workspace packages outside apps/web when tracing serverless bundles.
  outputFileTracingRoot: path.join(__dirname, '../..'),
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
