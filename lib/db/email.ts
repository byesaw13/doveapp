import { supabase } from '@/lib/supabase';
import type { EmailLeadDetails, BillingEvent, Alert } from '@/types/database';
import { createClient, getClients } from '@/lib/db/clients';
import type { ClientInsert } from '@/types/client';
import { categorizeEmailWithAI } from '@/lib/ai/email-categorization';

/**
 * Map AI priority to email priority enum
 */
function mapAIPriorityToEmailPriority(
  aiPriority?: string
): 'low' | 'normal' | 'high' | 'urgent' {
  switch (aiPriority) {
    case 'low':
      return 'low';
    case 'medium':
      return 'normal';
    case 'high':
      return 'high';
    case 'urgent':
      return 'urgent';
    default:
      return 'normal';
  }
}

export interface EmailAccount {
  id: string;
  user_id?: string;
  email_address: string;
  gmail_refresh_token?: string;
  gmail_access_token?: string;
  token_expires_at?: string;
  is_active: boolean;
  last_sync_at?: string;
  created_at: string;
  updated_at: string;
}

export interface EmailMessage {
  id: string;
  email_account_id: string;
  gmail_message_id: string;
  gmail_thread_id: string;
  subject?: string;
  sender?: string;
  recipient?: string;
  received_at?: string;
  body_text?: string;
  body_html?: string;
  has_attachments: boolean;
  labels: string[];
  category:
    | 'unreviewed'
    | 'spending'
    | 'billing'
    | 'leads'
    | 'other'
    | 'ignored'
    | 'junk';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  is_read: boolean;
  is_starred: boolean;
  extracted_data: any;
  notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  requires_reply?: boolean;
  created_at: string;
  updated_at: string;
}

export interface SpendingEntry {
  id: string;
  email_message_id?: string;
  amount: number;
  currency: string;
  vendor?: string;
  category?: string;
  description?: string;
  transaction_date?: string;
  payment_method?: string;
  receipt_url?: string;
  approved: boolean;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface BillingEntry {
  id: string;
  email_message_id?: string;
  invoice_number?: string;
  amount: number;
  currency: string;
  client_id?: string;
  job_id?: string;
  description?: string;
  due_date?: string;
  status: 'unpaid' | 'paid' | 'overdue' | 'cancelled';
  payment_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  email_message_id?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  company_name?: string;
  lead_source: string;
  service_type?: string;
  estimated_value?: number;
  priority: 'low' | 'medium' | 'high';
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost';
  notes?: string;
  follow_up_date?: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
}

export interface EmailAccountInsert {
  user_id?: string;
  email_address: string;
  gmail_refresh_token?: string;
  gmail_access_token?: string;
  token_expires_at?: string;
  is_active?: boolean;
}

export interface EmailMessageInsert {
  email_account_id: string;
  gmail_message_id: string;
  gmail_thread_id: string;
  subject?: string;
  sender?: string;
  recipient?: string;
  received_at?: string;
  body_text?: string;
  body_html?: string;
  has_attachments?: boolean;
  labels?: string[];
  category?: EmailMessage['category'];
  priority?: EmailMessage['priority'];
  is_read?: boolean;
  is_starred?: boolean;
  extracted_data?: any;
}

export interface SpendingEntryInsert {
  email_message_id?: string;
  amount: number;
  currency?: string;
  vendor?: string;
  category?: string;
  description?: string;
  transaction_date?: string;
  payment_method?: string;
  receipt_url?: string;
}

export interface BillingEntryInsert {
  email_message_id?: string;
  invoice_number?: string;
  amount: number;
  currency?: string;
  client_id?: string;
  job_id?: string;
  description?: string;
  due_date?: string;
  status?: BillingEntry['status'];
}

export interface LeadInsert {
  email_message_id?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  company_name?: string;
  lead_source?: string;
  service_type?: string;
  estimated_value?: number;
  priority?: Lead['priority'];
  status?: Lead['status'];
  notes?: string;
  follow_up_date?: string;
  assigned_to?: string;
}

export interface EmailLeadDetailsInsert {
  email_id: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  address_line?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  service_type?: string;
  urgency?: EmailLeadDetails['urgency'];
  preferred_dates?: any;
  budget_hint?: string;
  source_channel?: string;
  has_photos?: boolean;
  parsed_confidence?: number;
}

export interface BillingEventInsert {
  email_id: string;
  contact_id?: string;
  job_id?: string;
  billing_type: BillingEvent['billing_type'];
  direction: BillingEvent['direction'];
  amount: number;
  currency?: string;
  invoice_number?: string;
  reference?: string;
  due_date?: string;
  paid_at?: string;
  vendor_name?: string;
  payer_name?: string;
  status?: BillingEvent['status'];
  parsed_confidence?: number;
}

export interface AlertInsert {
  type: Alert['type'];
  severity: Alert['severity'];
  email_id?: string;
  contact_id?: string;
  job_id?: string;
  title: string;
  message: string;
  due_at?: string;
}

/**
 * Email Account Management
 */
export async function getEmailAccounts(): Promise<EmailAccount[]> {
  const { data, error } = await supabase
    .from('email_accounts')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching email accounts:', error);
    throw new Error('Failed to fetch email accounts');
  }

