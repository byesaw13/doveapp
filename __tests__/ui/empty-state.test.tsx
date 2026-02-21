import { describe, it, expect } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmptyState } from '@/components/ui/empty-state';

describe('EmptyState', () => {
  it('renders title', () => {
    render(<EmptyState title="No items found" />);
    expect(screen.getByText('No items found')).toBeTruthy();
  });

  it('renders description when provided', () => {
    render(
      <EmptyState
        title="No clients"
        description="Add your first client to get started"
      />
    );
    expect(
      screen.getByText('Add your first client to get started')
    ).toBeTruthy();
  });

  it('renders action button when provided', () => {
    const handleClick = jest.fn();
    render(
      <EmptyState
        title="No data"
        action={{ label: 'Add Item', onClick: handleClick }}
      />
    );
    const button = screen.getByRole('button', { name: 'Add Item' });
    expect(button).toBeTruthy();
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders secondary action when provided', () => {
    const handlePrimary = jest.fn();
    const handleSecondary = jest.fn();
    render(
      <EmptyState
        title="No data"
        action={{ label: 'Add', onClick: handlePrimary }}
        secondaryAction={{ label: 'Import', onClick: handleSecondary }}
      />
    );
    expect(screen.getByRole('button', { name: 'Add' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Import' })).toBeTruthy();
  });

  it('renders icon when provided', () => {
    render(
      <EmptyState
        title="Empty"
        icon={<span data-testid="empty-icon">X</span>}
      />
    );
    expect(screen.getByTestId('empty-icon')).toBeTruthy();
  });

  it('applies size variants correctly', () => {
    const { container } = render(<EmptyState title="Small" size="sm" />);
    expect((container.firstChild as Element).className).toContain('py-6');
  });
});
