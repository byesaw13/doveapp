import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { PageContainer, ContentSection, Grid } from '@/components/ui/layout';

describe('PageContainer', () => {
  it('renders children', () => {
    render(
      <PageContainer>
        <div>Content</div>
      </PageContainer>
    );
    expect(screen.getByText('Content')).toBeTruthy();
  });

  it('applies default max-width class', () => {
    const { container } = render(<PageContainer>Test</PageContainer>);
    expect((container.firstChild as Element).className).toContain(
      'max-w-[1600px]'
    );
  });

  it('applies custom max-width class', () => {
    const { container } = render(
      <PageContainer maxWidth="sm">Test</PageContainer>
    );
    expect((container.firstChild as Element).className).toContain('max-w-2xl');
  });

  it('applies default padding', () => {
    const { container } = render(<PageContainer>Test</PageContainer>);
    const cls = (container.firstChild as Element).className;
    expect(cls).toContain('px-4');
    expect(cls).toContain('py-6');
  });

  it('applies custom padding', () => {
    const { container } = render(
      <PageContainer padding="lg">Test</PageContainer>
    );
    const cls = (container.firstChild as Element).className;
    expect(cls).toContain('px-6');
    expect(cls).toContain('py-8');
  });
});

describe('ContentSection', () => {
  it('renders title', () => {
    render(<ContentSection title="Section Title">Content</ContentSection>);
    expect(screen.getByText('Section Title')).toBeTruthy();
  });

  it('renders description', () => {
    render(
      <ContentSection title="Title" description="Section description">
        Content
      </ContentSection>
    );
    expect(screen.getByText('Section description')).toBeTruthy();
  });

  it('renders children', () => {
    render(<ContentSection>Child Content</ContentSection>);
    expect(screen.getByText('Child Content')).toBeTruthy();
  });

  it('renders actions', () => {
    render(
      <ContentSection actions={<button>Action</button>}>Content</ContentSection>
    );
    expect(screen.getByRole('button', { name: 'Action' })).toBeTruthy();
  });
});

describe('Grid', () => {
  it('renders grid container', () => {
    const { container } = render(
      <Grid>
        <div>Item 1</div>
        <div>Item 2</div>
      </Grid>
    );
    expect((container.firstChild as Element).className).toContain('grid');
  });

  it('applies column classes', () => {
    const { container } = render(
      <Grid cols={4}>
        <div>Item</div>
      </Grid>
    );
    expect((container.firstChild as Element).className).toContain(
      'lg:grid-cols-4'
    );
  });

  it('applies gap classes', () => {
    const { container } = render(
      <Grid gap="lg">
        <div>Item</div>
      </Grid>
    );
    expect((container.firstChild as Element).className).toContain('gap-6');
  });
});