  return data || [];
}

export async function getEmailAccountById(
  id: string
): Promise<EmailAccount | null> {
  const { data, error } = await supabase
    .from('email_accounts')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('Error fetching email account:', error);
    throw new Error('Failed to fetch email account');
  }

  return data;
}

export async function createEmailAccount(
  account: EmailAccountInsert
): Promise<EmailAccount> {
  const { data, error } = await supabase
    .from('email_accounts')
    .insert([account])
    .select()
    .single();

  if (error) {
    console.error('Error creating email account:', error);
    throw new Error('Failed to create email account');
  }

  return data;
}

export async function updateEmailAccount(
  id: string,
  updates: Partial<EmailAccountInsert>
): Promise<EmailAccount> {
  const { data, error } = await supabase
    .from('email_accounts')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating email account:', error);
    throw new Error('Failed to update email account');
  }

  return data;
}

/**
 * Email Message Management
 */
export async function getEmailMessages(
  accountId?: string,
  category?: string,
  limit = 50,
  offset = 0
): Promise<EmailMessage[]> {
  let query = supabase
    .from('email_messages')
    .select('*')
    .order('received_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (accountId) {
    query = query.eq('email_account_id', accountId);
  }

  if (category && category !== 'all') {
    query = query.eq('category', category);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching email messages:', error);
    throw new Error('Failed to fetch email messages');
  }

  return data || [];
}

export async function getEmailMessageById(
  id: string
): Promise<EmailMessage | null> {
  const { data, error } = await supabase
    .from('email_messages')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('Error fetching email message:', error);
    throw new Error('Failed to fetch email message');
  }

  return data;
}

export async function getEmailMessageByGmailId(
  gmailMessageId: string
): Promise<EmailMessage | null> {
  const { data, error } = await supabase
    .from('email_messages')
    .select('*')
    .eq('gmail_message_id', gmailMessageId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('Error fetching email message by Gmail ID:', error);
    throw new Error('Failed to fetch email message by Gmail ID');
  }

  return data;
}

export async function createEmailMessage(
  message: EmailMessageInsert
): Promise<EmailMessage> {
  const { data, error } = await supabase
    .from('email_messages')
    .insert([message])
    .select()
    .single();

  if (error) {
    console.error('Error creating email message:', error);
    throw new Error('Failed to create email message');
  }

  return data;
}

export async function updateEmailMessage(
  id: string,
  updates: Partial<
    EmailMessageInsert & {
      notes?: string;
      reviewed_by?: string | null;
      reviewed_at?: string;
      requires_reply?: boolean;
    }
  >
): Promise<EmailMessage> {
  const { data, error } = await supabase
    .from('email_messages')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating email message:', error);
    throw new Error('Failed to update email message');
  }

  return data;
}

/**
 * Spending Entries
 */
export async function getSpendingEntries(
  approved?: boolean,
  category?: string,
  limit = 50
): Promise<SpendingEntry[]> {
  let query = supabase
    .from('spending_entries')
    .select('*')
    .order('transaction_date', { ascending: false })
    .limit(limit);

  if (approved !== undefined) {
    query = query.eq('approved', approved);
  }

  if (category && category !== 'all') {
    query = query.eq('category', category);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching spending entries:', error);
    throw new Error('Failed to fetch spending entries');
  }

  return data || [];
}

export async function createSpendingEntry(
  entry: SpendingEntryInsert
): Promise<SpendingEntry> {
  const { data, error } = await supabase
    .from('spending_entries')
    .insert([entry])
    .select()
    .single();

  if (error) {
    console.error('Error creating spending entry:', error);
    throw new Error('Failed to create spending entry');
  }

  return data;
}

export async function updateSpendingEntry(
  id: string,
  updates: Partial<
    SpendingEntryInsert & {
      approved?: boolean;
      approved_by?: string;
      approved_at?: string;
    }
  >
): Promise<SpendingEntry> {
  const { data, error } = await supabase
    .from('spending_entries')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating spending entry:', error);
    throw new Error('Failed to update spending entry');
  }

  return data;
}

/**
 * Billing Entries
 */
export async function getBillingEntries(
  status?: string,
  clientId?: string,
  limit = 50
): Promise<BillingEntry[]> {
  let query = supabase
    .from('billing_entries')
    .select(
      `
      *,
      client:clients(id, first_name, last_name),
      job:jobs(id, title, job_number)
    `
    )
    .order('due_date', { ascending: true })
    .limit(limit);

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  if (clientId) {
    query = query.eq('client_id', clientId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching billing entries:', error);
    throw new Error('Failed to fetch billing entries');
  }

  return data || [];
}

export async function createBillingEntry(
  entry: BillingEntryInsert
): Promise<BillingEntry> {
  const { data, error } = await supabase
    .from('billing_entries')
    .insert([entry])
    .select()
    .single();

  if (error) {
    console.error('Error creating billing entry:', error);
    throw new Error('Failed to create billing entry');
  }

  return data;
}

export async function updateBillingEntry(
  id: string,
  updates: Partial<
    BillingEntryInsert & {
      payment_date?: string;
      notes?: string;
    }
  >
): Promise<BillingEntry> {
  const { data, error } = await supabase
    .from('billing_entries')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating billing entry:', error);
    throw new Error('Failed to update billing entry');
  }

  return data;
}

