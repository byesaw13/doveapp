'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Plus, CheckCircle2, Circle } from 'lucide-react';

interface JobNote {
  id: string;
  note: string;
  created_at: string;
  technician_id: string;
}

interface ChecklistItem {
  id: string;
  job_id: string;
  item_text: string;
  is_completed: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface Job {
  id: string;
  title: string;
  status: string;
  description?: string;
  service_date: string;
  client: {
    first_name: string;
    last_name: string;
    address_line1: string;
    city: string;
    state: string;
    zip_code: string;
    phone: string;
    email?: string;
  };
  line_items?: any[];
  visits?: any[];
}

export default function TechJobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<JobNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [addingChecklistItem, setAddingChecklistItem] = useState(false);

  useEffect(() => {
    fetchJob();
    fetchNotes();
    fetchChecklistItems();
  }, [jobId]);

  const fetchJob = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tech/jobs/${jobId}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      const data = await response.json();
      setJob(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch job');
    } finally {
      setLoading(false);
    }
  };

  const fetchNotes = async () => {
    try {
      const response = await fetch(`/api/tech/jobs/${jobId}/notes`);
      if (response.ok) {
        const notesData = await response.json();
        setNotes(notesData);
      }
    } catch (err) {
      console.error('Failed to fetch notes:', err);
    }
  };

  const addNote = async () => {
    if (!newNote.trim()) return;

    setAddingNote(true);
    try {
      const response = await fetch(`/api/tech/jobs/${jobId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ note: newNote.trim() }),
      });

      if (response.ok) {
        setNewNote('');
        fetchNotes();
      } else {
        console.error('Failed to add note');
      }
    } catch (err) {
      console.error('Failed to add note:', err);
    } finally {
      setAddingNote(false);
    }
  };

  const deleteNote = async (noteId: string) => {
    try {
      const response = await fetch(`/api/tech/jobs/${jobId}/notes/${noteId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchNotes();
      } else {
        console.error('Failed to delete note');
      }
    } catch (err) {
      console.error('Failed to delete note:', err);
    }
  };

  const fetchChecklistItems = async () => {
    try {
      const response = await fetch(`/api/tech/jobs/${jobId}/checklist`);
      if (response.ok) {
        const checklistData = await response.json();
        setChecklistItems(checklistData);
      }
    } catch (err) {
      console.error('Failed to fetch checklist items:', err);
    }
  };

  const addChecklistItem = async () => {
    if (!newChecklistItem.trim()) return;

    setAddingChecklistItem(true);
    try {
      const response = await fetch(`/api/tech/jobs/${jobId}/checklist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ item_text: newChecklistItem.trim() }),
      });

      if (response.ok) {
        setNewChecklistItem('');
        fetchChecklistItems();
      } else {
        console.error('Failed to add checklist item');
      }
    } catch (err) {
      console.error('Failed to add checklist item:', err);
    } finally {
      setAddingChecklistItem(false);
    }
  };

  const toggleChecklistItem = async (itemId: string) => {
    try {
      const response = await fetch(
        `/api/tech/jobs/${jobId}/checklist/${itemId}/toggle`,
        {
          method: 'PATCH',
        }
      );

      if (response.ok) {
        fetchChecklistItems();
      } else {
        console.error('Failed to toggle checklist item');
      }
    } catch (err) {
      console.error('Failed to toggle checklist item:', err);
    }
  };

  const deleteChecklistItem = async (itemId: string) => {
    try {
      const response = await fetch(
        `/api/tech/jobs/${jobId}/checklist/${itemId}`,
        {
          method: 'DELETE',
        }
      );

      if (response.ok) {
        fetchChecklistItems();
      } else {
        console.error('Failed to delete checklist item');
      }
    } catch (err) {
      console.error('Failed to delete checklist item:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="animate-pulse h-8 w-64"></div>
          <div className="animate-pulse h-10 w-32"></div>
        </div>
        <div className="animate-pulse h-64 bg-gray-100 rounded"></div>
        <div className="animate-pulse h-48 bg-gray-100 rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Job Details</h1>
          <Button variant="outline" onClick={() => router.back()}>
            Back to My Jobs
          </Button>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-semibold mb-2">Error Loading Job</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchJob}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Job Details</h1>
          <Button variant="outline" onClick={() => router.back()}>
            Back to My Jobs
          </Button>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-semibold">Job Not Found</h3>
            <p className="text-muted-foreground mt-2">
              This job may not exist or you don't have access to it.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{job.title}</h1>
          <p className="text-muted-foreground">
            Service Date: {new Date(job.service_date).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Badge className={getStatusColor(job.status)}>
            {job.status.replace('_', ' ')}
          </Badge>
          <Button variant="outline" onClick={() => router.back()}>
            Back to My Jobs
          </Button>
        </div>
      </div>

      {/* Client Information */}
      <Card>
        <CardHeader>
          <CardTitle>Client Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Name
              </label>
              <p className="font-medium">
                {job.client.first_name} {job.client.last_name}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Phone
              </label>
              <p>{job.client.phone || 'Not provided'}</p>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Address
            </label>
            <p>
              {job.client.address_line1}
              {job.client.city && `, ${job.client.city}`}
              {job.client.state &&
                `, ${job.client.state} ${job.client.zip_code || ''}`}
            </p>
          </div>
          {job.client.email && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Email
              </label>
              <p>{job.client.email}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Job Description */}
      {job.description && (
        <Card>
          <CardHeader>
            <CardTitle>Job Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{job.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Line Items */}
      {job.line_items && job.line_items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Scope of Work</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {job.line_items.map((item, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-3 bg-muted/50 rounded"
                >
                  <div>
                    <p className="font-medium">{item.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.quantity} × ${item.unit_price}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${item.total}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Visit History */}
      {job.visits && job.visits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Visit History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {job.visits.map((visit) => (
                <div
                  key={visit.id}
                  className="flex justify-between items-center p-3 border rounded"
                >
                  <div>
                    <p className="font-medium">
                      {new Date(visit.start_at).toLocaleDateString()} -{' '}
                      {visit.status}
                    </p>
                    {visit.notes && (
                      <p className="text-sm text-muted-foreground">
                        {visit.notes}
                      </p>
                    )}
                  </div>
                  <Badge variant="outline">
                    {Math.round(
                      (new Date(visit.end_at || visit.start_at).getTime() -
                        new Date(visit.start_at).getTime()) /
                        60000
                    )}{' '}
                    min
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tech Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Tech Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Add Note Form */}
            <div className="space-y-2">
              <Textarea
                placeholder="Add a note about this job..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                rows={3}
              />
              <Button
                onClick={addNote}
                disabled={!newNote.trim() || addingNote}
                size="sm"
              >
                {addingNote ? 'Adding...' : 'Add Note'}
              </Button>
            </div>

            {/* Notes List */}
            {notes.length > 0 ? (
              <div className="space-y-3">
                {notes.map((note) => (
                  <div
                    key={note.id}
                    className="border rounded-lg p-3 bg-gray-50"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-sm whitespace-pre-wrap">
                          {note.note}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(note.created_at).toLocaleString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteNote(note.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground italic">
                No notes added yet.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Job Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>Job Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Progress indicator */}
            {checklistItems.length > 0 && (
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                <span>
                  {checklistItems.filter((item) => item.is_completed).length} of{' '}
                  {checklistItems.length} completed
                </span>
                <span>
                  {Math.round(
                    (checklistItems.filter((item) => item.is_completed).length /
                      checklistItems.length) *
                      100
                  )}
                  %
                </span>
              </div>
            )}

            {/* Checklist items */}
            {checklistItems.length > 0 ? (
              <div className="space-y-2">
                {checklistItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50"
                  >
                    <Checkbox
                      checked={item.is_completed}
                      onCheckedChange={() => toggleChecklistItem(item.id)}
                      className="flex-shrink-0"
                    />
                    <span
                      className={`flex-1 ${
                        item.is_completed
                          ? 'line-through text-muted-foreground'
                          : ''
                      }`}
                    >
                      {item.item_text}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteChecklistItem(item.id)}
                      className="flex-shrink-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground italic text-center py-4">
                No checklist items yet.
              </p>
            )}

            {/* Add new item */}
            <div className="flex space-x-2 pt-4 border-t">
              <Input
                placeholder="Add a checklist item..."
                value={newChecklistItem}
                onChange={(e) => setNewChecklistItem(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    addChecklistItem();
                  }
                }}
                className="flex-1"
              />
              <Button
                onClick={addChecklistItem}
                disabled={!newChecklistItem.trim() || addingChecklistItem}
                size="sm"
              >
                {addingChecklistItem ? (
                  <Circle className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
