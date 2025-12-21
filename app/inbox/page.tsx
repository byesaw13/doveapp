'use client';

// Force browser cache invalidation - v2.0
import { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { AttachmentViewer } from '@/components/inbox/AttachmentViewer';

type Conversation = {
  id: string;
  title: string | null;
  status: 'open' | 'closed';
  lead_score: string | null;
  primary_channel: string | null;
  last_message_at: string | null;
  created_at: string;
  customer?: {
    id: string;
    full_name: string | null;
    phone: string | null;
    email: string | null;
  } | null;
};

type ConversationsResponse = {
  conversations?: Conversation[];
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
  };
};

type Message = {
  id: string;
  conversation_id: string;
  customer_id: string;
  channel: string;
  direction: 'incoming' | 'outgoing';
  external_id: string | null;
  message_text: string | null;
  raw_payload?: unknown;
  attachments?: Array<{
    url: string;
    type: string;
    filename?: string;
  }>;
  ai_summary?: string | null;
  ai_category?: string | null;
  ai_urgency?: string | null;
  ai_next_action?: string | null;
  ai_extracted?: Record<string, unknown> | null;
  created_at: string;
};

function formatDate(dateString: string | null): string {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

export default function InboxPage() {
  // Initialize conversations as empty array and ensure it stays an array
  const [conversations, setConversationsRaw] = useState<Conversation[]>([]);

  // Safe setter that ensures conversations is always an array
  const setConversations = (value: Conversation[] | unknown) => {
    const safeValue = Array.isArray(value) ? value : [];
    if (!Array.isArray(value)) {
      console.error(
        '[INBOX] setConversations called with non-array:',
        value,
        typeof value,
        'Stack:',
        new Error().stack
      );
    }
    setConversationsRaw(safeValue);
  };

  // Safety check: verify conversations is always an array
  useEffect(() => {
    if (!Array.isArray(conversations)) {
      console.error(
        '[INBOX] CRITICAL: conversations state corrupted! Type:',
        typeof conversations,
        'Value:',
        conversations
      );
      // Force reset to empty array
      setConversationsRaw([]);
    }
  }, [conversations]);

  const [pagination, setPagination] = useState<
    ConversationsResponse['pagination'] | null
  >(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [statusFilter, setStatusFilter] = useState<'open' | 'closed' | 'all'>(
    'open'
  );
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let isMounted = true; // Prevent state updates after unmount

    const loadConversations = async () => {
      try {
        setLoadingList(true);
        const res = await fetch(
          `/api/inbox/conversations?st    atus=${statusFilter}&page=${currentPage}`
        );
        const data: ConversationsResponse | unknown = await res.json();
        const list = Array.isArray((data as any)?.conversations)
          ? ((data as any).conversations as Conversation[])
          : Array.isArray(data)
            ? (data as Conversation[])
            : [];

        // Only update state if component is still mounted
        if (isMounted) {
          setConversations(list);
          setPagination((data as any)?.pagination || null);
          if (!selectedId && list.length) {
            setSelectedId(list[0].id);
          }
        }
      } catch (error) {
        console.error('Failed to load conversations', error);
        // Ensure conversations is still an array even on error
        if (isMounted) {
          setConversations([]);
        }
      } finally {
        if (isMounted) {
          setLoadingList(false);
        }
      }
    };

    loadConversations();

    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, [selectedId, statusFilter, currentPage]);

  useEffect(() => {
    if (!selectedId) return;

    let isMounted = true;

    const loadMessages = async () => {
      try {
        setLoadingMessages(true);
        const res = await fetch(
          `/api/inbox/conversations/${selectedId}/messages`
        );
        const data = await res.json();
        const list: Message[] = Array.isArray(data)
          ? data
          : Array.isArray((data as any)?.messages)
            ? (data as any).messages
            : [];

        if (isMounted) {
          setMessages(list);
        }
      } catch (error) {
        console.error('Failed to load messages', error);
        if (isMounted) {
          setMessages([]);
        }
      } finally {
        if (isMounted) {
          setLoadingMessages(false);
        }
      }
    };

    loadMessages();

    return () => {
      isMounted = false;
    };
  }, [selectedId]);

  // Create a safe conversations map to avoid .find() calls
  // Add extra safety checks to prevent HMR-related corruption
  const conversationsMap = useMemo(() => {
    const map = new Map<string, Conversation>();
    // Double-check that conversations is actually an array before iterating
    if (Array.isArray(conversations) && conversations.length > 0) {
      try {
        conversations.forEach((conv) => {
          if (conv && conv.id) {
            map.set(conv.id, conv);
          }
        });
      } catch (error) {
        console.error('Error building conversationsMap:', error, conversations);
      }
    }
    return map;
  }, [conversations]);

  // Safe selectedConversation lookup using Map instead of .find()
  // NEVER call conversations.find() - always use the Map!
  const selectedConversation = selectedId
    ? conversationsMap.get(selectedId)
    : undefined;

  const latestAi = useMemo(() => {
    const reversed = [...messages].reverse();
    return reversed.find(
      (m) => m.ai_summary || m.ai_category || m.ai_urgency || m.ai_next_action
    );
  }, [messages]);

  const handleSelectConversation = (id: string) => {
    setSelectedId(id);
    setMessages([]);
  };

  const handleSendReply = () => {
    if (!replyText.trim()) return;
    setReplyText('');
  };

  const handleStatusChange = async (newStatus: 'open' | 'closed') => {
    if (!selectedConversation) return;

    try {
      const res = await fetch(
        `/api/inbox/conversations/${selectedConversation.id}/status`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (res.ok) {
        // Reload conversations to reflect changes and maintain pagination
        try {
          const listRes = await fetch(
            `/api/inbox/conversations?status=${statusFilter}&page=${currentPage}`
          );
          const data: ConversationsResponse | unknown = await listRes.json();
          const list = Array.isArray((data as any)?.conversations)
            ? ((data as any).conversations as Conversation[])
            : Array.isArray(data)
              ? (data as Conversation[])
              : [];
          setConversations(list);
          setPagination((data as any)?.pagination || null);
        } catch (reloadError) {
          console.error(
            'Failed to reload conversations after status change',
            reloadError
          );
          // Ensure state remains valid even if reload fails
          setConversations([]);
        }
      } else {
        console.error('Failed to update status');
      }
    } catch (error) {
      console.error('Status update error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl py-6 px-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Unified Inbox
            </h1>
            <p className="text-sm text-slate-600">
              SMS, WhatsApp, Email, and Webform messages in one place.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as 'open' | 'closed' | 'all');
                setCurrentPage(1); // Reset to first page when filter changes
              }}
              className="rounded-md border border-slate-300 px-3 py-1 text-sm"
            >
              <option value="open">Open</option>
              <option value="closed">Closed</option>
              <option value="all">All</option>
            </select>
            {loadingList && (
              <span className="text-xs text-slate-500">
                Refreshing conversations…
              </span>
            )}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          {/* Conversation list */}
          <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-4 py-2">
              <h2 className="text-sm font-semibold text-slate-800">
                Conversations
              </h2>
            </div>
            <div className="max-h-[75vh] overflow-y-auto">
              {Array.isArray(conversations) &&
                conversations.map((conversation: Conversation) => {
                  const isActive = conversation.id === selectedId;
                  return (
                    <button
                      key={conversation.id}
                      onClick={() => handleSelectConversation(conversation.id)}
                      className={clsx(
                        'w-full border-b border-slate-100 px-4 py-3 text-left transition hover:bg-slate-50',
                        isActive && 'bg-slate-100'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-slate-900">
                          {conversation.customer?.full_name ||
                            conversation.title ||
                            'Unknown contact'}
                        </div>
                        {conversation.lead_score && (
                          <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">
                            Lead {conversation.lead_score}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-slate-600">
                        <span className="uppercase">
                          {conversation.primary_channel || 'channel'}
                        </span>
                        <span>•</span>
                        <span>{formatDate(conversation.last_message_at)}</span>
                      </div>
                      {conversation.customer?.phone && (
                        <div className="mt-1 text-xs text-slate-500">
                          {conversation.customer.phone}
                        </div>
                      )}
                    </button>
                  );
                })}
              {(!Array.isArray(conversations) || conversations.length === 0) &&
                !loadingList && (
                  <div className="p-4 text-sm text-slate-500">
                    No conversations yet. Send a test webform or Twilio message
                    to get started.
                  </div>
                )}
            </div>

            {/* Pagination controls */}
            {pagination && (
              <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
                <div className="text-sm text-slate-600">
                  Showing{' '}
                  {Array.isArray(conversations) ? conversations.length : 0} of{' '}
                  {pagination.total} conversations (Page {pagination.page} of{' '}
                  {Math.ceil(pagination.total / pagination.pageSize)})
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={currentPage === 1}
                    className="rounded-md px-3 py-1 text-sm border border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-slate-600">
                    Page {currentPage} of{' '}
                    {Math.ceil(
                      (pagination?.total || 0) / (pagination?.pageSize || 20)
                    )}
                  </span>
                  <button
                    onClick={() => setCurrentPage((prev) => prev + 1)}
                    disabled={!pagination.hasMore}
                    className="rounded-md px-3 py-1 text-sm border border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Messages + AI panel */}
          <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
            <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                <div>
                  <h2 className="text-sm font-semibold text-slate-800">
                    {selectedConversation?.customer?.full_name ||
                      selectedConversation?.title ||
                      'Select a conversation'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {selectedConversation?.customer?.email ||
                      selectedConversation?.customer?.phone ||
                      '—'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {selectedConversation &&
                    (selectedConversation.status === 'open' ? (
                      <button
                        onClick={() => handleStatusChange('closed')}
                        className="rounded-md bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200"
                      >
                        Mark done
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStatusChange('open')}
                        className="rounded-md bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-200"
                      >
                        Reopen
                      </button>
                    ))}
                  {loadingMessages && (
                    <span className="text-xs text-slate-500">Loading…</span>
                  )}
                </div>
              </div>
              <div className="flex min-h-[420px] flex-col justify-between">
                <div className="space-y-3 overflow-y-auto px-4 py-3">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={clsx(
                        'max-w-xl rounded-lg border px-3 py-2 text-sm shadow-sm',
                        message.direction === 'incoming'
                          ? 'border-slate-200 bg-slate-50 text-slate-900'
                          : 'border-emerald-100 bg-emerald-50 text-emerald-900 ml-auto'
                      )}
                    >
                      <div className="mb-1 flex items-center justify-between text-[11px] text-slate-500">
                        <span className="uppercase tracking-wide">
                          {message.direction} • {message.channel}
                        </span>
                        <span>{formatDate(message.created_at)}</span>
                      </div>
                      <div className="whitespace-pre-wrap text-sm">
                        {message.message_text || ''}
                      </div>
                      <AttachmentViewer
                        attachments={message.attachments || []}
                        messageId={message.id}
                      />
                    </div>
                  ))}
                  {messages.length === 0 && !loadingMessages && (
                    <p className="text-sm text-slate-500">No messages yet.</p>
                  )}
                </div>

                <div className="border-t border-slate-200 px-4 py-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Reply (placeholder – wire later)"
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <button
                      onClick={handleSendReply}
                      className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                    >
                      Send
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-4 py-3">
                <h2 className="text-sm font-semibold text-slate-800">
                  AI summary
                </h2>
                <p className="text-xs text-slate-500">
                  Latest AI output for this conversation.
                </p>
              </div>
              <div className="space-y-3 px-4 py-3 text-sm text-slate-800">
                {latestAi ? (
                  <>
                    {latestAi.ai_summary && (
                      <div>
                        <p className="text-xs uppercase text-slate-500">
                          Summary
                        </p>
                        <p>{latestAi.ai_summary}</p>
                      </div>
                    )}
                    {(latestAi.ai_category || latestAi.ai_urgency) && (
                      <div className="flex gap-2 text-xs">
                        {latestAi.ai_category && (
                          <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-700">
                            Category: {latestAi.ai_category}
                          </span>
                        )}
                        {latestAi.ai_urgency && (
                          <span className="rounded-full bg-amber-100 px-2 py-1 text-amber-800">
                            Urgency: {latestAi.ai_urgency}
                          </span>
                        )}
                      </div>
                    )}
                    {latestAi.ai_next_action && (
                      <div>
                        <p className="text-xs uppercase text-slate-500">
                          Next action
                        </p>
                        <p>{latestAi.ai_next_action}</p>
                      </div>
                    )}
                    {latestAi.ai_extracted && (
                      <div className="space-y-1 text-xs text-slate-600">
                        <p className="uppercase text-[11px] text-slate-500">
                          Extracted
                        </p>
                        <pre className="whitespace-pre-wrap rounded bg-slate-50 px-2 py-2 text-[11px] text-slate-700">
                          {JSON.stringify(latestAi.ai_extracted, null, 2)}
                        </pre>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-slate-500">
                    No AI summary yet. Send a message to trigger processing.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
