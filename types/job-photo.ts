export interface JobPhoto {
  id: string;
  job_id: string;
  filename: string;
  original_filename: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  photo_type: 'before' | 'during' | 'after' | 'other';
  caption?: string | null;
  taken_at?: string | null;
  uploaded_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface JobPhotoInsert {
  job_id: string;
  filename: string;
  original_filename: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  photo_type: 'before' | 'during' | 'after' | 'other';
  caption?: string | null;
  taken_at?: string | null;
  uploaded_by?: string | null;
}

export interface JobPhotoUpdate {
  caption?: string | null;
  photo_type?: 'before' | 'during' | 'after' | 'other';
  taken_at?: string | null;
}
