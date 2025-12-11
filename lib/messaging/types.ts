// Shared message types for the unified inbox layer.
// These keep every channel consistent before we store data.

export type ChannelType =
  | 'sms'
  | 'whatsapp'
  | 'email'
  | 'webform'
  | 'voicemail';

export type DirectionType = 'incoming' | 'outgoing';

// Normalized structure that every inbound or outbound message should match.
export interface NormalizedMessage {
  channel: ChannelType;
  direction: DirectionType;
  externalId?: string;
  customer: {
    fullName?: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  messageText: string;
  attachments: Array<{
    url: string;
    type: 'image' | 'file' | 'audio' | 'video';
    filename?: string;
  }>;
  rawPayload: unknown;
  receivedAt: string;
}

// DB record shape for customers table.
export interface CustomerRecord {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  secondary_phone: string | null;
  address: string | null;
  source: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// DB record shape for conversations table.
export interface ConversationRecord {
  id: string;
  customer_id: string;
  title: string | null;
  status: 'open' | 'closed';
  primary_channel: string | null;
  lead_score: string | null;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
}

// DB record shape for messages table.
export interface MessageRecord {
  id: string;
  conversation_id: string;
  customer_id: string;
  channel: ChannelType;
  direction: DirectionType;
  external_id: string | null;
  raw_payload: unknown;
  message_text: string | null;
  attachments: Array<{
    url: string;
    type: 'image' | 'file' | 'audio' | 'video';
    filename?: string;
  }>;
  ai_summary: string | null;
  ai_category: string | null;
  ai_urgency: string | null;
  ai_next_action: string | null;
  ai_extracted: Record<string, unknown> | null;
  created_at: string;
}
