import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PaginationControls, computePageRange } from '../src/components/PaginationControls';

describe('computePageRange', () => {
  it('returns all pages when totalPages <= 5', () => {
    expect(computePageRange(1, 3)).toEqual([1, 2, 3]);
    expect(computePageRange(2, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it('returns 5 pages centered around currentPage', () => {
    expect(computePageRange(5, 10)).toEqual([3, 4, 5, 6, 7]);
  });

  it('clamps to the beginning when currentPage is near start', () => {
    expect(computePageRange(1, 10)).toEqual([1, 2, 3, 4, 5]);
    expect(computePageRange(2, 10)).toEqual([1, 2, 3, 4, 5]);
  });

  it('clamps to the end when currentPage is near end', () => {
    expect(computePageRange(10, 10)).toEqual([6, 7, 8, 9, 10]);
    expect(computePageRange(9, 10)).toEqual([6, 7, 8, 9, 10]);
  });

  it('returns empty array when totalPages is 0', () => {
    expect(computePageRange(1, 0)).toEqual([]);
  });

  it('returns single page when totalPages is 1', () => {
    expect(computePageRange(1, 1)).toEqual([1]);
  });
});

describe('PaginationControls', () => {
  const defaultProps = {
    currentPage: 3,
    totalPages: 10,
    totalCount: 95,
    onPageChange: vi.fn(),
    disabled: false,
  };

  it('renders pagination info with page and total count', () => {
    render(<PaginationControls {...defaultProps} />);
    const info = screen.getByTestId('pagination-info');
    expect(info).toHaveTextContent('Page 3 of 10');
    expect(info).toHaveTextContent('95 disputes total');
  });

  it('renders singular dispute text when totalCount is 1', () => {
    render(<PaginationControls {...defaultProps} totalCount={1} totalPages={1} currentPage={1} />);
    const info = screen.getByTestId('pagination-info');
    expect(info).toHaveTextContent('1 dispute total');
  });

  it('renders Previous and Next buttons', () => {
    render(<PaginationControls {...defaultProps} />);
    expect(screen.getByTestId('pagination-previous')).toBeInTheDocument();
    expect(screen.getByTestId('pagination-next')).toBeInTheDocument();
  });

  it('renders page number buttons with data-testid', () => {
    render(<PaginationControls {...defaultProps} />);
    // currentPage=3, totalPages=10 → pages [1,2,3,4,5]
    expect(screen.getByTestId('pagination-page-1')).toBeInTheDocument();
    expect(screen.getByTestId('pagination-page-2')).toBeInTheDocument();
    expect(screen.getByTestId('pagination-page-3')).toBeInTheDocument();
    expect(screen.getByTestId('pagination-page-4')).toBeInTheDocument();
    expect(screen.getByTestId('pagination-page-5')).toBeInTheDocument();
  });

  it('disables Previous button on first page', () => {
    render(<PaginationControls {...defaultProps} currentPage={1} />);
    expect(screen.getByTestId('pagination-previous')).toBeDisabled();
  });

  it('disables Next button on last page', () => {
    render(<PaginationControls {...defaultProps} currentPage={10} />);
    expect(screen.getByTestId('pagination-next')).toBeDisabled();
  });

  it('calls onPageChange with previous page when Previous is clicked', () => {
    const onPageChange = vi.fn();
    render(<PaginationControls {...defaultProps} onPageChange={onPageChange} />);
    fireEvent.click(screen.getByTestId('pagination-previous'));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('calls onPageChange with next page when Next is clicked', () => {
    const onPageChange = vi.fn();
    render(<PaginationControls {...defaultProps} onPageChange={onPageChange} />);
    fireEvent.click(screen.getByTestId('pagination-next'));
    expect(onPageChange).toHaveBeenCalledWith(4);
  });

  it('calls onPageChange with page number when a page button is clicked', () => {
    const onPageChange = vi.fn();
    render(<PaginationControls {...defaultProps} onPageChange={onPageChange} />);
    fireEvent.click(screen.getByTestId('pagination-page-5'));
    expect(onPageChange).toHaveBeenCalledWith(5);
  });

  it('highlights the current page button', () => {
    render(<PaginationControls {...defaultProps} />);
    const currentPageBtn = screen.getByTestId('pagination-page-3');
    expect(currentPageBtn).toHaveAttribute('aria-current', 'page');
  });

  it('applies disabled state with reduced opacity and no interaction', () => {
    render(<PaginationControls {...defaultProps} disabled={true} />);
    const nav = screen.getByRole('navigation');
    expect(nav.className).toContain('opacity-50');
    expect(nav.className).toContain('pointer-events-none');
  });
});
