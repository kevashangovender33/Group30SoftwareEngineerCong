import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChartCard } from '../src/components/ChartCard';

describe('ChartCard', () => {
  it('should render the title', () => {
    render(
      <ChartCard title="Disputes by Payment Type">
        <div>Chart Content</div>
      </ChartCard>
    );

    expect(screen.getByText('Disputes by Payment Type')).toBeInTheDocument();
  });

  it('should render children', () => {
    render(
      <ChartCard title="Test Chart">
        <div data-testid="child-content">Hello</div>
      </ChartCard>
    );

    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });

  it('should wrap in a card container with correct styling', () => {
    const { container } = render(
      <ChartCard title="Test Chart">
        <div>Content</div>
      </ChartCard>
    );

    const card = container.firstChild as HTMLElement;
    expect(card.classList.contains('bg-surface-container-lowest')).toBe(true);
    expect(card.classList.contains('rounded-lg')).toBe(true);
    expect(card.classList.contains('border')).toBe(true);
    expect(card.classList.contains('border-outline-variant')).toBe(true);
  });

  it('should render title with body-lg typography', () => {
    render(
      <ChartCard title="Test Chart">
        <div>Content</div>
      </ChartCard>
    );

    const title = screen.getByText('Test Chart');
    expect(title.tagName).toBe('H3');
    expect(title.classList.contains('text-body-lg')).toBe(true);
  });

  it('should have a data-testid based on title', () => {
    render(
      <ChartCard title="Disputes by Status">
        <div>Content</div>
      </ChartCard>
    );

    expect(screen.getByTestId('chart-card-disputes-by-status')).toBeInTheDocument();
  });
});