/**
 * Leads
 */
export async function getLeads(
  status?: string,
  priority?: string,
  limit = 50
): Promise<Lead[]> {
  let query = supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  if (priority && priority !== 'all') {
    query = query.eq('priority', priority);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching leads:', error);
    throw new Error('Failed to fetch leads');
  }

  return data || [];
}

export async function createLead(lead: LeadInsert): Promise<Lead> {
  const { data, error } = await supabase
    .from('leads')
    .insert([lead])
    .select()
    .single();

  if (error) {
    console.error('Error creating lead:', error);
    throw new Error('Failed to create lead');
  }

  return data;
}

export async function updateLead(
  id: string,
  updates: Partial<LeadInsert>
): Promise<Lead> {
  const { data, error } = await supabase
    .from('leads')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating lead:', error);
    throw new Error('Failed to update lead');
  }

  return data;
}

/**
 * Email Processing and AI Analysis
 */
export function extractSpendingFromEmail(
  email: EmailMessage
): SpendingEntryInsert | null {
  // Simple regex-based extraction (can be enhanced with AI)
  const body = (email.body_text || email.body_html || '').toLowerCase();

  // Look for amount patterns
  const amountRegex = /\$?(\d+(?:\.\d{2})?)/g;
  const amounts = body.match(amountRegex);

  if (!amounts) return null;

  // Look for vendor patterns
  const vendorPatterns = [
    /(?:from|at|with)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:receipt|invoice|charge)/i,
  ];

  let vendor: string | undefined;
  for (const pattern of vendorPatterns) {
    const match = body.match(pattern);
    if (match) {
      vendor = match[1];
      break;
    }
  }

  // Determine category
  let category: string | undefined;
  if (body.includes('material') || body.includes('supply')) {
    category = 'materials';
  } else if (body.includes('equipment') || body.includes('tool')) {
    category = 'equipment';
  } else if (body.includes('travel') || body.includes('mileage')) {
    category = 'travel';
  } else if (body.includes('service') || body.includes('repair')) {
    category = 'services';
  }

  return {
    email_message_id: email.id,
    amount: parseFloat(amounts[0].replace('$', '')),
    vendor,
    category,
    description: email.subject,
    transaction_date: email.received_at?.split('T')[0],
  };
}

export function extractBillingFromEmail(
  email: EmailMessage
): BillingEntryInsert | null {
  const body = (email.body_text || email.body_html || '').toLowerCase();
  const subject = (email.subject || '').toLowerCase();

  // Check if it's likely a billing/invoice email
  const billingKeywords = ['invoice', 'bill', 'payment', 'due', 'amount'];
  const hasBillingKeywords = billingKeywords.some(
    (keyword) => subject.includes(keyword) || body.includes(keyword)
  );

  if (!hasBillingKeywords) return null;

  // Extract amount
  const amountRegex = /\$?(\d+(?:\.\d{2})?)/g;
  const amounts = body.match(amountRegex);

  if (!amounts) return null;

  // Extract invoice number
  const invoiceRegex = /(?:invoice|inv|bill)\s*#?\s*([A-Z0-9-]+)/i;
  const invoiceMatch = body.match(invoiceRegex);

  // Extract due date
  const dateRegex = /(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/g;
  const dates = body.match(dateRegex);

  return {
    email_message_id: email.id,
    invoice_number: invoiceMatch ? invoiceMatch[1] : undefined,
    amount: parseFloat(amounts[0].replace('$', '')),
    description: email.subject,
    due_date: dates ? dates[0] : undefined,
  };
}

export function extractLeadFromEmail(email: EmailMessage): LeadInsert | null {
  const body = (email.body_text || email.body_html || '').toLowerCase();
  const subject = (email.subject || '').toLowerCase();

  // Check if it's likely a lead email
  const leadKeywords = [
    'quote',
    'estimate',
    'service',
    'repair',
    'interested',
    'need help',
  ];
  const hasLeadKeywords = leadKeywords.some(
    (keyword) => subject.includes(keyword) || body.includes(keyword)
  );

  if (!hasLeadKeywords) return null;

  // Extract contact info
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
  const emails = body.match(emailRegex);

  const phoneRegex = /(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/g;
  const phones = body.match(phoneRegex);

  // Extract company name
  const companyPatterns = [
    /(?:from|at)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:company|inc|llc|ltd)/i,
  ];

  let companyName: string | undefined;
  for (const pattern of companyPatterns) {
    const match = body.match(pattern);
    if (match) {
      companyName = match[1];
      break;
    }
  }

  return {
    email_message_id: email.id,
    contact_email: emails ? emails[0] : undefined,
    contact_phone: phones ? phones[0] : undefined,
    company_name: companyName,
    service_type: email.subject,
    notes: `From email: ${email.subject}`,
    lead_source: 'email',
  };
}

/**
 * Email Lead Details Management
 */
export async function getEmailLeadDetails(
  emailId?: string,
  limit = 50
): Promise<EmailLeadDetails[]> {
  let query = supabase
    .from('email_lead_details')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (emailId) {
    query = query.eq('email_id', emailId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching email lead details:', error);
    throw new Error('Failed to fetch email lead details');
  }

  return data || [];
}

export async function createEmailLeadDetails(
  details: EmailLeadDetailsInsert
): Promise<EmailLeadDetails> {
  const { data, error } = await supabase
    .from('email_lead_details')
    .insert([details])
    .select()
    .single();

  if (error) {
    console.error('Error creating email lead details:', error);
    throw new Error('Failed to create email lead details');
  }

  return data;
}

/**
 * Billing Events Management
 */
export async function getBillingEvents(
  emailId?: string,
  status?: string,
  limit = 50
): Promise<BillingEvent[]> {
  let query = supabase
    .from('billing_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (emailId) {
    query = query.eq('email_id', emailId);
  }

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching billing events:', error);
    throw new Error('Failed to fetch billing events');
  }

  return data || [];
}

export async function createBillingEvent(
  event: BillingEventInsert
): Promise<BillingEvent> {
  const { data, error } = await supabase
    .from('billing_events')
    .insert([event])
    .select()
    .single();

  if (error) {
    console.error('Error creating billing event:', error);
    throw new Error('Failed to create billing event');
  }

  return data;
}

export async function updateBillingEvent(
  id: string,
  updates: Partial<BillingEventInsert>
): Promise<BillingEvent> {
  const { data, error } = await supabase
    .from('billing_events')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating billing event:', error);
    throw new Error('Failed to update billing event');
  }

  return data;
}

