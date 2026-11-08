import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    clean: true,
    sourcemap: true,
  },
  {
    entry: {
      'env-doctor': 'src/cli.ts',
    },
    format: ['cjs'],
    outDir: 'bin',
    banner: {
      js: '#!/usr/bin/env node',
    },
  },
]);
