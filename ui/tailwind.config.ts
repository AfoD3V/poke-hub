import type { Config } from 'tailwindcss';

export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				'ph-bg': '#07071a',
				'ph-surface': '#0f0f27',
				'ph-card': '#14142e',
				'ph-border': '#1e1e42',
				'ph-border-accent': '#4c1d95',
				'ph-purple': '#7c3aed',
				'ph-purple-light': '#a78bfa',
				'ph-text': '#e2e8f0',
				'ph-muted': '#64748b'
			},
			fontFamily: {
				syne: ['Syne', 'sans-serif'],
				dm: ['DM Sans', 'sans-serif']
			},
			boxShadow: {
				'glow-purple': '0 0 40px rgba(124, 58, 237, 0.15), 0 0 80px rgba(124, 58, 237, 0.05)',
				'glow-purple-hover': '0 0 60px rgba(124, 58, 237, 0.25), 0 0 120px rgba(124, 58, 237, 0.08)'
			}
		}
	},
	plugins: []
} satisfies Config;