/**
 * Alerts Management
 */
export async function getAlerts(
  type?: string,
  severity?: string,
  resolved?: boolean,
  limit = 50
): Promise<Alert[]> {
  let query = supabase
    .from('alerts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (type && type !== 'all') {
    query = query.eq('type', type);
  }

  if (severity && severity !== 'all') {
    query = query.eq('severity', severity);
  }

  if (resolved !== undefined) {
    if (resolved) {
      query = query.not('resolved_at', 'is', null);
    } else {
      query = query.is('resolved_at', null);
    }
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching alerts:', error);
    throw new Error('Failed to fetch alerts');
  }

  return data || [];
}

export async function createAlert(alert: AlertInsert): Promise<Alert> {
  const { data, error } = await supabase
    .from('alerts')
    .insert([alert])
    .select()
    .single();

  if (error) {
    console.error('Error creating alert:', error);
    throw new Error('Failed to create alert');
  }

  return data;
}

export async function resolveAlert(
  id: string,
  resolutionNotes?: string
): Promise<Alert> {
  const { data, error } = await supabase
    .from('alerts')
    .update({
      resolved_at: new Date().toISOString(),
      resolution_notes: resolutionNotes,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error resolving alert:', error);
    throw new Error('Failed to resolve alert');
  }

  return data;
}

/**
 * Enhanced Email Processing and AI Analysis
 */
export function extractLeadDetailsFromEmail(
  email: EmailMessage
): EmailLeadDetailsInsert | null {
  const body = (email.body_text || email.body_html || '').toLowerCase();
  const subject = (email.subject || '').toLowerCase();

  // Check if it's likely a lead inquiry
  const leadKeywords = [
    'quote',
    'estimate',
    'service',
    'repair',
    'interested',
    'need help',
    'looking for',
    'would like',
    'can you',
    'please help',
  ];
  const hasLeadKeywords = leadKeywords.some(
    (keyword) => subject.includes(keyword) || body.includes(keyword)
  );

  if (!hasLeadKeywords) return null;

  let confidence = 0.3; // Base confidence
  const extracted: Partial<EmailLeadDetailsInsert> = { email_id: email.id };

  // Extract contact name from sender
  if (email.sender) {
    const nameMatch = email.sender.match(/^([^<]+)</);
    if (nameMatch) {
      extracted.contact_name = nameMatch[1].trim();
      confidence += 0.2;
    }
  }

  // Extract email
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
  const emails = body.match(emailRegex);
  if (emails) {
    extracted.contact_email = emails[0];
    confidence += 0.2;
  }

  // Extract phone
  const phoneRegex = /(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/g;
  const phones = body.match(phoneRegex);
  if (phones) {
    extracted.contact_phone = phones[0];
    confidence += 0.2;
  }

  // Extract address
  const addressRegex =
    /(\d+\s+[A-Za-z0-9\s,.-]+(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln|way|place|pl|court|ct|boulevard|blvd|circle|cir|parkway|pkwy|highway|hwy)\s*,?\s*[A-Za-z\s]+,?\s*[A-Z]{2}\s*\d{5})/i;
  const addresses = body.match(addressRegex);
  if (addresses) {
    extracted.address_line = addresses[0];
    confidence += 0.3;
  }

  // Extract service type
  const serviceKeywords = {
    interior_paint: ['paint', 'painting', 'interior paint'],
    handyman_general: ['handyman', 'fix', 'repair', 'general maintenance'],
    tile: ['tile', 'tiling', 'backsplash'],
    deck: ['deck', 'decking', 'patio'],
    maintenance_plan: ['maintenance', 'plan', 'contract', 'ongoing'],
  };

  for (const [service, keywords] of Object.entries(serviceKeywords)) {
    if (keywords.some((k) => body.includes(k))) {
      extracted.service_type = service;
      confidence += 0.2;
      break;
    }
  }

  // Extract urgency
  const urgencyKeywords = {
    emergency: ['emergency', 'urgent', 'asap', 'immediately', 'right away'],
    high: ['soon', 'quickly', 'important', 'priority'],
    low: ['whenever', 'flexible', 'no rush'],
  };

  for (const [level, keywords] of Object.entries(urgencyKeywords)) {
    if (keywords.some((k) => body.includes(k))) {
      extracted.urgency = level as EmailLeadDetails['urgency'];
      confidence += 0.1;
      break;
    }
  }

  // Extract budget
  const budgetRegex = /\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/g;
  const budgets = body.match(budgetRegex);
  if (budgets) {
    extracted.budget_hint = budgets[0];
    confidence += 0.1;
  }

  // Check for photos
  extracted.has_photos =
    email.has_attachments ||
    body.includes('photo') ||
    body.includes('picture') ||
    body.includes('image');

  // Determine source channel
  if (body.includes('website') || body.includes('form')) {
    extracted.source_channel = 'website_form';
  } else if (body.includes('referral') || body.includes('recommended')) {
    extracted.source_channel = 'referral';
  } else {
    extracted.source_channel = 'direct_email';
  }

  extracted.parsed_confidence = Math.min(confidence, 1.0);

  return extracted as EmailLeadDetailsInsert;
}

export function extractBillingEventFromEmail(
  email: EmailMessage
): BillingEventInsert | null {
  const body = (email.body_text || email.body_html || '').toLowerCase();
  const subject = (email.subject || '').toLowerCase();

  // Check for billing keywords
  const billingKeywords = [
    'invoice',
    'payment',
    'bill',
    'receipt',
    'statement',
    'due',
    'paid',
    'charge',
    'refund',
    'subscription',
    'tax',
    'overdue',
    'reminder',
  ];
  const hasBillingKeywords = billingKeywords.some(
    (keyword) => subject.includes(keyword) || body.includes(keyword)
  );

  if (!hasBillingKeywords) return null;

  let confidence = 0.3;
  const extracted: Partial<BillingEventInsert> = { email_id: email.id };

  // Extract amount
  const amountRegex = /\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/g;
  const amounts = body.match(amountRegex);
  if (amounts) {
    extracted.amount = parseFloat(amounts[0].replace(/[$,]/g, ''));
    confidence += 0.3;
  } else {
    return null; // No amount found, not a billing event
  }

  // Determine direction and type
  if (
    subject.includes('invoice') ||
    subject.includes('bill') ||
    body.includes('you owe') ||
    body.includes('due')
  ) {
    extracted.direction = 'incoming';
    extracted.billing_type = 'customer_invoice';
  } else if (
    subject.includes('payment received') ||
    body.includes('payment received') ||
    body.includes('paid')
  ) {
    extracted.direction = 'incoming';
    extracted.billing_type = 'customer_payment';
  } else if (subject.includes('refund') || body.includes('refund')) {
    extracted.direction = 'outgoing';
    extracted.billing_type = 'customer_refund';
  } else if (
    body.includes('home depot') ||
    body.includes('lowe') ||
    body.includes('sherwin') ||
    body.includes('materials')
  ) {
    extracted.direction = 'outgoing';
    extracted.billing_type = 'vendor_bill';
    confidence += 0.2;
  } else if (
    subject.includes('payment') &&
    (body.includes('to') || body.includes('paid to'))
  ) {
    extracted.direction = 'outgoing';
    extracted.billing_type = 'vendor_payment';
  } else if (body.includes('tax') || body.includes('irs')) {
    extracted.direction = 'outgoing';
    extracted.billing_type = 'tax_notice';
  } else if (body.includes('subscription') || body.includes('monthly')) {
    extracted.direction = 'outgoing';
    extracted.billing_type = 'subscription_charge';
  } else {
    // Default to customer invoice if unclear
    extracted.direction = 'incoming';
    extracted.billing_type = 'customer_invoice';
  }

  // Extract invoice number
  const invoiceRegex = /(?:invoice|inv|bill)\s*#?\s*([A-Z0-9-]+)/i;
  const invoiceMatch = body.match(invoiceRegex);
  if (invoiceMatch) {
    extracted.invoice_number = invoiceMatch[1];
    confidence += 0.2;
  }

  // Extract due date
  const dateRegex =
    /(?:due\s+(?:on|by)\s+)?(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}|\d{4}[-\/]\d{1,2}[-\/]\d{1,2})/g;
  const dates = body.match(dateRegex);
  if (dates) {
    extracted.due_date = dates[0];
    confidence += 0.2;
  }

  // Extract vendor/customer name
  if (extracted.direction === 'outgoing') {
    const vendorPatterns = [
      /(?:from|at|with)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:receipt|invoice|charge)/i,
    ];
    for (const pattern of vendorPatterns) {
      const match = body.match(pattern);
      if (match) {
        extracted.vendor_name = match[1];
        confidence += 0.1;
        break;
      }
    }
  } else {
    extracted.payer_name = email.sender;
  }

  // Set status
  if (body.includes('paid') || body.includes('payment received')) {
    extracted.status = 'paid';
  } else if (body.includes('overdue') || body.includes('past due')) {
    extracted.status = 'overdue';
  } else if (body.includes('cancelled')) {
    extracted.status = 'cancelled';
  } else {
    extracted.status = 'open';
  }

  extracted.parsed_confidence = Math.min(confidence, 1.0);

  return extracted as BillingEventInsert;
}

