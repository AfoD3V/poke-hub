import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import RegisterPage from '../routes/auth/register/+page.svelte';

/**
 * Register page component tests.
 * Verifies that the registration form renders with the required fields and controls.
 */
describe('Register page', () => {
	it('renders the Create Account heading', () => {
		render(RegisterPage, { props: { form: null } });
		expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument();
	});

	it('renders the trainer name (display name) input', () => {
		render(RegisterPage, { props: { form: null } });
		const input = screen.getByLabelText(/trainer name/i);
		expect(input).toBeInTheDocument();
		expect(input).toHaveAttribute('name', 'displayName');
	});

	it('renders the email input', () => {
		render(RegisterPage, { props: { form: null } });
		const input = screen.getByLabelText(/email/i);
		expect(input).toBeInTheDocument();
		expect(input).toHaveAttribute('type', 'email');
		expect(input).toHaveAttribute('name', 'email');
	});

	it('renders the password input', () => {
		render(RegisterPage, { props: { form: null } });
		// Use { selector: 'input' } to distinguish the password input from the show/hide
		// toggle button, which also contains "password" in its aria-label.
		const input = screen.getByLabelText(/password/i, { selector: 'input' });
		expect(input).toBeInTheDocument();
		expect(input).toHaveAttribute('name', 'password');
		expect(input).toHaveAttribute('minlength', '8');
	});

	it('renders the submit button', () => {
		render(RegisterPage, { props: { form: null } });
		const button = screen.getByRole('button', { name: /create account/i });
		expect(button).toBeInTheDocument();
		expect(button).toHaveAttribute('type', 'submit');
	});

	it('renders an error alert when form has an error', () => {
		render(RegisterPage, { props: { form: { error: 'Email already registered' } } });
		const alert = screen.getByRole('alert');
		expect(alert).toBeInTheDocument();
		expect(alert).toHaveTextContent('Email already registered');
	});

	it('does not render an error alert when form is null', () => {
		render(RegisterPage, { props: { form: null } });
		expect(screen.queryByRole('alert')).not.toBeInTheDocument();
	});

	it('show/hide password toggle button is present', () => {
		render(RegisterPage, { props: { form: null } });
		const toggle = screen.getByRole('button', { name: /show password/i });
		expect(toggle).toBeInTheDocument();
	});
});
