'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Job {
  id: string;
  title: string;
  status: string;
  client: {
    first_name: string;
    last_name: string;
    address_line1: string;
    city: string;
    phone: string;
  };
  line_items?: any[];
}

export default function TechJobDetailPage() {
  const params = useParams();
  const jobId = params.id as string;
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchJob();
  }, [jobId]);

  const fetchJob = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tech/jobs/${jobId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch job');
      }
      const data = await response.json();
      setJob(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading job details...</div>;
  }

  if (error) {
    return <div className="p-6">Error: {error}</div>;
  }

  if (!job) {
    return <div className="p-6">Job not found</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{job.title}</h1>
        <Button variant="outline">Back to My Jobs</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Job Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <strong>Status:</strong> {job.status}
          </div>
          <div>
            <strong>Client:</strong> {job.client.first_name}{' '}
            {job.client.last_name}
          </div>
          <div>
            <strong>Address:</strong> {job.client.address_line1},{' '}
            {job.client.city}
          </div>
          <div>
            <strong>Phone:</strong> {job.client.phone}
          </div>
        </CardContent>
      </Card>

      {job.line_items && job.line_items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Line Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {job.line_items.map((item, index) => (
                <div key={index} className="flex justify-between">
                  <span>{item.description}</span>
                  <span>${item.total}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
