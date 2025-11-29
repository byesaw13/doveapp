import { supabase } from '@/lib/supabase';
import type {
  JobPhoto,
  JobPhotoInsert,
  JobPhotoUpdate,
} from '@/types/job-photo';

/**
 * Get all photos for a job
 */
export async function getJobPhotos(jobId: string): Promise<JobPhoto[]> {
  const { data, error } = await supabase
    .from('job_photos')
    .select('*')
    .eq('job_id', jobId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching job photos:', error);
    throw new Error('Failed to fetch job photos');
  }

  return data || [];
}

/**
 * Get a single photo by ID
 */
export async function getJobPhoto(id: string): Promise<JobPhoto | null> {
  const { data, error } = await supabase
    .from('job_photos')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching job photo:', error);
    return null;
  }

  return data;
}

/**
 * Create a new job photo
 */
export async function createJobPhoto(
  photo: JobPhotoInsert
): Promise<JobPhoto | null> {
  const { data, error } = await supabase
    .from('job_photos')
    .insert(photo)
    .select()
    .single();

  if (error) {
    console.error('Error creating job photo:', error);
    throw new Error('Failed to create job photo');
  }

  return data;
}

/**
 * Update a job photo
 */
export async function updateJobPhoto(
  id: string,
  updates: JobPhotoUpdate
): Promise<JobPhoto | null> {
  const { data, error } = await supabase
    .from('job_photos')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating job photo:', error);
    throw new Error('Failed to update job photo');
  }

  return data;
}

/**
 * Delete a job photo
 */
export async function deleteJobPhoto(id: string): Promise<boolean> {
  const { error } = await supabase.from('job_photos').delete().eq('id', id);

  if (error) {
    console.error('Error deleting job photo:', error);
    throw new Error('Failed to delete job photo');
  }

  return true;
}

/**
 * Get photos by type for a job
 */
export async function getJobPhotosByType(
  jobId: string,
  photoType: string
): Promise<JobPhoto[]> {
  const { data, error } = await supabase
    .from('job_photos')
    .select('*')
    .eq('job_id', jobId)
    .eq('photo_type', photoType)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching job photos by type:', error);
    throw new Error('Failed to fetch job photos by type');
  }

  return data || [];
}
