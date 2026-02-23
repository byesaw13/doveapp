import { render, screen, fireEvent } from '@testing-library/react';
import {
  InvoiceFilters,
  InvoiceFiltersState,
} from '@/components/commercial/invoice-filters';

const mockClients = [
  { id: 'client-1', first_name: 'John', last_name: 'Doe' },
  {
    id: 'client-2',
    first_name: 'Jane',
    last_name: 'Smith',
    company_name: 'Acme Corp',
  },
];

const defaultFilters: InvoiceFiltersState = {
  search: '',
  status: 'all',
  clientId: '',
  dateFrom: undefined,
  dateTo: undefined,
  amountMin: undefined,
  amountMax: undefined,
};

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  forward: jest.fn(),
  back: jest.fn(),
  refresh: jest.fn(),
  prefetch: jest.fn(),
};

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: () => '/admin/invoices',
  useSearchParams: () => new URLSearchParams(),
}));

describe('InvoiceFilters', () => {
  const mockOnFiltersChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders status tabs', () => {
    render(
      <InvoiceFilters
        clients={mockClients}
        onFiltersChange={mockOnFiltersChange}
        initialFilters={defaultFilters}
      />
    );

    expect(screen.getByText('All')).toBeTruthy();
    expect(screen.getByText('Draft')).toBeTruthy();
    expect(screen.getByText('Sent')).toBeTruthy();
    expect(screen.getByText('Partial')).toBeTruthy();
    expect(screen.getByText('Paid')).toBeTruthy();
    expect(screen.getByText('Void')).toBeTruthy();
  });

  it('renders search input', () => {
    render(
      <InvoiceFilters
        clients={mockClients}
        onFiltersChange={mockOnFiltersChange}
        initialFilters={defaultFilters}
      />
    );

    expect(screen.getByPlaceholderText('Search invoices...')).toBeTruthy();
  });

  it('renders date range picker button', () => {
    render(
      <InvoiceFilters
        clients={mockClients}
        onFiltersChange={mockOnFiltersChange}
        initialFilters={defaultFilters}
      />
    );

    expect(screen.getByText('Date Range')).toBeTruthy();
  });

  it('renders amount filter button', () => {
    render(
      <InvoiceFilters
        clients={mockClients}
        onFiltersChange={mockOnFiltersChange}
        initialFilters={defaultFilters}
      />
    );

    expect(screen.getByText('Amount')).toBeTruthy();
  });

  it('calls onFiltersChange when search input changes', () => {
    render(
      <InvoiceFilters
        clients={mockClients}
        onFiltersChange={mockOnFiltersChange}
        initialFilters={defaultFilters}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search invoices...');
    fireEvent.change(searchInput, { target: { value: 'INV-001' } });

    expect(mockOnFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'INV-001' })
    );
  });

  it('shows active filter badges when filters are applied', () => {
    const filtersWithSearch: InvoiceFiltersState = {
      ...defaultFilters,
      search: 'test query',
    };

    render(
      <InvoiceFilters
        clients={mockClients}
        onFiltersChange={mockOnFiltersChange}
        initialFilters={filtersWithSearch}
      />
    );

    expect(screen.getByText(/Search: test query/)).toBeTruthy();
  });

  it('shows clear button when filters are active', () => {
    const filtersWithValues: InvoiceFiltersState = {
      ...defaultFilters,
      search: 'test',
    };

    render(
      <InvoiceFilters
        clients={mockClients}
        onFiltersChange={mockOnFiltersChange}
        initialFilters={filtersWithValues}
      />
    );

    expect(screen.getByText('Clear')).toBeTruthy();
  });
});
