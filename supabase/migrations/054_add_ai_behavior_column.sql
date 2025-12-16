-- Add ai_behavior column to ai_estimate_settings table
ALTER TABLE ai_estimate_settings 
ADD COLUMN IF NOT EXISTS ai_behavior JSONB NOT NULL DEFAULT '{
  "historical_data_weight": 0.5,
  "confidence_threshold": 0.8,
  "risk_strategy": "balanced",
  "image_analysis_detail": "medium",
  "require_human_review_above_value": 5000,
  "auto_approve_confidence": 0.9
}'::jsonb;

-- Update any existing records to have default ai_behavior values
UPDATE ai_estimate_settings 
SET ai_behavior = '{
  "historical_data_weight": 0.5,
  "confidence_threshold": 0.8,
  "risk_strategy": "balanced",
  "image_analysis_detail": "medium",
  "require_human_review_above_value": 5000,
  "auto_approve_confidence": 0.9
}'::jsonb 
WHERE ai_behavior IS NULL;