/**
 * Enhanced Email Processing with OpenAI Analysis
 */
export async function processEmailWithAI(email: EmailMessage): Promise<void> {
  try {
    console.log(`🤖 Processing email ${email.id} with OpenAI analysis`);

    // Use OpenAI to analyze the email comprehensively
    const aiAnalysis = await categorizeEmailWithAI(email);

    console.log(`📊 AI Analysis Result:`, {
      category: aiAnalysis.category,
      confidence: aiAnalysis.confidence,
      hasExtractedData: !!aiAnalysis.extractedData,
    });

    // Update email with AI categorization and analysis
    const emailPriority = mapAIPriorityToEmailPriority(aiAnalysis.priority);
    await updateEmailMessage(email.id, {
      category: aiAnalysis.category,
      priority: emailPriority,
      extracted_data: {
        ...aiAnalysis.extractedData,
        ai_summary: aiAnalysis.summary,
        ai_action_items: aiAnalysis.action_items,
        ai_sentiment: aiAnalysis.sentiment,
        ai_confidence: aiAnalysis.confidence,
        ai_reasoning: aiAnalysis.reasoning,
      },
      requires_reply: aiAnalysis.requires_response,
    });

    // Process based on AI categorization
    if (aiAnalysis.category === 'leads' && aiAnalysis.extractedData?.leads) {
      await processLeadFromAIAnalysis(email, aiAnalysis.extractedData.leads);
    }

    if (
      aiAnalysis.category === 'billing' &&
      aiAnalysis.extractedData?.billing
    ) {
      await processBillingFromAIAnalysis(
        email,
        aiAnalysis.extractedData.billing
      );
    }

    if (
      aiAnalysis.category === 'spending' &&
      aiAnalysis.extractedData?.spending
    ) {
      await processSpendingFromAIAnalysis(
        email,
        aiAnalysis.extractedData.spending
      );
    }

    // Create alerts based on AI analysis
    await createAlertsFromAIAnalysis(email, aiAnalysis);

    console.log(`✅ Email ${email.id} processed successfully with AI`);
  } catch (error) {
    console.error(`❌ AI processing failed for email ${email.id}:`, error);
    // Fallback to rule-based processing
    console.log(
      `🔄 Falling back to rule-based processing for email ${email.id}`
    );
    await processLeadEmail(email);
    await processBillingEmail(email);
  }
}

