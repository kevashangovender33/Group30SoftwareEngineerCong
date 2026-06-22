import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../src/App';

describe('App', () => {
  it('renders the app heading', async () => {
    render(<App />);
    expect(await screen.findByRole('heading', { name: /node conf starter/i })).toBeInTheDocument();
  });

  it('renders the increment button', async () => {
    render(<App />);
    expect(await screen.findByRole('button', { name: /increment/i })).toBeInTheDocument();
  });

  it('shows the backend health status once loaded', async () => {
    render(<App />);
    // fetch is stubbed in tests/setup.ts to return { status: 'healthy' }
    expect(await screen.findByText('healthy')).toBeInTheDocument();
  });
});
