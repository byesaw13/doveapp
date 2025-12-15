'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import type { EstimateWithRelations } from '@/types/estimate';

interface CustomerEstimate extends EstimateWithRelations {
  // Customer-specific view - internal fields removed
}

export default function EstimatesClient() {
  const [estimates, setEstimates] = useState<CustomerEstimate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEstimates();
  }, []);

  const loadEstimates = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/portal/estimates');
      if (!response.ok) {
        throw new Error('Failed to load estimates');
      }

      const data = await response.json();
      setEstimates(data);
    } catch (err) {
      console.error('Error loading estimates:', err);
      setError(err instanceof Error ? err.message : 'Failed to load estimates');
    } finally {
      setLoading(false);
    }
  };

  const handleEstimateAction = async (
    estimateId: string,
    action: 'approved' | 'declined'
  ) => {
    try {
      const response = await fetch(`/api/portal/estimates/${estimateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action }),
      });

      if (!response.ok) {
        throw new Error('Failed to update estimate');
      }

      // Reload estimates to reflect changes
      loadEstimates();
    } catch (err) {
      console.error('Error updating estimate:', err);
      // In a real app, you'd show a toast notification here
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'declined':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending Approval';
      case 'approved':
        return 'Approved';
      case 'declined':
        return 'Declined';
      case 'expired':
        return 'Expired';
      default:
        return status.replace('_', ' ');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const isExpired = (validUntil: string) => {
    return new Date(validUntil) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            <p className="mb-4">{error}</p>
            <Button onClick={loadEstimates} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Estimates</h1>
        <p className="text-gray-500 mt-1">
          Review and approve your service estimates
        </p>
      </div>

      {/* Estimates List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Estimates ({estimates.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {estimates.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg mb-2">No estimates yet</p>
              <p className="text-sm">
                When you request a service, estimates will appear here for your
                review.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {estimates.map((estimate) => (
                <div
                  key={estimate.id}
                  className="border rounded-lg p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                    <div className="flex-1 space-y-4">
                      {/* Estimate Header */}
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-semibold">
                              {estimate.estimate_number || estimate.title}
                            </h3>
                            <Badge
                              className={getStatusColor(
                                estimate.status || 'pending'
                              )}
                            >
                              {getStatusLabel(estimate.status || 'pending')}
                            </Badge>
                            {estimate.valid_until &&
                              isExpired(estimate.valid_until) &&
                              estimate.status === 'pending' && (
                                <Badge className="bg-red-100 text-red-800">
                                  Expired
                                </Badge>
                              )}
                          </div>
                          <p className="text-gray-600">{estimate.title}</p>
                        </div>
                        {estimate.total && (
                          <div className="text-right">
                            <div className="text-2xl font-bold text-primary">
                              ${estimate.total.toFixed(2)}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Estimate Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>
                            <span className="font-medium">Created:</span>{' '}
                            {formatDate(estimate.created_at)}
                          </span>
                        </div>

                        {estimate.valid_until && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>
                              <span className="font-medium">Valid Until:</span>{' '}
                              {formatDate(estimate.valid_until)}
                              {isExpired(estimate.valid_until) &&
                                estimate.status === 'pending' && (
                                  <span className="text-red-600 ml-1">
                                    (Expired)
                                  </span>
                                )}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Estimate Description */}
                      {estimate.description && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-medium mb-2">Estimate Details</h4>
                          <p className="text-sm text-gray-600">
                            {estimate.description}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 min-w-[140px]">
                      <Button className="w-full" variant="outline">
                        View Details
                      </Button>

                      {estimate.status === 'pending' &&
                        estimate.valid_until &&
                        !isExpired(estimate.valid_until) && (
                          <>
                            <Button
                              className="w-full bg-green-600 hover:bg-green-700 text-white"
                              onClick={() =>
                                handleEstimateAction(estimate.id, 'approved')
                              }
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve
                            </Button>
                            <Button
                              className="w-full bg-red-600 hover:bg-red-700 text-white"
                              variant="destructive"
                              onClick={() =>
                                handleEstimateAction(estimate.id, 'declined')
                              }
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Decline
                            </Button>
                          </>
                        )}

                      {estimate.status === 'approved' && (
                        <div className="text-center text-green-600 font-medium">
                          ✓ Approved
                        </div>
                      )}

                      {estimate.status === 'declined' && (
                        <div className="text-center text-red-600 font-medium">
                          ✗ Declined
                        </div>
                      )}

                      {estimate.valid_until &&
                        isExpired(estimate.valid_until) &&
                        estimate.status === 'pending' && (
                          <div className="text-center text-gray-500 font-medium">
                            Expired
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
