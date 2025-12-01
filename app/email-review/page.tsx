'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Mail,
  DollarSign,
  FileText,
  Users,
  Eye,
  Search,
  RefreshCw,
  Settings,
  Brain,
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import {
  extractSpendingFromEmail,
  extractBillingFromEmail,
  extractLeadFromEmail,
  createSpendingEntry,
  createBillingEntry,
  createLead,
  updateEmailMessage,
  EmailMessage,
} from '@/lib/db/email';

interface EmailAccount {
  id: string;
  email_address: string;
  is_active: boolean;
  last_sync_at?: string;
}

export default function EmailReviewPage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [emailAccounts, setEmailAccounts] = useState<EmailAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  const [activeTab, setActiveTab] = useState('unreviewed');
  const [searchTerm, setSearchTerm] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadEmailAccounts();
    loadEmails();
  }, [activeTab]);

  // Handle OAuth callback parameters
  useEffect(() => {
    // Check URL parameters for OAuth results
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const error = urlParams.get('error');

    console.log('Checking URL params - success:', success, 'error:', error);

    if (success === 'connected') {
      console.log('OAuth success detected, reloading data...');
      toast({
        title: 'Gmail Connected!',
        description:
          'Your Gmail account has been successfully connected. Emails will be synced shortly.',
      });
      // Clear URL parameters
      window.history.replaceState({}, '', window.location.pathname);
      // Reload email accounts to show the new connection
      loadEmailAccounts();
      loadEmails();
    } else if (error) {
      let errorMessage = 'Failed to connect Gmail account.';
      switch (error) {
        case 'oauth_failed':
          errorMessage = 'Google OAuth authorization failed. Please try again.';
          break;
        case 'no_code':
          errorMessage = 'No authorization code received from Google.';
          break;
        case 'token_exchange_failed':
          errorMessage =
            'Failed to exchange authorization code for access token.';
          break;
        case 'profile_fetch_failed':
          errorMessage = 'Failed to fetch your Google profile information.';
          break;
        case 'server_error':
          errorMessage = 'Server error occurred during Gmail connection.';
          break;
      }
      toast({
        title: 'Connection Failed',
        description: errorMessage,
        variant: 'destructive',
      });
      // Clear URL parameters
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [toast]);

  const loadEmailAccounts = async () => {
    try {
      const response = await fetch('/api/email?action=accounts');
      if (response.ok) {
        const data = await response.json();
        setEmailAccounts(data.accounts || []);
      } else {
        console.error('Failed to load email accounts');
        setEmailAccounts([]);
      }
    } catch (error) {
      console.error('Failed to load email accounts:', error);
      setEmailAccounts([]);
    }
  };

  const connectGmail = () => {
    window.location.href = '/api/auth/google';
  };

  const categorizeAllEmails = async () => {
    try {
      setProcessing(true);
      console.log('Starting mass AI categorization...');

      const response = await fetch('/api/email?action=categorize_all', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Mass categorization failed');
      }

      const result = await response.json();
      console.log('Mass categorization result:', result);

      toast({
        title: 'Mass Categorization Complete',
        description: `Processed ${result.processed} emails with ${result.errors} errors`,
      });

      // Refresh emails to show updated categories
      await loadEmails();
    } catch (error) {
      console.error('Failed to categorize all emails:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: 'Mass Categorization Failed',
        description: `Failed to categorize emails: ${errorMessage}`,
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const syncEmails = async (accountId?: string) => {
    console.log(
      'Starting email sync, accountId:',
      accountId,
      'emailAccounts:',
      emailAccounts.length
    );
    console.log('Available accounts:', emailAccounts);
    if (!accountId && emailAccounts.length === 0) {
      console.log('No email accounts found');
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
      console.log('Syncing account:', accountToSync);

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
        await loadEmails(); // Refresh the email list
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
      const response = await fetch(
        `/api/email?category=${activeTab}&limit=100`
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

  const handleCategorizeEmail = async (
    emailId: string,
    useAI: boolean = false
  ) => {
    try {
      setProcessing(true);

      if (useAI) {
        // Use AI categorization
        console.log(
          '🎯 MAKING AI REQUEST TO:',
          `/api/email?action=categorize&id=${emailId}`
        );
        console.log(
          'Email exists in local state:',
          !!emails.find((e) => e.id === emailId)
        );
        console.log(
          'Email ID type:',
          typeof emailId,
          'length:',
          emailId.length
        );
        console.log(
          'Full email object:',
          emails.find((e) => e.id === emailId)
        );
        console.log(
          'All emails in state:',
          emails.map((e) => ({ id: e.id, subject: e.subject }))
        );
        console.log('Total emails loaded:', emails.length);
        console.log('Email accounts loaded:', emailAccounts.length);
        console.log(
          'Available accounts:',
          emailAccounts.map((a) => ({ id: a.id, email: a.email_address }))
        );
        console.log('=== END DEBUG ===');
        const response = await fetch(
          `/api/email?action=categorize&id=${emailId}`
        );
        console.log('API response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('API error response:', errorText);
          throw new Error(
            `AI categorization failed: ${response.status} ${errorText}`
          );
        }

        const result = await response.json();
        console.log('AI categorization result:', result);

        toast({
          title: 'Smart Categorization Complete',
          description: `Email categorized as ${result.category} (confidence: ${(result.confidence * 100).toFixed(0)}%)`,
        });
      } else {
        // Use manual categorization (existing logic)
        const email = emails.find((e) => e.id === emailId);
        if (!email) return;

        let category: 'spending' | 'billing' | 'leads' | 'other' = 'other';
        let extractedData: any = {};

        const content =
          `${email.subject || ''} ${email.body_text || ''}`.toLowerCase();

        // Basic keyword matching
        if (
          content.includes('receipt') ||
          content.includes('invoice') ||
          content.includes('paid')
        ) {
          category = 'spending';
          const spendingData = extractSpendingFromEmail(email);
          if (spendingData) {
            extractedData.spending = spendingData;
            await createSpendingEntry({
              email_message_id: emailId,
              ...spendingData,
            });
          }
        } else if (
          content.includes('bill') ||
          content.includes('due') ||
          content.includes('statement')
        ) {
          category = 'billing';
          const billingData = extractBillingFromEmail(email);
          if (billingData) {
            extractedData.billing = billingData;
            await createBillingEntry({
              email_message_id: emailId,
              ...billingData,
            });
          }
        } else if (
          content.includes('quote') ||
          content.includes('estimate') ||
          content.includes('interested')
        ) {
          category = 'leads';
          const leadData = extractLeadFromEmail(email);
          if (leadData) {
            extractedData.leads = leadData;
            await createLead(leadData);
          }
        }

        // Update the email with categorization
        await updateEmailMessage(emailId, {
          category,
          extracted_data: extractedData,
          reviewed_by: 'user',
          reviewed_at: new Date().toISOString(),
        });

        toast({
          title: 'Email Categorized',
          description: `Email categorized as ${category}`,
        });
      }

      // Refresh emails
      await loadEmails();
    } catch (error) {
      console.error('Failed to categorize email:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error('Categorization error details:', errorMessage);
      console.error('Full error object:', error);
      console.log('=== ERROR DEBUG END ===');
      console.log(
        'Please check the terminal/server logs for API debugging information'
      );
      console.log('Look for "AI categorization requested" and related logs.');
      console.log(
        'If you see "Email not found", you need to sync emails first.'
      );
      console.log(
        'If you see database errors, check your Supabase connection.'
      );
      console.log('=== COMPLETE DEBUG END ===');
      console.log(
        'If you need help, share the console logs from both browser and terminal.'
      );
      console.log(
        'Most common issues: 1) No emails synced, 2) Invalid email ID, 3) Database connection issues'
      );
      console.log(
        'Solution: First sync emails, then try categorization again.'
      );
      console.log(
        'If emails are synced but categorization fails, check database permissions.'
      );
      console.log('=== FINAL DEBUG END ===');
      console.log(
        '🎯 QUICK FIX: Go to email review page → Click "Sync Emails" first → Then try "Smart Categorize"'
      );
      console.log(
        "If that doesn't work, check the detailed logs above for the specific error."
      );
      toast({
        title: 'Categorization Failed',
        description: `Failed to categorize email: ${errorMessage}`,
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'spending':
        return <DollarSign className="w-4 h-4" />;
      case 'billing':
        return <FileText className="w-4 h-4" />;
      case 'leads':
        return <Users className="w-4 h-4" />;
      default:
        return <Mail className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'spending':
        return 'bg-red-100 text-red-800';
      case 'billing':
        return 'bg-blue-100 text-blue-800';
      case 'leads':
        return 'bg-green-100 text-green-800';
      case 'other':
        return 'bg-gray-100 text-gray-800';
      case 'ignored':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-purple-100 text-purple-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'normal':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const filteredEmails = emails.filter(
    (email) =>
      !searchTerm ||
      email.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.sender?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.body_text?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Email Review</h1>
          <p className="text-muted-foreground">
            Review and categorize emails for spending, billing, and leads
          </p>
        </div>
        <Badge variant="secondary" className="text-lg px-3 py-1">
          {filteredEmails.length} emails
        </Badge>
      </div>

      {/* Gmail Account Connection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Gmail Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          {emailAccounts.length === 0 ? (
            <div className="text-center py-6">
              <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">
                Connect Gmail Account
              </h3>
              <p className="text-muted-foreground mb-4">
                Connect your Gmail account to automatically sync and categorize
                emails for spending, billing, and leads.
              </p>
              <Button onClick={connectGmail}>Connect Gmail Account</Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Connected Accounts</h4>
                  <p className="text-sm text-muted-foreground">
                    {emailAccounts.length} Gmail account
                    {emailAccounts.length !== 1 ? 's' : ''} connected
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => syncEmails()}
                    disabled={syncing}
                    variant="outline"
                  >
                    <RefreshCw
                      className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`}
                    />
                    {syncing ? 'Syncing...' : 'Sync Emails'}
                  </Button>
                  <Button
                    onClick={categorizeAllEmails}
                    disabled={processing}
                    variant="secondary"
                  >
                    <Brain className="w-4 h-4 mr-2" />
                    {processing ? 'AI Processing...' : 'Categorize All'}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                {emailAccounts.map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <div className="font-medium">
                          {account.email_address}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Last sync:{' '}
                          {account.last_sync_at
                            ? new Date(account.last_sync_at).toLocaleString()
                            : 'Never'}
                        </div>
                      </div>
                    </div>
                    <Badge
                      variant={account.is_active ? 'default' : 'secondary'}
                    >
                      {account.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search emails..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={activeTab} onValueChange={setActiveTab}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unreviewed">Unreviewed</SelectItem>
                <SelectItem value="spending">Spending</SelectItem>
                <SelectItem value="billing">Billing</SelectItem>
                <SelectItem value="leads">Leads</SelectItem>
                <SelectItem value="other">Other</SelectItem>
                <SelectItem value="ignored">Ignored</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Email List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getCategoryIcon(activeTab)}
            {activeTab === 'unreviewed'
              ? 'Unreviewed Emails'
              : activeTab === 'spending'
                ? 'Spending Emails'
                : activeTab === 'billing'
                  ? 'Billing Emails'
                  : activeTab === 'leads'
                    ? 'Lead Emails'
                    : activeTab === 'other'
                      ? 'Other Emails'
                      : 'Ignored Emails'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center space-x-4 p-4 border rounded-lg"
                >
                  <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2"></div>
                  </div>
                  <div className="h-8 bg-gray-200 rounded animate-pulse w-20"></div>
                </div>
              ))}
            </div>
          ) : filteredEmails.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No emails found</h3>
              <p className="text-muted-foreground">
                {activeTab === 'unreviewed'
                  ? 'All emails have been reviewed.'
                  : `No ${activeTab} emails found.`}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEmails.map((email) => (
                <div
                  key={email.id}
                  className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedEmail(email)}
                >
                  <div
                    className={`w-3 h-3 rounded-full ${getPriorityColor(email.priority)}`}
                  ></div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium truncate">
                        {email.subject || 'No subject'}
                      </h4>
                      <Badge className={getCategoryColor(email.category)}>
                        {email.category}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      From: {email.sender || 'Unknown'} •
                      {email.received_at
                        ? new Date(email.received_at).toLocaleDateString()
                        : 'Unknown date'}
                    </div>
                    {email.body_text && (
                      <div className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {email.body_text.substring(0, 150)}...
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEmail(email);
                      }}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>

                    {email.category === 'unreviewed' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCategorizeEmail(email.id, false);
                          }}
                          disabled={processing}
                        >
                          {processing ? 'Processing...' : 'Categorize'}
                        </Button>
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCategorizeEmail(email.id, true);
                          }}
                          disabled={processing}
                        >
                          <Brain className="w-4 h-4 mr-1" />
                          {processing
                            ? 'Smart Processing...'
                            : 'Smart Categorize'}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email Detail Dialog */}
      <Dialog
        open={!!selectedEmail}
        onOpenChange={() => setSelectedEmail(null)}
      >
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedEmail && getCategoryIcon(selectedEmail.category)}
              {selectedEmail?.subject || 'No subject'}
            </DialogTitle>
            <DialogDescription>
              From: {selectedEmail?.sender || 'Unknown'} •
              {selectedEmail?.received_at
                ? new Date(selectedEmail.received_at).toLocaleString()
                : 'Unknown date'}
            </DialogDescription>
          </DialogHeader>

          {selectedEmail && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className={getCategoryColor(selectedEmail.category)}>
                  {selectedEmail.category}
                </Badge>
                <Badge variant="outline">
                  Priority: {selectedEmail.priority}
                </Badge>
              </div>

              {selectedEmail.extracted_data &&
                Object.keys(selectedEmail.extracted_data).length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Extracted Data</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="text-sm bg-gray-50 p-4 rounded overflow-x-auto">
                        {JSON.stringify(selectedEmail.extracted_data, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                )}

              <div className="border rounded-lg p-4 bg-gray-50">
                <h4 className="font-medium mb-2">Email Content</h4>
                <div className="text-sm whitespace-pre-wrap max-h-96 overflow-y-auto">
                  {selectedEmail.body_text || 'No content available'}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                {selectedEmail.category === 'unreviewed' && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() =>
                        handleCategorizeEmail(selectedEmail.id, false)
                      }
                      disabled={processing}
                    >
                      {processing ? 'Processing...' : 'Categorize'}
                    </Button>
                    <Button
                      onClick={() =>
                        handleCategorizeEmail(selectedEmail.id, true)
                      }
                      disabled={processing}
                    >
                      <Brain className="w-4 h-4 mr-2" />
                      {processing ? 'AI Processing...' : 'AI Categorize'}
                    </Button>
                  </>
                )}
                <Button
                  onClick={() => handleCategorizeEmail(selectedEmail.id, true)}
                  disabled={processing}
                >
                  <Brain className="w-4 h-4 mr-2" />
                  {processing ? 'Smart Processing...' : 'Smart Categorize'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
