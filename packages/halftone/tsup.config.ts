import { readFileSync, writeFileSync } from "node:fs";
import { defineConfig } from "tsup";

export default defineConfig([
	{
		entry: { index: "src/index.ts" },
		format: ["esm"],
		dts: true,
		external: ["react"],
		clean: true,
		outDir: "dist",
		onSuccess: async () => {
			// Worker is shipped as a separate .js file; fix the URL string in the compiled output.
			const f = "dist/index.js";
			writeFileSync(
				f,
				readFileSync(f, "utf8").replace(
					'"./halftone.worker.ts"',
					'"./halftone.worker.js"',
				),
			);
		},
	},
	{
		entry: { "halftone.worker": "src/halftone.worker.ts" },
		format: ["esm"],
		dts: false,
		outDir: "dist",
	},
]);
