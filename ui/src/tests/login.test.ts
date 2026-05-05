import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import LoginPage from '../routes/auth/login/+page.svelte';

/**
 * Login page component tests.
 * Verifies that the login form renders with the required fields and controls.
 */
describe('Login page', () => {
	it('renders the Sign In heading', () => {
		render(LoginPage, { props: { form: null } });
		expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
	});

	it('renders the email input', () => {
		render(LoginPage, { props: { form: null } });
		const input = screen.getByLabelText(/email/i);
		expect(input).toBeInTheDocument();
		expect(input).toHaveAttribute('type', 'email');
		expect(input).toHaveAttribute('name', 'email');
	});

	it('renders the password input', () => {
		render(LoginPage, { props: { form: null } });
		// Use { selector: 'input' } to distinguish the input from the show/hide toggle button,
		// which also contains "password" in its aria-label.
		const input = screen.getByLabelText(/password/i, { selector: 'input' });
		expect(input).toBeInTheDocument();
		expect(input).toHaveAttribute('type', 'password');
		expect(input).toHaveAttribute('name', 'password');
	});

	it('renders the submit button', () => {
		render(LoginPage, { props: { form: null } });
		const button = screen.getByRole('button', { name: /sign in/i });
		expect(button).toBeInTheDocument();
		expect(button).toHaveAttribute('type', 'submit');
	});

	it('renders an error alert when form has an error', () => {
		render(LoginPage, { props: { form: { error: 'Invalid credentials' } } });
		const alert = screen.getByRole('alert');
		expect(alert).toBeInTheDocument();
		expect(alert).toHaveTextContent('Invalid credentials');
	});

	it('does not render an error alert when form is null', () => {
		render(LoginPage, { props: { form: null } });
		expect(screen.queryByRole('alert')).not.toBeInTheDocument();
	});

	it('show/hide password toggle button is present', () => {
		render(LoginPage, { props: { form: null } });
		const toggle = screen.getByRole('button', { name: /show password/i });
		expect(toggle).toBeInTheDocument();
	});
});
