'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Mail,
  Send,
  Inbox,
  FileText,
  Users,
  DollarSign,
  Search,
  Plus,
  RefreshCw,
  Star,
  StarOff,
  Eye,
  EyeOff,
  ChevronLeft,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { EmailMessage, updateEmailMessage } from '@/lib/db/email';
import { EmailComposer } from './components/EmailComposer';
import { EmailViewer } from './components/EmailViewer';

interface EmailAccount {
  id: string;
  email_address: string;
  is_active: boolean;
  last_sync_at?: string;
}

type EmailView = 'inbox' | 'compose' | 'view' | 'insights';

export default function EmailClientPage() {
  const { toast } = useToast();
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [emailAccounts, setEmailAccounts] = useState<EmailAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  const [currentView, setCurrentView] = useState<EmailView>('inbox');
  const [activeFolder, setActiveFolder] = useState('inbox');
  const [searchTerm, setSearchTerm] = useState('');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [composeData, setComposeData] = useState<any>(null);

  useEffect(() => {
    loadEmailAccounts();
    loadEmails();
  }, [activeFolder]);

  // Handle OAuth callback parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const error = urlParams.get('error');

    if (success === 'connected') {
      toast({
        title: 'Gmail Connected!',
        description: 'Your Gmail account has been successfully connected.',
      });
      window.history.replaceState({}, '', window.location.pathname);
      loadEmailAccounts();
      loadEmails();
    } else if (error) {
      let errorMessage = 'Failed to connect Gmail account.';
      switch (error) {
        case 'oauth_failed':
          errorMessage = 'Google OAuth authorization failed.';
          break;
        case 'no_code':
          errorMessage = 'No authorization code received from Google.';
          break;
        case 'token_exchange_failed':
          errorMessage =
            'Failed to exchange authorization code for access token.';
          break;
      }
      toast({
        title: 'Connection Failed',
        description: errorMessage,
        variant: 'destructive',
      });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [toast]);

  const loadEmailAccounts = async () => {
    try {
      const response = await fetch('/api/email?action=accounts');
      if (response.ok) {
        const data = await response.json();
        setEmailAccounts(data.accounts || []);
      }
    } catch (error) {
      console.error('Failed to load email accounts:', error);
    }
  };

  const connectGmail = () => {
    window.location.href = '/api/auth/google';
  };

  const syncEmails = async (accountId?: string) => {
    if (!accountId && emailAccounts.length === 0) {
      toast({
        title: 'No Email Account',
        description: 'Please connect a Gmail account first.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSyncing(true);
      const accountToSync = accountId || emailAccounts[0].id;

      const response = await fetch('/api/gmail/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: accountToSync }),
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: 'Sync Complete',
          description: `Processed ${result.processed} emails from Gmail.`,
        });
        await loadEmails();
      } else {
        throw new Error('Sync failed');
      }
    } catch (error) {
      console.error('Failed to sync emails:', error);
      toast({
        title: 'Sync Failed',
        description: 'Failed to sync emails from Gmail.',
        variant: 'destructive',
      });
    } finally {
      setSyncing(false);
    }
  };

  const loadEmails = async () => {
    try {
      setLoading(true);
      const category = activeFolder === 'inbox' ? undefined : activeFolder;
      const response = await fetch(
        `/api/email?category=${category || 'all'}&limit=100`
      );
      if (response.ok) {
        const data = await response.json();
        setEmails(data.messages);
      }
    } catch (error) {
      console.error('Failed to load emails:', error);
      toast({
        title: 'Error',
        description: 'Failed to load emails.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleComposeEmail = (replyData?: {
    type: 'reply' | 'reply-all' | 'forward';
    originalEmail: EmailMessage;
  }) => {
    setComposeData(replyData);
    setCurrentView('compose');
  };

  const handleViewEmail = (email: EmailMessage) => {
    setSelectedEmail(email);
    setCurrentView('view');
    // Mark as read if it was unread
    if (!email.is_read) {
      updateEmailMessage(email.id, { is_read: true });
      // Update local state
      setEmails((prev) =>
        prev.map((e) => (e.id === email.id ? { ...e, is_read: true } : e))
      );
    }
  };

  const handleEmailSent = () => {
    setCurrentView('inbox');
    setComposeData(null);
    loadEmails(); // Refresh to show sent email if applicable
  };

  const toggleStar = async (emailId: string, currentlyStarred: boolean) => {
    try {
      await updateEmailMessage(emailId, { is_starred: !currentlyStarred });
      setEmails((prev) =>
        prev.map((e) =>
          e.id === emailId ? { ...e, is_starred: !currentlyStarred } : e
        )
      );
    } catch (error) {
      console.error('Failed to toggle star:', error);
    }
  };

  const getFolderIcon = (folder: string) => {
    switch (folder) {
      case 'inbox':
        return <Inbox className="w-4 h-4" />;
      case 'sent':
        return <Send className="w-4 h-4" />;
      case 'drafts':
        return <FileText className="w-4 h-4" />;
      case 'leads':
        return <Users className="w-4 h-4" />;
      case 'billing':
        return <DollarSign className="w-4 h-4" />;
      case 'junk':
        return <Mail className="w-4 h-4 text-red-500" />;
      default:
        return <Mail className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'leads':
        return 'bg-green-100 text-green-800';
      case 'billing':
        return 'bg-blue-100 text-blue-800';
      case 'spending':
        return 'bg-red-100 text-red-800';
      case 'junk':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredEmails = emails.filter((email) => {
    const matchesSearch =
      !searchTerm ||
      email.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.sender?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.body_text?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesUnread = !showUnreadOnly || !email.is_read;

    return matchesSearch && matchesUnread;
  });

  const folders = [
    {
      id: 'inbox',
      name: 'Inbox',
      count: emails.filter((e) => !e.is_read).length,
    },
    {
      id: 'leads',
      name: 'Leads',
      count: emails.filter((e) => e.category === 'leads').length,
    },
    {
      id: 'billing',
      name: 'Billing',
      count: emails.filter((e) => e.category === 'billing').length,
    },
    {
      id: 'spending',
      name: 'Spending',
      count: emails.filter((e) => e.category === 'spending').length,
    },
    {
      id: 'junk',
      name: 'Junk',
      count: emails.filter((e) => e.category === 'junk').length,
    },
    { id: 'sent', name: 'Sent', count: 0 }, // TODO: Implement sent emails
    { id: 'drafts', name: 'Drafts', count: 0 }, // TODO: Implement drafts
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Compose Button */}
        <div className="p-4 border-b border-gray-200 space-y-2">
          <Button
            onClick={() => handleComposeEmail()}
            className="w-full"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Compose
          </Button>
          <Button
            onClick={() => setCurrentView('insights')}
            variant="outline"
            className="w-full"
            size="sm"
          >
            <div className="w-4 h-4 mr-2 bg-purple-500 rounded-full"></div>
            AI Insights
          </Button>
        </div>

        {/* Gmail Account Status */}
        <div className="p-4 border-b border-gray-200">
          {emailAccounts.length === 0 ? (
            <div className="text-center">
              <Mail className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-2">Connect Gmail</p>
              <Button onClick={connectGmail} size="sm" variant="outline">
                Connect
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Gmail</span>
                <Button
                  onClick={() => syncEmails()}
                  disabled={syncing}
                  size="sm"
                  variant="ghost"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`}
                  />
                </Button>
              </div>
              <div className="text-xs text-gray-600">
                {emailAccounts[0].email_address}
              </div>
            </div>
          )}
        </div>

        {/* Folders */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-2">
            {folders.map((folder) => (
              <button
                key={folder.id}
                onClick={() => {
                  setActiveFolder(folder.id);
                  setCurrentView('inbox');
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-left rounded-lg hover:bg-gray-100 ${
                  activeFolder === folder.id
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  {getFolderIcon(folder.id)}
                  <span className="text-sm">{folder.name}</span>
                </div>
                {folder.count > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {folder.count}
                  </Badge>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {currentView === 'inbox' && (
          <>
            {/* Toolbar */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search emails..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowUnreadOnly(!showUnreadOnly)}
                >
                  {showUnreadOnly ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Email List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-4 space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-16 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : filteredEmails.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <Mail className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No emails found</p>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredEmails.map((email) => (
                    <div
                      key={email.id}
                      onClick={() => handleViewEmail(email)}
                      className={`p-4 hover:bg-gray-50 cursor-pointer ${
                        !email.is_read ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleStar(email.id, email.is_starred);
                          }}
                          className="mt-1"
                        >
                          {email.is_starred ? (
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          ) : (
                            <StarOff className="w-4 h-4 text-gray-400" />
                          )}
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`font-medium truncate ${!email.is_read ? 'font-semibold' : ''}`}
                            >
                              {email.sender || 'Unknown'}
                            </span>
                            {email.category !== 'unreviewed' && (
                              <Badge
                                className={getCategoryColor(email.category)}
                                variant="secondary"
                              >
                                {email.category}
                              </Badge>
                            )}
                            {email.extracted_data?.ai_summary && (
                              <div
                                className="w-2 h-2 bg-purple-500 rounded-full"
                                title="AI Analyzed"
                              ></div>
                            )}
                            {email.priority && email.priority !== 'normal' && (
                              <Badge
                                variant="outline"
                                className={`text-xs ${
                                  email.priority === 'urgent'
                                    ? 'border-red-500 text-red-700'
                                    : email.priority === 'high'
                                      ? 'border-orange-500 text-orange-700'
                                      : 'border-gray-500 text-gray-700'
                                }`}
                              >
                                {email.priority}
                              </Badge>
                            )}
                          </div>
                          <div
                            className={`text-sm truncate mb-1 ${!email.is_read ? 'font-medium' : 'text-gray-600'}`}
                          >
                            {email.subject || 'No subject'}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {email.extracted_data?.ai_summary ||
                              email.body_text?.substring(0, 100) + '...'}
                          </div>
                        </div>

                        <div className="text-xs text-gray-500 whitespace-nowrap">
                          {email.received_at
                            ? new Date(email.received_at).toLocaleDateString()
                            : 'Unknown'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {currentView === 'compose' && (
          <EmailComposer
            initialData={composeData}
            onClose={() => {
              setCurrentView('inbox');
              setComposeData(null);
            }}
            onSent={handleEmailSent}
          />
        )}

        {currentView === 'view' && selectedEmail && (
          <EmailViewer
            email={selectedEmail}
            onClose={() => setCurrentView('inbox')}
            onReply={(type) =>
              handleComposeEmail({
                type,
                originalEmail: selectedEmail,
              })
            }
          />
        )}

        {currentView === 'insights' && (
          <div className="flex flex-col h-full bg-white">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">AI Email Insights</h2>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const unanalyzedEmails = emails.filter(
                      (e) => !e.extracted_data?.ai_summary
                    );
                    if (unanalyzedEmails.length === 0) {
                      toast({
                        title: 'All Analyzed',
                        description:
                          'All emails have already been analyzed by AI.',
                      });
                      return;
                    }

                    try {
                      const response = await fetch('/api/emails/analyze', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          emailIds: unanalyzedEmails
                            .slice(0, 10)
                            .map((e) => e.id),
                        }),
                      });

                      if (response.ok) {
                        const result = await response.json();
                        toast({
                          title: 'AI Analysis Complete',
                          description: `Analyzed ${result.successful} emails with AI.`,
                        });
                        loadEmails(); // Refresh to show new analysis
                      } else {
                        throw new Error('Analysis failed');
                      }
                    } catch (error) {
                      toast({
                        title: 'Analysis Failed',
                        description: 'Failed to analyze emails with AI.',
                        variant: 'destructive',
                      });
                    }
                  }}
                >
                  Analyze Unanalyzed Emails
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentView('inbox')}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Insights Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="text-sm font-medium">AI Analyzed</span>
                    </div>
                    <div className="text-2xl font-bold mt-2">
                      {
                        emails.filter((e) => e.extracted_data?.ai_summary)
                          .length
                      }
                    </div>
                    <div className="text-xs text-gray-500">
                      of {emails.length} emails
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-sm font-medium">Urgent</span>
                    </div>
                    <div className="text-2xl font-bold mt-2">
                      {emails.filter((e) => e.priority === 'urgent').length}
                    </div>
                    <div className="text-xs text-gray-500">
                      require attention
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium">
                        Leads Detected
                      </span>
                    </div>
                    <div className="text-2xl font-bold mt-2">
                      {emails.filter((e) => e.category === 'leads').length}
                    </div>
                    <div className="text-xs text-gray-500">
                      potential customers
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm font-medium">
                        Response Needed
                      </span>
                    </div>
                    <div className="text-2xl font-bold mt-2">
                      {emails.filter((e) => e.requires_reply).length}
                    </div>
                    <div className="text-xs text-gray-500">awaiting reply</div>
                  </CardContent>
                </Card>
              </div>

              {/* Priority Emails */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    High Priority Emails
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {emails
                      .filter(
                        (e) => e.priority === 'urgent' || e.priority === 'high'
                      )
                      .slice(0, 5)
                      .map((email) => (
                        <div
                          key={email.id}
                          onClick={() => {
                            setSelectedEmail(email);
                            setCurrentView('view');
                          }}
                          className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-medium text-sm">
                                {email.subject}
                              </div>
                              <div className="text-xs text-gray-600 mt-1">
                                {email.extracted_data?.ai_summary ||
                                  email.body_text?.substring(0, 80) + '...'}
                              </div>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline" className="text-xs">
                                  {email.priority}
                                </Badge>
                                {email.extracted_data?.ai_sentiment && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {email.extracted_data.ai_sentiment}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="text-xs text-gray-500">
                              {email.received_at
                                ? new Date(
                                    email.received_at
                                  ).toLocaleDateString()
                                : ''}
                            </div>
                          </div>
                        </div>
                      ))}
                    {emails.filter(
                      (e) => e.priority === 'urgent' || e.priority === 'high'
                    ).length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        No high priority emails found
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Action Items Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    AI-Recommended Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {emails
                      .filter(
                        (e) =>
                          e.extracted_data?.ai_action_items &&
                          e.extracted_data.ai_action_items.length > 0
                      )
                      .slice(0, 10)
                      .map((email) => (
                        <div
                          key={email.id}
                          className="border-l-4 border-blue-500 pl-4"
                        >
                          <div className="font-medium text-sm mb-1">
                            {email.subject}
                          </div>
                          <ul className="text-xs text-gray-600 space-y-1">
                            {email.extracted_data.ai_action_items
                              .slice(0, 3)
                              .map((action: string, idx: number) => (
                                <li
                                  key={idx}
                                  className="flex items-start gap-2"
                                >
                                  <span className="text-blue-500 mt-1">•</span>
                                  <span>{action}</span>
                                </li>
                              ))}
                          </ul>
                        </div>
                      ))}
                    {emails.filter(
                      (e) => e.extracted_data?.ai_action_items?.length > 0
                    ).length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        No AI action items available
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Sentiment Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Sentiment Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {
                          emails.filter(
                            (e) => e.extracted_data?.ai_sentiment === 'positive'
                          ).length
                        }
                      </div>
                      <div className="text-sm text-gray-600">Positive</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-600">
                        {
                          emails.filter(
                            (e) => e.extracted_data?.ai_sentiment === 'neutral'
                          ).length
                        }
                      </div>
                      <div className="text-sm text-gray-600">Neutral</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {
                          emails.filter(
                            (e) => e.extracted_data?.ai_sentiment === 'negative'
                          ).length
                        }
                      </div>
                      <div className="text-sm text-gray-600">Negative</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
