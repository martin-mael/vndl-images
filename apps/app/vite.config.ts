import path from "node:path";
import { defineConfig, loadEnv } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import viteTsConfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import { nitroV2Plugin } from "@tanstack/nitro-v2-vite-plugin";

const repoRoot = path.resolve(import.meta.dirname, "..", "..");

export default defineConfig(({ mode }) => {
	// Load .env* from the monorepo root so one file covers all workspaces.
	// Mirror into process.env for server-side code (Better Auth, Drizzle, etc.).
	const env = loadEnv(mode, repoRoot, "");
	for (const key of Object.keys(env)) {
		if (process.env[key] === undefined) process.env[key] = env[key];
	}

	return {
		envDir: repoRoot,
		plugins: [
			nitroV2Plugin({ preset: "vercel", compatibilityDate: "2026-04-20" }),
			viteTsConfigPaths({ projects: ["./tsconfig.json"] }),
			tailwindcss(),
			tanstackStart(),
			viteReact(),
		],
	};
});
