import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
	plugins: [sveltekit()],
	resolve: {
		alias: {
			'$shared': path.resolve('../shared')
		}
	},
	test: {
		engvironment: 'jsdom',
		globals: true,
		setupFiles: ['./src/tests/setup.ts'],
		include: ['src/**/*.test.ts']
	}
});