/**
 * Process lead data extracted by AI
 */
async function processLeadFromAIAnalysis(
  email: EmailMessage,
  leadData: any
): Promise<void> {
  // Find or create contact
  let contactId: string | undefined;

  if (leadData.contact_email) {
    const clients = await getClients();
    const existingClient = clients.find(
      (c) => c.email === leadData.contact_email
    );
    if (existingClient) {
      contactId = existingClient.id;
    } else {
      // Create new client from AI-extracted data
      const clientData: ClientInsert = {
        first_name: leadData.contact_name?.split(' ')[0] || 'Unknown',
        last_name:
          leadData.contact_name?.split(' ').slice(1).join(' ') || 'Contact',
        email: leadData.contact_email,
        phone: leadData.contact_phone,
        company_name: leadData.company_name,
      };

      const newClient = await createClient(clientData);
      if (newClient) {
        contactId = newClient.id;
      }
    }
  }

  // Create lead record with AI-enhanced data
  const leadPriority =
    leadData.urgency === 'emergency'
      ? 'high'
      : leadData.urgency === 'high'
        ? 'high'
        : leadData.urgency === 'low'
          ? 'low'
          : 'medium';

  const leadDataInsert: LeadInsert = {
    email_message_id: email.id,
    contact_name: leadData.contact_name,
    contact_email: leadData.contact_email,
    contact_phone: leadData.contact_phone,
    company_name: leadData.company_name,
    service_type: leadData.service_type,
    priority: leadPriority as 'low' | 'medium' | 'high',
    lead_source: 'email',
    notes: `AI-extracted lead data. Budget: ${leadData.budget_range || 'Unknown'}. Preferred contact: ${leadData.preferred_contact_method || 'email'}`,
  };

  await createLead(leadDataInsert);

  // Create email lead details with AI-enhanced data
  const emailLeadDetails: EmailLeadDetailsInsert = {
    email_id: email.id,
    contact_name: leadData.contact_name,
    contact_email: leadData.contact_email,
    contact_phone: leadData.contact_phone,
    service_type: leadData.service_type,
    urgency: leadData.urgency as EmailLeadDetails['urgency'],
    budget_hint: leadData.budget_range,
    parsed_confidence: 0.95, // Very high confidence from AI
    source_channel: 'direct_email',
  };

  await createEmailLeadDetails(emailLeadDetails);

  // Update email to require reply
  await updateEmailMessage(email.id, { requires_reply: true });
}

