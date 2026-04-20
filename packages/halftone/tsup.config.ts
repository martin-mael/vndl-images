import path from "node:path";
import { build as esBuild, type Plugin } from "esbuild";
import { defineConfig } from "tsup";

// Handles `?worker&inline` imports: builds the worker with esbuild and inlines
// it as a blob URL so consumers need no bundler configuration and no separate
// network request is made when creating the worker.
const inlineWorkerPlugin: Plugin = {
	name: "inline-worker",
	setup(build) {
		build.onResolve({ filter: /\?worker/ }, (args) => ({
			path: path.resolve(args.resolveDir, args.path.split("?")[0]),
			namespace: "inline-worker",
		}));

		build.onLoad({ filter: /.*/, namespace: "inline-worker" }, async (args) => {
			const result = await esBuild({
				entryPoints: [args.path],
				bundle: true,
				format: "iife",
				write: false,
				target: "es2022",
			});
			const code = result.outputFiles[0].text;
			return {
				contents: `
const _url = URL.createObjectURL(new Blob([${JSON.stringify(code)}], { type: "text/javascript" }));
export default class extends Worker { constructor() { super(_url); } }
`,
				loader: "js",
			};
		});
	},
};

export default defineConfig({
	entry: { index: "src/index.ts" },
	format: ["esm"],
	dts: true,
	external: ["react"],
	clean: true,
	esbuildPlugins: [inlineWorkerPlugin],
});
