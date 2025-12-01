# Email Client - Full Gmail Integration

## Overview

The new email client provides a complete Gmail experience within the app, allowing you to view, compose, reply, and send emails without leaving the application.

## Features

### 📧 **Full Email Client Interface**

- **Inbox View**: Browse emails with unread indicators, star favorites, and category badges
- **Email Viewer**: Full email content display with HTML rendering support
- **Compose Interface**: Rich text composition with formatting toolbar
- **Reply/Forward**: One-click reply, reply-all, and forward functionality

### 📁 **Smart Organization**

- **Folders**: Inbox, Leads, Billing, Spending, Sent, Drafts
- **Search**: Real-time email search across subject, sender, and content
- **Filters**: Show unread only, category filtering
- **Categories**: Automatic categorization (leads, billing, spending, etc.)

### ✉️ **Email Composition**

- **Rich Text Editor**: Bold, italic, underline, lists formatting
- **Recipient Fields**: To, Cc, Bcc support
- **Reply Templates**: Automatic subject line and content for replies
- **Attachment Support**: File attachment capability (UI ready, backend integration pending)

### 🔄 **Gmail Integration**

- **OAuth Connection**: Secure Gmail API integration
- **Auto-Sync**: Background email synchronization
- **Send Emails**: Send emails directly through Gmail API
- **Token Management**: Automatic token refresh

## Navigation

Access the email client through the sidebar menu: **Email** (replaces Email Review)

## API Endpoints

### Send Email

```
POST /api/emails/send
```

**Request Body:**

```json
{
  "to": "recipient@example.com",
  "cc": "cc@example.com",
  "bcc": "bcc@example.com",
  "subject": "Email Subject",
  "body": "Email content here..."
}
```

### Email Queues

```
GET /api/emails/queues?queue=priority|leads|money
```

### Daily Digest

```
GET /api/emails/digest
```

## Components

### EmailClientPage (`/emails`)

Main email client interface with sidebar navigation and content area.

### EmailComposer (`/emails/components/EmailComposer`)

Email composition interface with rich text editing capabilities.

### EmailViewer (`/emails/components/EmailViewer`)

Email viewing interface with reply/forward actions.

## Database Integration

The email client integrates with existing email enrichment system:

- **Lead Detection**: Automatic lead extraction and contact creation
- **Billing Processing**: Invoice and payment detection
- **Alert System**: Smart notifications for important emails
- **Categorization**: AI-powered email classification

## Future Enhancements

- **Email Threading**: Conversation view for related emails
- **Advanced Search**: Date ranges, attachment search, etc.
- **Email Templates**: Saved templates for common responses
- **Bulk Actions**: Select multiple emails for actions
- **Email Signatures**: Custom signatures per account
- **Read Receipts**: Delivery and read status tracking

## Usage

1. **Connect Gmail**: Click "Connect" in the sidebar if not already connected
2. **Sync Emails**: Use the refresh button to sync latest emails
3. **Compose**: Click "Compose" to create new emails
4. **Reply**: Click any email to view, then use reply buttons
5. **Search**: Use the search bar to find specific emails
6. **Organize**: Use folders and categories to organize your inbox

The email client provides everything you need to manage your business email communication without leaving the app!