/**
 * Process billing data extracted by AI
 */
async function processBillingFromAIAnalysis(
  email: EmailMessage,
  billingData: any
): Promise<void> {
  // Find contact if possible
  let contactId: string | undefined;
  if (email.sender) {
    const clients = await getClients();
    const existingClient = clients.find((c) => c.email === email.sender);
    if (existingClient) {
      contactId = existingClient.id;
    }
  }

  // Create billing event
  const billingEvent: BillingEventInsert = {
    email_id: email.id,
    contact_id: contactId,
    billing_type: 'customer_invoice' as const,
    direction: 'incoming' as const,
    amount: billingData.amount,
    invoice_number: billingData.invoice_number,
    due_date: billingData.due_date,
    status: 'open' as const,
    parsed_confidence: 0.9,
  };

  await createBillingEvent(billingEvent);

  // Update email to require reply if it's urgent
  const requiresReply =
    billingData.due_date ||
    billingData.amount > 1000 ||
    email.subject?.toLowerCase().includes('overdue');

  if (requiresReply) {
    await updateEmailMessage(email.id, { requires_reply: true });
  }
}

/**
 * Process spending data extracted by AI
 */
async function processSpendingFromAIAnalysis(
  email: EmailMessage,
  spendingData: any
): Promise<void> {
  const spendingEntry = {
    email_message_id: email.id,
    amount: spendingData.amount,
    vendor: spendingData.vendor,
    category: spendingData.category,
    description: spendingData.description || email.subject,
    transaction_date: new Date().toISOString().split('T')[0],
  };

  await createSpendingEntry(spendingEntry);
}

/**
 * Create alerts based on AI analysis
 */
