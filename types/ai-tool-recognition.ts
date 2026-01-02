// AI Tool Recognition Types

import type { JsonObject, JsonValue } from '@/types/json';

export interface ToolImage {
  id: string;
  material_id: string;
  image_url: string;
  image_filename: string;
  image_hash: string;
  image_metadata?: JsonObject;
  is_primary: boolean;
  uploaded_by?: string;
  uploaded_by_name?: string;
  created_at: string;
}

export interface ToolRecognitionResult {
  id: string;
  image_url: string;
  image_hash?: string;
  analysis_provider: string;
  analysis_version?: string;
  raw_response?: JsonObject;
  detected_objects?: JsonValue[];
  recognized_tools?: JsonValue[];
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  processing_error?: string;
  processed_at?: string;
  created_at: string;
  matches?: ToolRecognitionMatch[];
}

export interface ToolRecognitionMatch {
  id: string;
  recognition_result_id: string;
  material_id: string;
  confidence_score: number;
  bounding_box?: JsonObject;
  match_reason?: string;
  verified_by_user: boolean;
  verified_at?: string;
  verified_by?: string;
  created_at: string;
  material?: {
    name: string;
    category: string;
    serial_number?: string;
  };
}

export interface ToolInventoryCount {
  id: string;
  location: string;
  counted_by?: string;
  counted_by_name?: string;
  photo_url?: string;
  recognition_result_id?: string;
  counted_tools?: JsonValue[];
  manual_overrides?: JsonValue[];
  status: 'draft' | 'verified' | 'applied';
  notes?: string;
  created_at: string;
  verified_at?: string;
}

export interface ToolRecognitionStats {
  total_analyses: number;
  successful_analyses: number;
  average_matches: number;
  high_confidence_rate: number;
  verification_rate: number;
}

// Form Data Types
export interface ToolRecognitionAnalysis {
  image_url: string;
  image_hash?: string;
  provider?: string;
}

export interface ToolImageUpload {
  material_id: string;
  image_url: string;
  image_filename: string;
  image_hash: string;
  image_metadata?: JsonObject;
  is_primary?: boolean;
  uploaded_by_name?: string;
}

export interface ToolVerification {
  match_id: string;
  verified: boolean;
  notes?: string;
}

export interface ToolInventoryCountData {
  location: string;
  counted_by_name: string;
  photo_url?: string;
  recognition_result_id?: string;
  counted_tools?: JsonValue[];
  notes?: string;
}
