# AI Email Analysis System

## Overview

The AI Email Analysis system uses OpenAI's GPT models to intelligently analyze every incoming email, providing comprehensive business intelligence, automated categorization, and actionable insights.

## Features

### 🤖 **Comprehensive AI Analysis**

Every email is processed by OpenAI with:

- **Smart Categorization**: Automatically classifies as spending, billing, leads, or other
- **Priority Assessment**: Determines urgency (low, medium, high, urgent)
- **Content Summary**: 1-2 sentence overview of the email's main point
- **Action Items**: Specific tasks you should take
- **Sentiment Analysis**: Positive, neutral, or negative tone
- **Response Requirements**: Whether the email needs a reply
- **Suggested Responses**: AI-generated reply suggestions
- **Key Topics**: Main subjects discussed
- **Response Deadlines**: When to respond if urgent
- **Follow-up Dates**: When to follow up

### 📊 **AI Insights Dashboard**

Located in the email client under "AI Insights":

- **Analysis Statistics**: How many emails have been AI-analyzed
- **Priority Breakdown**: Urgent vs high priority emails
- **Lead Detection**: Potential customer inquiries found
- **Response Tracking**: Emails requiring replies
- **High Priority Queue**: Most urgent emails needing attention
- **Action Items Summary**: AI-recommended tasks across all emails
- **Sentiment Overview**: Emotional tone analysis

### 🎯 **Smart Email Display**

- **AI Indicators**: Purple dots show AI-analyzed emails
- **Priority Badges**: Visual priority indicators in email list
- **AI Summaries**: Show AI-generated summaries instead of raw text
- **Detailed Analysis**: Full AI breakdown in email viewer

## Technical Implementation

### AI Processing Pipeline

1. **Email Reception**: Gmail sync pulls new emails
2. **AI Analysis**: Each email sent to OpenAI for comprehensive analysis
3. **Data Extraction**: Business intelligence extracted and stored
4. **Alert Generation**: Smart notifications created based on AI insights
5. **UI Updates**: Email client displays AI insights prominently

### Data Storage

AI analysis results stored in `email_messages.extracted_data`:

```json
{
  "ai_summary": "Brief summary of email content",
  "ai_action_items": ["Call customer back", "Schedule estimate"],
  "ai_sentiment": "positive",
  "ai_confidence": 0.95,
  "ai_reasoning": "Detailed explanation of AI analysis",
  "suggested_response": "Suggested reply text",
  "key_topics": ["painting", "kitchen", "estimate"],
  "leads": {
    "contact_name": "John Smith",
    "service_type": "painting",
    "urgency": "high",
    "budget_range": "$3,000-5,000"
  }
}
```

### API Endpoints

#### Analyze Emails

```
POST /api/emails/analyze
```

**Request:**

```json
{
  "emailIds": ["email-id-1", "email-id-2"]
}
```

**Response:**

```json
{
  "success": true,
  "results": [{ "emailId": "email-id-1", "status": "analyzed" }],
  "errors": [],
  "total": 2,
  "successful": 2,
  "failed": 0
}
```

## Usage Guide

### Viewing AI Insights

1. **Navigate**: Go to Email → Click "AI Insights" button
2. **Dashboard**: View comprehensive AI analysis statistics
3. **Priority Queue**: See urgent emails requiring attention
4. **Action Items**: Review AI-recommended tasks

### Email List View

- **Purple Dots**: Indicate AI-analyzed emails
- **Priority Badges**: Show urgency levels
- **AI Summaries**: Display intelligent summaries instead of raw text

### Email Detail View

- **AI Analysis Panel**: Comprehensive breakdown with:
  - Confidence score
  - Sentiment indicator
  - Priority level
  - Action items checklist
  - Suggested response
  - Key topics tags
  - AI reasoning (expandable)

### Manual Re-Analysis

- **Insights Page**: "Analyze Unanalyzed Emails" button
- **Batch Processing**: Analyzes up to 10 emails at once
- **Progress Feedback**: Toast notifications show results

## Configuration

### Environment Setup

Add to `.env.local`:

```env
OPENAI_API_KEY=your-openai-api-key
```

### AI Model

Currently uses `gpt-4o-mini` for optimal balance of:

- **Speed**: Fast analysis for real-time processing
- **Accuracy**: High-quality business intelligence
- **Cost**: Cost-effective for email volume

## Benefits

✅ **Zero Manual Categorization** - AI handles all classification automatically
✅ **Instant Business Intelligence** - Understand email context immediately
✅ **Smart Prioritization** - Focus on what matters most
✅ **Actionable Insights** - Clear next steps for every email
✅ **Sentiment Awareness** - Understand customer emotional state
✅ **Automated Responses** - AI suggests appropriate replies
✅ **Comprehensive Analysis** - No detail overlooked

## Example AI Analysis

**Input Email:**

```
Subject: Kitchen Painting Estimate Request

Hi, I saw your ad online and I'm interested in getting my kitchen painted.
I have a standard size kitchen and my budget is around $3,000.
Can you come take a look and give me a quote?
Thanks, John Smith
```

**AI Output:**

```json
{
  "category": "leads",
  "confidence": 0.96,
  "priority": "high",
  "summary": "Potential customer requesting painting estimate for kitchen with $3,000 budget",
  "action_items": [
    "Call John Smith to schedule site visit",
    "Prepare painting estimate template",
    "Check calendar availability this week"
  ],
  "suggested_response": "Hi John, thanks for reaching out! I'd be happy to come take a look at your kitchen and provide a detailed estimate. Are you available this Thursday or Friday afternoon? Please let me know what works best for you.",
  "key_topics": ["painting", "kitchen", "estimate", "budget"],
  "sentiment": "positive",
  "requires_response": true,
  "response_deadline": "within 4 hours",
  "extractedData": {
    "leads": {
      "contact_name": "John Smith",
      "service_type": "painting",
      "urgency": "high",
      "budget_range": "$3,000",
      "preferred_contact_method": "phone"
    }
  }
}
```

## Future Enhancements

- **Conversation Threading**: AI analysis of email threads
- **Customer History**: AI considers past interactions
- **Automated Responses**: AI-generated replies with approval workflow
- **Predictive Analytics**: AI predicts customer likelihood to convert
- **Multi-language Support**: AI handles emails in different languages
- **Integration APIs**: Connect with CRM, calendar, and task management systems

The AI Email Analysis system transforms your inbox from a source of overwhelm into a source of actionable business intelligence! 🚀
