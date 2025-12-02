/**
 * Gmail API Client for Cloudflare Workers
 */

import { Env } from './index';

export interface GmailEmail {
  id: string;
  threadId: string;
  from: string;
  subject: string;
  snippet: string;
  bodyText: string;
  bodyHtml: string;
  receivedAt: string;
  labels: string[];
}

export class GmailClient {
  private env: Env;
  private accessToken: string | null = null;

  constructor(env: Env) {
    this.env = env;
  }

  /**
   * Get access token using refresh token
   */
  private async getAccessToken(): Promise<string> {
    if (this.accessToken) {
      return this.accessToken;
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.env.GMAIL_CLIENT_ID,
        client_secret: this.env.GMAIL_CLIENT_SECRET,
        refresh_token: this.env.GMAIL_REFRESH_TOKEN,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get Gmail access token: ${error}`);
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    return this.accessToken;
  }

  /**
   * Get unread emails from inbox
   */
  async getUnreadEmails(maxResults: number = 20): Promise<GmailEmail[]> {
    const token = await this.getAccessToken();

    // List messages
    const listResponse = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}&q=is:unread -is:chat`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!listResponse.ok) {
      throw new Error('Failed to fetch Gmail messages');
    }

    const listData = await listResponse.json();
    const messages = listData.messages || [];

    // Fetch full message details for each
    const emails: GmailEmail[] = [];

    for (const message of messages) {
      try {
        const email = await this.getEmailDetails(message.id, token);
        emails.push(email);
      } catch (error) {
        console.error(`Failed to fetch email ${message.id}:`, error);
        // Continue with other emails
      }
    }

    return emails;
  }

  /**
   * Get detailed email information
   */
  private async getEmailDetails(
    messageId: string,
    token: string
  ): Promise<GmailEmail> {
    const response = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch email details for ${messageId}`);
    }

    const data = await response.json();

    // Extract headers
    const headers = data.payload.headers;
    const getHeader = (name: string): string => {
      const header = headers.find(
        (h: any) => h.name.toLowerCase() === name.toLowerCase()
      );
      return header ? header.value : '';
    };

    const subject = getHeader('Subject');
    const from = getHeader('From');
    const date = getHeader('Date');

    // Extract body
    let bodyText = '';
    let bodyHtml = '';

    const extractBody = (part: any) => {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        bodyText = this.decodeBase64(part.body.data);
      } else if (part.mimeType === 'text/html' && part.body?.data) {
        bodyHtml = this.decodeBase64(part.body.data);
      } else if (part.parts) {
        part.parts.forEach(extractBody);
      }
    };

    if (data.payload.parts) {
      data.payload.parts.forEach(extractBody);
    } else if (data.payload.body?.data) {
      bodyText = this.decodeBase64(data.payload.body.data);
    }

    return {
      id: messageId,
      threadId: data.threadId,
      from,
      subject,
      snippet: data.snippet || '',
      bodyText,
      bodyHtml,
      receivedAt: date,
      labels: data.labelIds || [],
    };
  }

  /**
   * Decode base64url encoded string
   */
  private decodeBase64(str: string): string {
    try {
      // Replace URL-safe characters
      const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
      // Decode
      return atob(base64);
    } catch (error) {
      console.error('Failed to decode base64:', error);
      return '';
    }
  }

  /**
   * Mark email as read (optional - use if you want to mark processed emails)
   */
  async markAsRead(messageId: string): Promise<void> {
    const token = await this.getAccessToken();

    await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          removeLabelIds: ['UNREAD'],
        }),
      }
    );
  }
}
