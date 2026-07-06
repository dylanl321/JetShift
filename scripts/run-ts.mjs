// Tiny TS runner: bundles a TS entry (rewriting .js specifiers to .ts) and executes it.
import { build } from 'esbuild';
import { pathToFileURL } from 'node:url';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const entry = process.argv[2];
if (!entry) {
	console.error('usage: node scripts/run-ts.mjs <entry.ts>');
	process.exit(1);
}

const result = await build({
	entryPoints: [entry],
	bundle: true,
	format: 'esm',
	platform: 'node',
	write: false,
	logLevel: 'warning',
	plugins: [
		{
			name: 'js-to-ts',
			setup(b) {
				// Rewrite relative "./x.js" imports to resolve to "./x.ts"
				b.onResolve({ filter: /\.js$/ }, (args) => {
					if (!args.importer) return;
					if (args.path.startsWith('.')) {
						const tsPath = args.path.replace(/\.js$/, '.ts');
						return b.resolve(tsPath, {
							importer: args.importer,
							resolveDir: args.resolveDir,
							kind: args.kind
						});
					}
				});
			}
		}
	]
});

const dir = mkdtempSync(join(tmpdir(), 'jetshift-test-'));
const outFile = join(dir, 'bundle.mjs');
writeFileSync(outFile, result.outputFiles[0].text);
await import(pathToFileURL(outFile).href);
