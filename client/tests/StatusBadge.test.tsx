import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StatusBadge } from '../src/components/StatusBadge';

describe('StatusBadge', () => {
  it('renders OPEN status with correct label text', () => {
    render(<StatusBadge status="OPEN" />);
    const badge = screen.getByTestId('status-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('OPEN');
  });

  it('renders TRIAGED status with correct label text', () => {
    render(<StatusBadge status="TRIAGED" />);
    const badge = screen.getByTestId('status-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('TRIAGED');
  });

  it('renders CLOSED status with correct label text', () => {
    render(<StatusBadge status="CLOSED" />);
    const badge = screen.getByTestId('status-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('CLOSED');
  });

  it('renders with data-testid="status-badge"', () => {
    render(<StatusBadge status="OPEN" />);
    expect(screen.getByTestId('status-badge')).toBeInTheDocument();
  });

  it('applies visually distinct classes for OPEN status', () => {
    render(<StatusBadge status="OPEN" />);
    const badge = screen.getByTestId('status-badge');
    expect(badge.className).toContain('bg-blue-100');
    expect(badge.className).toContain('text-blue-700');
  });

  it('applies visually distinct classes for TRIAGED status', () => {
    render(<StatusBadge status="TRIAGED" />);
    const badge = screen.getByTestId('status-badge');
    expect(badge.className).toContain('bg-amber-100');
    expect(badge.className).toContain('text-amber-700');
  });

  it('applies visually distinct classes for CLOSED status', () => {
    render(<StatusBadge status="CLOSED" />);
    const badge = screen.getByTestId('status-badge');
    expect(badge.className).toContain('bg-gray-100');
    expect(badge.className).toContain('text-gray-700');
  });

  it('renders each status with a distinct visual style', () => {
    const { rerender } = render(<StatusBadge status="OPEN" />);
    const openClasses = screen.getByTestId('status-badge').className;

    rerender(<StatusBadge status="TRIAGED" />);
    const triagedClasses = screen.getByTestId('status-badge').className;

    rerender(<StatusBadge status="CLOSED" />);
    const closedClasses = screen.getByTestId('status-badge').className;

    // All three statuses should have different styling
    expect(openClasses).not.toEqual(triagedClasses);
    expect(triagedClasses).not.toEqual(closedClasses);
    expect(openClasses).not.toEqual(closedClasses);
  });
});
