// Resolves the '@/*' alias at runtime for compiled output in dist/.
// tsc leaves `require('@/app/...')` calls in emitted JS as-is (it never
// rewrites path aliases), so this patches Node's module resolution to
// match what tsconfig.json's "paths" declares for TypeScript itself.
// Loaded via `-r ./scripts/register-path-aliases.js` (see package.json).
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import * as tsConfigPaths from 'tsconfig-paths';

const __dirname = dirname(fileURLToPath(import.meta.url));

tsConfigPaths.register({
  baseUrl: resolve(__dirname, '..', 'dist'),
  paths: {
    '@/*': ['*'],
  },
});
