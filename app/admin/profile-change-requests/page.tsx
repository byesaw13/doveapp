'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  CheckCircle,
  XCircle,
  Clock,
  User,
  FileText,
  Loader2,
  AlertTriangle,
} from 'lucide-react';

interface ChangeRequest {
  id: string;
  user_id: string;
  employee_profile_id?: string;
  change_type: 'update' | 'create';
  requested_changes: Record<string, any>;
  current_values?: Record<string, any>;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  requested_by: string;
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  created_at: string;
  expires_at: string;
  users: {
    id: string;
    email: string;
    full_name: string;
  };
  employee_profiles?: {
    first_name: string;
    last_name: string;
    job_title: string;
  };
}

export default function ProfileChangeRequestsPage() {
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ChangeRequest | null>(
    null
  );
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>(
    'approve'
  );
  const [reviewNotes, setReviewNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async (status: string = 'pending') => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/admin/profile-change-requests?status=${status}`
      );
      if (!response.ok) {
        throw new Error('Failed to load requests');
      }
      const data = await response.json();
      setRequests(data.requests || []);
    } catch (error) {
      console.error('Failed to load requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewRequest = (
    request: ChangeRequest,
    action: 'approve' | 'reject'
  ) => {
    setSelectedRequest(request);
    setReviewAction(action);
    setReviewNotes('');
    setShowReviewDialog(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedRequest) return;

    try {
      setProcessing(true);
      const response = await fetch('/api/admin/profile-change-requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: selectedRequest.id,
          action: reviewAction,
          reviewNotes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process request');
      }

      // Update the request in the list
      setRequests((prev) =>
        prev.filter((req) => req.id !== selectedRequest.id)
      );
      setShowReviewDialog(false);
      setSelectedRequest(null);
    } catch (error) {
      console.error('Failed to process request:', error);
    } finally {
      setProcessing(false);
    }
  };

  const renderChangeSummary = (changes: Record<string, any>) => {
    const changeItems = Object.entries(changes).map(([key, value]) => ({
      field: key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      value: Array.isArray(value) ? value.join(', ') : String(value),
    }));

    return (
      <div className="space-y-2">
        {changeItems.map((item, index) => (
          <div key={index} className="flex justify-between text-sm">
            <span className="font-medium">{item.field}:</span>
            <span className="text-gray-600">{item.value}</span>
          </div>
        ))}
      </div>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            Pending
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Approved
          </Badge>
        );
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'expired':
        return <Badge variant="outline">Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-gray-700 bg-white transition ease-in-out duration-150">
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Loading Change Requests...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white sm:text-3xl">
                  Profile Change Requests
                </h1>
                <p className="mt-1 text-sm text-orange-100">
                  Review and approve employee profile change requests
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs
          defaultValue="pending"
          onValueChange={(value) => loadRequests(value)}
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pending">
              Pending ({requests.filter((r) => r.status === 'pending').length})
            </TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
            <TabsTrigger value="expired">Expired</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-6 mt-6">
            {requests.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No pending requests
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    All change requests have been processed.
                  </p>
                </CardContent>
              </Card>
            ) : (
              requests.map((request) => (
                <Card
                  key={request.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-orange-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">
                              {request.users.full_name}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {request.users.email}
                            </p>
                          </div>
                          <Badge variant="outline" className="capitalize">
                            {request.change_type}
                          </Badge>
                          {getStatusBadge(request.status)}
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-2">
                            Requested Changes:
                          </h4>
                          {renderChangeSummary(request.requested_changes)}
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>
                            Requested:{' '}
                            {new Date(request.created_at).toLocaleDateString()}
                          </span>
                          <span>
                            Expires:{' '}
                            {new Date(request.expires_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          onClick={() =>
                            handleReviewRequest(request, 'approve')
                          }
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReviewRequest(request, 'reject')}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Other tabs show similar content but read-only */}
          <TabsContent value="approved" className="space-y-6 mt-6">
            {requests.map((request) => (
              <Card key={request.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {request.users.full_name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Approved on{' '}
                        {new Date(request.reviewed_at!).toLocaleDateString()}
                      </p>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="rejected" className="space-y-6 mt-6">
            {requests.map((request) => (
              <Card key={request.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {request.users.full_name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Rejected on{' '}
                        {new Date(request.reviewed_at!).toLocaleDateString()}
                      </p>
                      {request.review_notes && (
                        <p className="text-sm text-gray-600 mt-1">
                          Notes: {request.review_notes}
                        </p>
                      )}
                    </div>
                    {getStatusBadge(request.status)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="expired" className="space-y-6 mt-6">
            {requests.map((request) => (
              <Card key={request.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {request.users.full_name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Expired on{' '}
                        {new Date(request.expires_at).toLocaleDateString()}
                      </p>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewAction === 'approve' ? 'Approve' : 'Reject'} Change Request
            </DialogTitle>
            <DialogDescription>
              {reviewAction === 'approve'
                ? 'This will apply the requested changes to the employee profile.'
                : 'This will deny the change request. The employee will be notified.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-2">
                Request Details:
              </h4>
              <p className="text-sm text-blue-700">
                <strong>{selectedRequest?.users.full_name}</strong> requested
                changes to their profile
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Review Notes (Optional)
              </label>
              <Textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Add any notes about your decision..."
                rows={3}
              />
            </div>

            {reviewAction === 'reject' && (
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="flex">
                  <AlertTriangle className="h-5 w-5 text-yellow-400" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Rejection Notice
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>The employee will be notified of this rejection.</p>
                      <p>
                        Consider providing feedback on why the changes were not
                        approved.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowReviewDialog(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitReview}
              disabled={processing}
              variant={reviewAction === 'approve' ? 'default' : 'destructive'}
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                `${reviewAction === 'approve' ? 'Approve' : 'Reject'} Request`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
