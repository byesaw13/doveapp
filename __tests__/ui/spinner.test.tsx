import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { Spinner, LoadingOverlay } from '@/components/ui/spinner';

describe('Spinner', () => {
  it('renders spinner element', () => {
    render(<Spinner />);
    const spinner = screen.getByRole('status');
    expect(spinner).toBeTruthy();
  });

  it('applies size variants correctly', () => {
    const { container, rerender } = render(<Spinner size="sm" />);
    let cls = (container.querySelector('svg') as Element).className;
    expect(cls).toContain('h-4');
    expect(cls).toContain('w-4');

    rerender(<Spinner size="lg" />);
    cls = (container.querySelector('svg') as Element).className;
    expect(cls).toContain('h-8');
    expect(cls).toContain('w-8');
  });

  it('applies custom className', () => {
    const { container } = render(<Spinner className="text-red-500" />);
    const cls = (container.querySelector('svg') as Element).className;
    expect(cls).toContain('text-red-500');
  });
});

describe('LoadingOverlay', () => {
  it('renders with default message', () => {
    render(<LoadingOverlay />);
    expect(screen.getByText('Loading...')).toBeTruthy();
  });

  it('renders with custom message', () => {
    render(<LoadingOverlay message="Fetching data..." />);
    expect(screen.getByText('Fetching data...')).toBeTruthy();
  });

  it('renders spinner', () => {
    render(<LoadingOverlay />);
    const spinner = screen.getByRole('status');
    expect(spinner).toBeTruthy();
  });
});
