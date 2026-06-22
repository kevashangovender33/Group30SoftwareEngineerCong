import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import App from '../src/App';

// Mock fetch for API calls made by hooks
beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ customers: [], paymentTypes: [], issueCategories: [] }),
    })
  );
});

describe('App', () => {
  it('renders the app header with TRIAGE branding', () => {
    render(<App />);
    expect(screen.getByText('TRIAGE')).toBeInTheDocument();
  });

  it('renders the ops portal subtitle', () => {
    render(<App />);
    expect(screen.getByText('Ops Portal')).toBeInTheDocument();
    expect(screen.getByText('Internal Triage')).toBeInTheDocument();
  });

  it('starts on the Select Customer screen', () => {
    render(<App />);
    expect(screen.getByText('Select Customer')).toBeInTheDocument();
    expect(screen.getByTestId('customer-search-input')).toBeInTheDocument();
  });
});