async function createAlertsFromAIAnalysis(
  email: EmailMessage,
  aiAnalysis: any
): Promise<void> {
  const alerts: AlertInsert[] = [];

  if (aiAnalysis.category === 'leads') {
    const severity =
      aiAnalysis.priority === 'urgent'
        ? 'high'
        : aiAnalysis.priority === 'high'
          ? 'high'
          : 'medium';

    alerts.push({
      type: 'new_lead',
      severity,
      email_id: email.id,
      title: `AI-Detected Lead: ${aiAnalysis.extractedData?.leads?.contact_name || 'New Contact'}`,
      message: `${aiAnalysis.summary || 'New potential customer inquiry'}. Service: ${aiAnalysis.extractedData?.leads?.service_type || 'Unknown'}. ${aiAnalysis.action_items?.length ? 'Actions: ' + aiAnalysis.action_items.join(', ') : ''}`,
    });
  }

  if (
    aiAnalysis.category === 'billing' &&
    aiAnalysis.extractedData?.billing?.due_date
  ) {
    const dueDate = new Date(aiAnalysis.extractedData.billing.due_date);
    const daysUntilDue = Math.ceil(
      (dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilDue <= 7) {
      alerts.push({
        type: 'invoice_due',
        severity: daysUntilDue <= 1 ? 'high' : 'medium',
        email_id: email.id,
        title: `Invoice Due ${daysUntilDue <= 0 ? 'Overdue' : `in ${daysUntilDue} days`}`,
        message: `AI detected ${aiAnalysis.extractedData.billing.status || 'unpaid'} invoice for $${aiAnalysis.extractedData.billing.amount}${aiAnalysis.extractedData.billing.invoice_number ? ` (${aiAnalysis.extractedData.billing.invoice_number})` : ''}`,
        due_at: aiAnalysis.extractedData.billing.due_date,
      });
    }
  }

  if (
    aiAnalysis.category === 'spending' &&
    aiAnalysis.extractedData?.spending?.amount > 500
  ) {
    alerts.push({
      type: 'large_vendor_bill',
      severity: 'medium',
      email_id: email.id,
      title: `Large Expense: $${aiAnalysis.extractedData.spending.amount}`,
      message: `AI detected significant ${aiAnalysis.extractedData.spending.category || 'business'} expense from ${aiAnalysis.extractedData.spending.vendor || 'vendor'}`,
    });
  }

  // Create urgent alerts for high-priority items
  if (aiAnalysis.priority === 'urgent' && aiAnalysis.requires_response) {
    alerts.push({
      type: 'system_notification',
      severity: 'high',
      email_id: email.id,
      title: 'Urgent Email Requires Response',
      message:
        aiAnalysis.summary ||
        'This email has been flagged as urgent and requires immediate attention.',
    });
  }

  // Create all alerts
  for (const alert of alerts) {
    await createAlert(alert);
  }
}

/**
 * Contact and Lead Creation Logic (Legacy - kept for fallback)
 */
export async function processLeadEmail(email: EmailMessage): Promise<void> {
  // Extract lead details
  const leadDetails = extractLeadDetailsFromEmail(email);
  if (!leadDetails) return;

  // Find or create contact
  let contactId: string | undefined;

  if (leadDetails.contact_email) {
    // Check if client exists with this email
    const clients = await getClients();
    const existingClient = clients.find(
      (c) => c.email === leadDetails.contact_email
    );
    if (existingClient) {
      contactId = existingClient.id;
    } else {
      // Create new client
      const clientData: ClientInsert = {
        first_name: leadDetails.contact_name?.split(' ')[0] || 'Unknown',
        last_name:
          leadDetails.contact_name?.split(' ').slice(1).join(' ') || 'Contact',
        email: leadDetails.contact_email,
        phone: leadDetails.contact_phone,
        address_line1: leadDetails.address_line,
        city: leadDetails.city,
        state: leadDetails.state,
        zip_code: leadDetails.postal_code,
      };

      const newClient = await createClient(clientData);
      if (newClient) {
        contactId = newClient.id;
      }
    }
  }

  // Create lead record
  const leadData: LeadInsert = {
    email_message_id: email.id,
    contact_name: leadDetails.contact_name,
    contact_email: leadDetails.contact_email,
    contact_phone: leadDetails.contact_phone,
    service_type: leadDetails.service_type,
    priority:
      leadDetails.urgency === 'emergency'
        ? 'high'
        : leadDetails.urgency === 'high'
          ? 'high'
          : 'medium',
    lead_source: leadDetails.source_channel || 'email',
    notes: `Auto-extracted from email. Confidence: ${((leadDetails.parsed_confidence || 0) * 100).toFixed(0)}%`,
  };

  await createLead(leadData);

  // Create email lead details
  await createEmailLeadDetails(leadDetails);

  // Update email to require reply
  await updateEmailMessage(email.id, { requires_reply: true });

  // Create alert
  const alertData: AlertInsert = {
    type: 'new_lead',
    severity: 'high',
    email_id: email.id,
    contact_id: contactId,
    title: `New lead from ${leadDetails.contact_name || leadDetails.contact_email || 'Unknown'}`,
    message: `Service: ${leadDetails.service_type || 'Unknown'}, Location: ${leadDetails.city || 'Unknown'}, Urgency: ${leadDetails.urgency || 'normal'}`,
  };

  await createAlert(alertData);
}

/**
 * Billing Event Processing
 */
export async function processBillingEmail(email: EmailMessage): Promise<void> {
  // Extract billing event
  const billingEvent = extractBillingEventFromEmail(email);
  if (!billingEvent) return;

  // Find contact if possible
  let contactId: string | undefined;
  if (billingEvent.payer_name || email.sender) {
    const clients = await getClients();
    const contactEmail = billingEvent.payer_name || email.sender;
    const existingClient = clients.find(
      (c) =>
        c.email === contactEmail ||
        `${c.first_name} ${c.last_name}`
          .toLowerCase()
          .includes(contactEmail?.toLowerCase() || '')
    );
    if (existingClient) {
      contactId = existingClient.id;
    }
  }

  // Create billing event
  await createBillingEvent({
    ...billingEvent,
    contact_id: contactId,
  });

  // Update email to require reply if it's an invoice or overdue
  const requiresReply =
    billingEvent.billing_type === 'customer_invoice' ||
    billingEvent.status === 'overdue';
  if (requiresReply) {
    await updateEmailMessage(email.id, { requires_reply: true });
  }

  // Create alerts based on billing type
  const alerts: AlertInsert[] = [];

  if (
    billingEvent.billing_type === 'customer_invoice' &&
    billingEvent.due_date
  ) {
    const dueDate = new Date(billingEvent.due_date);
    const daysUntilDue = Math.ceil(
      (dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilDue <= 7) {
      alerts.push({
        type: 'invoice_due',
        severity: daysUntilDue <= 1 ? 'high' : 'medium',
        email_id: email.id,
        contact_id: contactId,
        title: `Invoice due ${daysUntilDue <= 0 ? 'overdue' : `in ${daysUntilDue} days`}`,
        message: `$${billingEvent.amount} ${billingEvent.invoice_number ? `(${billingEvent.invoice_number})` : ''} due ${billingEvent.due_date}`,
        due_at: billingEvent.due_date,
      });
    }
  }

  if (billingEvent.status === 'overdue') {
    alerts.push({
      type: 'invoice_overdue',
      severity: 'high',
      email_id: email.id,
      contact_id: contactId,
      title: 'Overdue invoice',
      message: `$${billingEvent.amount} ${billingEvent.invoice_number ? `(${billingEvent.invoice_number})` : ''} is overdue`,
    });
  }

  if (
    billingEvent.billing_type === 'vendor_bill' &&
    billingEvent.amount > 300
  ) {
    alerts.push({
      type: 'large_vendor_bill',
      severity: 'medium',
      email_id: email.id,
      title: `Large vendor bill: $${billingEvent.amount}`,
      message: `Bill from ${billingEvent.vendor_name || 'Unknown vendor'} for $${billingEvent.amount}`,
    });
  }

  // Create all alerts
  for (const alert of alerts) {
    await createAlert(alert);
  }
}
