import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		environment: "node",
		setupFiles: ["apps/server/__tests__/setup.ts"],
		include: [
			"apps/server/__tests__/**/*.{test,spec}.{js,ts}",
			"packages/**/__tests__/**/*.{test,spec}.{js,ts}",
		],
		exclude: [
			"**/node_modules/**",
			"**/dist/**",
			"**/build/**",
			"**/.{idea,git,cache,output,temp}/**",
		],
		testTimeout: 10000,
	},
});
