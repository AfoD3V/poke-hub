import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import HomePage from '../../src/routes/(app)/home/+page.svelte';

vi.mock('$lib/components/CardModal.svelte', () => ({ default: vi.fn() }));

const makeChaseEntry = (id: string, setName = 'Base Set', setId = 'base1') => ({
	id,
	userId: 'user1',
	cardId: `${setId}-001`,
	cardSnapshot: { name: 'Charizard', setName, setId, imageSmall: '' },
	addedAt: new Date().toISOString()
});

const defaultData = {
	isAdmin: false,
	totalCards: 0,
	uniquePokemon: 0,
	setBreakdown: [],
	rarityBreakdown: {},
	chaseEntries: [],
	setLogos: {},
	setNames: {},
	error: null
};

describe('Home page tabs', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('renders Overview tab as active by default', () => {
		render(HomePage, { props: { data: defaultData } });
		const overviewTab = screen.getByRole('tab', { name: /overview/i });
		expect(overviewTab).toBeInTheDocument();
		expect(overviewTab).toHaveAttribute('aria-selected', 'true');
	});

	it('renders Chase Board tab', () => {
		render(HomePage, { props: { data: defaultData } });
		const chaseTab = screen.getByRole('tab', { name: /chase board/i });
		expect(chaseTab).toBeInTheDocument();
		expect(chaseTab).toHaveAttribute('aria-selected', 'false');
	});

	it('switching to Chase Board tab hides stats and shows chase content', async () => {
		render(HomePage, {
			props: {
				data: {
					...defaultData,
					chaseEntries: [makeChaseEntry('e1')]
				}
			}
		});
		// Stats heading is visible on Overview
		expect(screen.getByText(/collection stats/i)).toBeInTheDocument();

		// Click Chase Board tab
		await fireEvent.click(screen.getByRole('tab', { name: /chase board/i }));

		// Stats heading should be gone
		expect(screen.queryByText(/collection stats/i)).not.toBeInTheDocument();
	});

	it('switching back to Overview hides chase content and shows stats', async () => {
		render(HomePage, {
			props: {
				data: {
					...defaultData,
					chaseEntries: [makeChaseEntry('e1')]
				}
			}
		});
		await fireEvent.click(screen.getByRole('tab', { name: /chase board/i }));
		await fireEvent.click(screen.getByRole('tab', { name: /overview/i }));

		expect(screen.getByText(/collection stats/i)).toBeInTheDocument();
	});

	it('shows badge with chase entry count on Chase Board tab when entries exist', () => {
		render(HomePage, {
			props: {
				data: {
					...defaultData,
					chaseEntries: [makeChaseEntry('e1'), makeChaseEntry('e2')]
				}
			}
		});
		// Badge should show count 2
		expect(screen.getByText('2')).toBeInTheDocument();
	});

	it('shows empty-state message when Chase Board tab is active and no entries', async () => {
		render(HomePage, { props: { data: defaultData } });
		await fireEvent.click(screen.getByRole('tab', { name: /chase board/i }));
		expect(screen.getByText(/no cards on your chase board yet/i)).toBeInTheDocument();
	});
});
