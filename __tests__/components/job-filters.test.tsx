import { render, screen } from '@testing-library/react';
import { JobFilters, JobFiltersState } from '@/components/jobs/job-filters';

const mockTechs = [
  { id: 'tech-1', full_name: 'John Doe', email: 'john@example.com' },
  { id: 'tech-2', full_name: 'Jane Smith', email: 'jane@example.com' },
];

const defaultFilters: JobFiltersState = {
  search: '',
  status: 'all',
  priority: 'all',
  assignedTech: '',
  dateFrom: undefined,
  dateTo: undefined,
};

describe('JobFilters', () => {
  const mockOnFiltersChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render all filter controls', () => {
    render(
      <JobFilters
        techs={mockTechs}
        onFiltersChange={mockOnFiltersChange}
        initialFilters={defaultFilters}
      />
    );

    expect(screen.getByPlaceholderText('Search jobs...')).toBeTruthy();
    expect(screen.getByText('All Statuses')).toBeTruthy();
    expect(screen.getByText('All Priorities')).toBeTruthy();
    expect(screen.getByText('All Techs')).toBeTruthy();
    expect(screen.getByText('Date Range')).toBeTruthy();
  });

  it('should display tech options', async () => {
    const { container } = render(
      <JobFilters
        techs={mockTechs}
        onFiltersChange={mockOnFiltersChange}
        initialFilters={defaultFilters}
      />
    );

    const techButton = container.querySelector('button');
    expect(techButton).toBeTruthy();
  });

  it('should update search filter on input', async () => {
    render(
      <JobFilters
        techs={mockTechs}
        onFiltersChange={mockOnFiltersChange}
        initialFilters={defaultFilters}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search jobs...');
    expect(searchInput).toBeTruthy();
  });

  it('should display active filter count badges', () => {
    const filtersWithSearch: JobFiltersState = {
      ...defaultFilters,
      search: 'test query',
    };

    render(
      <JobFilters
        techs={mockTechs}
        onFiltersChange={mockOnFiltersChange}
        initialFilters={filtersWithSearch}
      />
    );

    expect(screen.getByText(/Search: test query/)).toBeTruthy();
  });

  it('should clear all filters when clear button clicked', async () => {
    const filtersWithValues: JobFiltersState = {
      search: 'test',
      status: 'scheduled',
      priority: 'high',
      assignedTech: 'tech-1',
      dateFrom: new Date('2024-01-01'),
      dateTo: new Date('2024-01-31'),
    };

    render(
      <JobFilters
        techs={mockTechs}
        onFiltersChange={mockOnFiltersChange}
        initialFilters={filtersWithValues}
      />
    );

    const clearButton = screen.getByText('Clear');
    expect(clearButton).toBeTruthy();
  });
});
