'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Reply,
  ReplyAll,
  Forward,
  Star,
  StarOff,
  Archive,
  Trash2,
  MoreHorizontal,
  Paperclip,
  ChevronLeft,
} from 'lucide-react';
import { EmailMessage } from '@/lib/db/email';

interface EmailViewerProps {
  email: EmailMessage;
  onClose: () => void;
  onReply: (type: 'reply' | 'reply-all' | 'forward') => void;
}

export function EmailViewer({ email, onClose, onReply }: EmailViewerProps) {
  const [isStarred, setIsStarred] = useState(email.is_starred);

  const toggleStar = () => {
    setIsStarred(!isStarred);
    // TODO: Update in database
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'leads':
        return 'bg-green-100 text-green-800';
      case 'billing':
        return 'bg-blue-100 text-blue-800';
      case 'spending':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onClose}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="text-lg font-semibold truncate">
              {email.subject || 'No subject'}
            </h2>
            <p className="text-sm text-gray-600">
              From: {email.sender || 'Unknown'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={toggleStar}>
            {isStarred ? (
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
            ) : (
              <StarOff className="w-4 h-4 text-gray-400" />
            )}
          </Button>
          <Button variant="ghost" size="sm">
            <Archive className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Trash2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Email Meta */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium">{email.sender || 'Unknown'}</span>
              {email.category !== 'unreviewed' && (
                <Badge
                  className={getCategoryColor(email.category)}
                  variant="secondary"
                >
                  {email.category}
                </Badge>
              )}
            </div>
            <div className="text-sm text-gray-600">
              To: {email.recipient || 'Unknown'}
            </div>
            <div className="text-sm text-gray-600">
              {email.received_at
                ? new Date(email.received_at).toLocaleString()
                : 'Unknown date'}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onReply('reply')}
            >
              <Reply className="w-4 h-4 mr-1" />
              Reply
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onReply('reply-all')}
            >
              <ReplyAll className="w-4 h-4 mr-1" />
              Reply All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onReply('forward')}
            >
              <Forward className="w-4 h-4 mr-1" />
              Forward
            </Button>
          </div>
        </div>
      </div>

      {/* Email Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-none">
          {email.body_html ? (
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: email.body_html }}
            />
          ) : (
            <div className="whitespace-pre-wrap text-sm">
              {email.body_text || 'No content available'}
            </div>
          )}
        </div>

        {/* Attachments */}
        {email.has_attachments && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Paperclip className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">
                Attachments
              </span>
            </div>
            <p className="text-sm text-gray-600">
              Attachments are not yet supported in the web interface. Please
              check Gmail directly to view attachments.
            </p>
          </div>
        )}

        {/* AI Analysis Results */}
        {email.extracted_data?.ai_summary && (
          <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <h4 className="text-sm font-semibold text-purple-900">
                AI Analysis
              </h4>
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                {Math.round((email.extracted_data.ai_confidence || 0) * 100)}%
                confidence
              </span>
            </div>

            {/* AI Summary */}
            <div className="mb-4">
              <h5 className="text-xs font-medium text-gray-700 mb-1">
                SUMMARY
              </h5>
              <p className="text-sm text-gray-800">
                {email.extracted_data.ai_summary}
              </p>
            </div>

            {/* Sentiment & Priority */}
            <div className="flex gap-4 mb-4">
              {email.extracted_data.ai_sentiment && (
                <div>
                  <span className="text-xs font-medium text-gray-700">
                    SENTIMENT
                  </span>
                  <span
                    className={`ml-2 text-xs px-2 py-1 rounded ${
                      email.extracted_data.ai_sentiment === 'positive'
                        ? 'bg-green-100 text-green-700'
                        : email.extracted_data.ai_sentiment === 'negative'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {email.extracted_data.ai_sentiment}
                  </span>
                </div>
              )}
              {email.priority && (
                <div>
                  <span className="text-xs font-medium text-gray-700">
                    PRIORITY
                  </span>
                  <span
                    className={`ml-2 text-xs px-2 py-1 rounded ${
                      email.priority === 'urgent'
                        ? 'bg-red-100 text-red-700'
                        : email.priority === 'high'
                          ? 'bg-orange-100 text-orange-700'
                          : email.priority === 'normal'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {email.priority}
                  </span>
                </div>
              )}
            </div>

            {/* Action Items */}
            {email.extracted_data.ai_action_items &&
              email.extracted_data.ai_action_items.length > 0 && (
                <div className="mb-4">
                  <h5 className="text-xs font-medium text-gray-700 mb-2">
                    ACTION ITEMS
                  </h5>
                  <ul className="space-y-1">
                    {email.extracted_data.ai_action_items.map(
                      (action: string, index: number) => (
                        <li
                          key={index}
                          className="flex items-start gap-2 text-sm"
                        >
                          <span className="text-blue-500 mt-1">•</span>
                          <span className="text-gray-800">{action}</span>
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}

            {/* Suggested Response */}
            {email.extracted_data.suggested_response && (
              <div className="mb-4">
                <h5 className="text-xs font-medium text-gray-700 mb-2">
                  SUGGESTED RESPONSE
                </h5>
                <div className="bg-white p-3 rounded border text-sm text-gray-800">
                  {email.extracted_data.suggested_response}
                </div>
              </div>
            )}

            {/* Key Topics */}
            {email.extracted_data.key_topics &&
              email.extracted_data.key_topics.length > 0 && (
                <div className="mb-4">
                  <h5 className="text-xs font-medium text-gray-700 mb-2">
                    KEY TOPICS
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {email.extracted_data.key_topics.map(
                      (topic: string, index: number) => (
                        <span
                          key={index}
                          className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded"
                        >
                          {topic}
                        </span>
                      )
                    )}
                  </div>
                </div>
              )}

            {/* AI Reasoning */}
            {email.extracted_data.ai_reasoning && (
              <details className="mt-4">
                <summary className="text-xs font-medium text-gray-700 cursor-pointer hover:text-gray-900">
                  AI Analysis Details
                </summary>
                <div className="mt-2 text-xs text-gray-600 bg-white p-2 rounded border">
                  {email.extracted_data.ai_reasoning}
                </div>
              </details>
            )}
          </div>
        )}

        {/* Extracted Data (Legacy) */}
        {email.extracted_data &&
          !email.extracted_data.ai_summary &&
          Object.keys(email.extracted_data).length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-2">
                Extracted Data
              </h4>
              <pre className="text-xs bg-white p-2 rounded border text-blue-800 overflow-x-auto">
                {JSON.stringify(email.extracted_data, null, 2)}
              </pre>
            </div>
          )}
      </div>
    </div>
  );
}
