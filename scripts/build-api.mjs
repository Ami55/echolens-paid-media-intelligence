import { build } from 'esbuild';
await build({
  entryPoints: ['server/vercelEntry.ts'], outfile: 'api/index.js', bundle: true,
  platform: 'node', target: 'node22', format: 'esm', packages: 'external',
  define: { 'process.env.VERCEL': '"1"', 'process.env.NODE_ENV': '"production"' },
  sourcemap: false,
});
