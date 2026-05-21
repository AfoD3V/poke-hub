import type { Config } from 'tailwindcss';

export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				'ph-bg': '#000000',
				'ph-surface': '#111111',
				'ph-card': '#161616',
				'ph-border': '#2a2a2a',
				'ph-accent': '#E3000B',
				'ph-accent-dim': 'rgba(227,0,11,0.15)',
				'ph-red-glow': 'rgba(227,0,11,0.4)',
				'ph-text': '#FFFFFF',
				'ph-muted': '#707070'
			},
			fontFamily: {
				sans: ['Geist', 'sans-serif'],
				geist: ['Geist', 'sans-serif']
			},
			boxShadow: {
				'glow-red': '0 0 40px rgba(227,0,11,0.15), 0 0 80px rgba(227,0,11,0.05)',
				'glow-red-hover': '0 0 60px rgba(227,0,11,0.25), 0 0 120px rgba(227,0,11,0.08)'
			}
		}
	},
	plugins: []
} satisfies Config;
