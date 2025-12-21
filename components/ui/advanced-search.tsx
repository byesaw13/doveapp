'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Search,
  Filter,
  X,
  Users,
  Briefcase,
  FileText,
  Building,
  Calendar,
  DollarSign,
  MapPin,
  Phone,
  Mail,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { format } from 'date-fns';

interface SearchResult {
  id: string;
  type: 'client' | 'job' | 'estimate' | 'property';
  title: string;
  subtitle: string;
  description: string;
  status?: string;
  amount?: number;
  date?: string;
  metadata: Record<string, any>;
}

interface AdvancedSearchProps {
  onResultSelect?: (result: SearchResult) => void;
  defaultSearchType?: 'all' | 'clients' | 'jobs' | 'estimates';
  placeholder?: string;
}

export function AdvancedSearch({
  onResultSelect,
  defaultSearchType = 'all',
  placeholder = 'Search clients, jobs, estimates...',
}: AdvancedSearchProps) {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState(defaultSearchType);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchFilters, setSearchFilters] = useState({
    clients: true,
    jobs: true,
    estimates: true,
    properties: true,
    dateRange: 'all', // all, today, week, month, quarter, year
    status: 'all', // all, active, completed, pending, etc.
    amountRange: 'all', // all, under-1000, 1000-5000, 5000-10000, over-10000
    showFilters: false,
  });

  // Debounced search
  const debouncedSearch = useCallback(
    debounce(async (searchQuery: string, type: string, filters: any) => {
      if (!searchQuery.trim()) {
        setResults([]);
        return;
      }

      setIsSearching(true);

      try {
        const params = new URLSearchParams({
          q: searchQuery,
          type,
          limit: '50',
        });

        const response = await fetch(`/api/search/advanced?${params}`);

        if (response.ok) {
          const data = await response.json();
          setResults(data.results || []);
        } else {
          console.error('Search API error:', response.statusText);
          setResults([]);
        }
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    debouncedSearch(query, searchType, searchFilters);
  }, [query, searchType, searchFilters, debouncedSearch]);

  const handleFilterChange = (filterType: string, value: any) => {
    setSearchFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
  };

  const clearFilters = () => {
    setSearchFilters({
      clients: true,
      jobs: true,
      estimates: true,
      properties: true,
      dateRange: 'all',
      status: 'all',
      amountRange: 'all',
      showFilters: false,
    });
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'client':
        return <Users className="h-4 w-4" />;
      case 'job':
        return <Briefcase className="h-4 w-4" />;
      case 'estimate':
        return <FileText className="h-4 w-4" />;
      case 'property':
        return <Building className="h-4 w-4" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status?: string) => {
    if (!status) return 'bg-gray-100 text-gray-700';
    switch (status.toLowerCase()) {
      case 'completed':
      case 'paid':
        return 'bg-green-100 text-green-700';
      case 'in_progress':
      case 'sent':
        return 'bg-blue-100 text-blue-700';
      case 'pending':
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-700';
      case 'cancelled':
      case 'void':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Advanced Search
        </CardTitle>
        <CardDescription>
          Search across all your business data with powerful filters
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Input */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={placeholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            variant="outline"
            onClick={() =>
              setSearchFilters((prev) => ({
                ...prev,
                showFilters: !prev.showFilters,
              }))
            }
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>

        {/* Search Type Tabs */}
        <Tabs
          value={searchType}
          onValueChange={(value) =>
            setSearchType(value as 'all' | 'clients' | 'jobs' | 'estimates')
          }
        >
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="clients">
              <Users className="h-4 w-4 mr-1" />
              Clients
            </TabsTrigger>
            <TabsTrigger value="jobs">
              <Briefcase className="h-4 w-4 mr-1" />
              Jobs
            </TabsTrigger>
            <TabsTrigger value="estimates">
              <FileText className="h-4 w-4 mr-1" />
              Estimates
            </TabsTrigger>
            <TabsTrigger value="properties">
              <Building className="h-4 w-4 mr-1" />
              Properties
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Advanced Filters */}
        <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Filters</h4>
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search In */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Search In</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="clients"
                    checked={searchFilters.clients}
                    onCheckedChange={(checked) =>
                      handleFilterChange('clients', checked)
                    }
                  />
                  <Label htmlFor="clients" className="text-sm">
                    Clients
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="jobs"
                    checked={searchFilters.jobs}
                    onCheckedChange={(checked) =>
                      handleFilterChange('jobs', checked)
                    }
                  />
                  <Label htmlFor="jobs" className="text-sm">
                    Jobs
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="estimates"
                    checked={searchFilters.estimates}
                    onCheckedChange={(checked) =>
                      handleFilterChange('estimates', checked)
                    }
                  />
                  <Label htmlFor="estimates" className="text-sm">
                    Estimates
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="properties"
                    checked={searchFilters.properties}
                    onCheckedChange={(checked) =>
                      handleFilterChange('properties', checked)
                    }
                  />
                  <Label htmlFor="properties" className="text-sm">
                    Properties
                  </Label>
                </div>
              </div>
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Date Range</Label>
              <select
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
                value={searchFilters.dateRange}
                onChange={(e) =>
                  handleFilterChange('dateRange', e.target.value)
                }
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
              </select>
            </div>

            {/* Amount Range */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Amount Range</Label>
              <select
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
                value={searchFilters.amountRange}
                onChange={(e) =>
                  handleFilterChange('amountRange', e.target.value)
                }
              >
                <option value="all">Any Amount</option>
                <option value="under-1000">Under $1,000</option>
                <option value="1000-5000">$1,000 - $5,000</option>
                <option value="5000-10000">$5,000 - $10,000</option>
                <option value="over-10000">Over $10,000</option>
              </select>
            </div>
          </div>
        </div>

        {/* Search Results */}
        <div className="space-y-2">
          {isSearching && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">Searching...</p>
            </div>
          )}

          {!isSearching && results.length === 0 && query && (
            <div className="text-center py-8">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No results found for "{query}"
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Try adjusting your search terms or filters
              </p>
            </div>
          )}

          {results.map((result) => (
            <Card
              key={`${result.type}-${result.id}`}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => onResultSelect?.(result)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1">{getResultIcon(result.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium truncate">{result.title}</h4>
                      {result.status && (
                        <Badge className={getStatusColor(result.status)}>
                          {result.status}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {result.subtitle}
                    </p>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {result.description}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      {result.amount && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />$
                          {result.amount.toLocaleString()}
                        </span>
                      )}
                      {result.date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(result.date), 'MMM d, yyyy')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Utility function for debouncing
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// The search is now handled by the API endpoint /api/search/advanced
