import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from '@/components/ui/status-badge';

describe('StatusBadge', () => {
  it('renders with default variant', () => {
    render(<StatusBadge>Active</StatusBadge>);
    expect(screen.getByText('Active')).toBeTruthy();
  });

  it('renders with success variant', () => {
    render(<StatusBadge variant="success">Completed</StatusBadge>);
    expect(screen.getByText('Completed')).toBeTruthy();
  });

  it('renders with dot indicator', () => {
    render(<StatusBadge dot>With Dot</StatusBadge>);
    expect(screen.getByText('With Dot')).toBeTruthy();
    const badge = screen.getByText('With Dot').parentElement;
    expect(badge?.querySelector('span')).toBeTruthy();
  });

  it('renders with pulse animation', () => {
    render(
      <StatusBadge dot pulse>
        Pulsing
      </StatusBadge>
    );
    expect(screen.getByText('Pulsing')).toBeTruthy();
  });

  it('renders with icon', () => {
    render(
      <StatusBadge icon={<span data-testid="test-icon">X</span>}>
        With Icon
      </StatusBadge>
    );
    expect(screen.getByTestId('test-icon')).toBeTruthy();
  });

  it('applies size variants correctly', () => {
    const { rerender } = render(<StatusBadge size="sm">Small</StatusBadge>);
    expect(screen.getByText('Small')).toBeTruthy();

    rerender(<StatusBadge size="lg">Large</StatusBadge>);
    expect(screen.getByText('Large')).toBeTruthy();
  });
});
