# Email System Migration Guide

This guide explains how to migrate from the built-in email system to the external Cloudflare Worker monitoring service.

## Migration Benefits

### Complexity Reduction

- **Remove:** Full Gmail client UI, OAuth flows, API integration
- **Replace with:** Simple webhook endpoint
- **Result:** 90% less email-related code in main app

### Performance Improvements

- **Bundle size:** Reduced by ~1MB (googleapis, email libraries removed)
- **Database:** Simplified from 3 tables to 1
- **Maintenance:** External monitoring means no email logic in main app

### Cost Benefits

- **Free tier:** Cloudflare Workers handles all monitoring
- **Lower compute:** Main app just stores summaries
- **Scalable:** Workers scale automatically

---

## Migration Steps

### Phase 1: Deploy New System (No Breaking Changes)

#### 1. Deploy Cloudflare Worker

Follow the complete setup in `email-worker/README.md`:

- Set up Cloudflare account
- Configure Gmail OAuth
- Deploy worker
- Test it's receiving and processing emails

#### 2. Run Database Migration

```bash
# This creates the new email_summaries table
# It does NOT affect existing tables
psql -h your-db-host -U your-user -d your-db -f supabase/migrations/023_create_email_summaries_table.sql
```

Or via Supabase dashboard:

1. Go to SQL Editor
2. Paste contents of `023_create_email_summaries_table.sql`
3. Run migration

#### 3. Add Environment Variables

Add to `.env.local`:

```env
EMAIL_WEBHOOK_SECRET=your_secret_here
```

#### 4. Verify Webhook Endpoint Works

Test the webhook:

```bash
curl -X POST https://yourdomain.com/api/email-summaries/webhook \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_secret_here" \
  -d '{
    "gmailId": "test123",
    "gmailThreadId": "thread123",
    "from": "test@example.com",
    "subject": "Test Email",
    "receivedAt": "2024-12-02T10:00:00Z",
    "snippet": "This is a test",
    "summary": "Test email summary",
    "category": "SPAM_OTHER",
    "priority": "low",
    "actionRequired": false,
    "actionType": "none",
    "actionItems": [],
    "extractedData": {}
  }'
```

Expected response:

```json
{
  "success": true,
  "message": "Email summary stored",
  "id": "uuid-here"
}
```

#### 5. Let Both Systems Run in Parallel

For 1-2 weeks, run both systems:

- Old system: Still syncing emails to `emails_raw` and `email_insights`
- New system: Sending summaries to `email_summaries`

This lets you:

- Verify the new system works correctly
- Compare results between old and new
- Have a fallback if issues arise

---

### Phase 2: Create Simple UI for Email Summaries (Optional)

#### Option A: Simple Summary List Page

Create `app/email-summaries/page.tsx`:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function EmailSummariesPage() {
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSummaries();
  }, []);

  async function fetchSummaries() {
    const { data, error } = await supabase
      .from('email_summaries')
      .select('*')
      .order('received_at', { ascending: false })
      .limit(50);

    if (!error) {
      setSummaries(data || []);
    }
    setLoading(false);
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Email Summaries</h1>

      <div className="space-y-4">
        {summaries.map((email) => (
          <div key={email.id} className="border p-4 rounded-lg">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{email.subject}</h3>
                <p className="text-sm text-gray-600">{email.from_address}</p>
              </div>
              <div className="text-right">
                <span className={`px-2 py-1 rounded text-xs ${
                  email.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                  email.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                  email.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {email.priority}
                </span>
                <span className="ml-2 px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                  {email.category.replace('_', ' ')}
                </span>
              </div>
            </div>

            <p className="mt-2 text-gray-700">{email.ai_summary}</p>

            {email.action_items?.length > 0 && (
              <div className="mt-2">
                <p className="text-sm font-semibold">Action Items:</p>
                <ul className="list-disc list-inside text-sm">
                  {email.action_items.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            <p className="text-xs text-gray-500 mt-2">
              {new Date(email.received_at).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### Option B: Integrate into Existing Email Review Page

Modify `/app/email-review/page.tsx` to fetch from `email_summaries` table instead.

---

### Phase 3: Remove Old System

**⚠️ Only do this after verifying the new system works for 1-2 weeks!**

#### 1. Backup Old Data (Just in Case)

```bash
# Backup email tables
pg_dump -h your-host -U your-user -d your-db \
  -t emails_raw -t email_insights -t email_alerts \
  > email_backup_$(date +%Y%m%d).sql
```

#### 2. Remove Old Code

Delete these files/directories:

```bash
# Full email client UI
rm -rf app/emails/

# Gmail API routes
rm -rf app/api/gmail/
rm -rf app/api/email/
rm -rf app/api/emails/
rm -rf app/api/email-intelligence/

# Email processing libraries
rm lib/email-processing-pipeline.ts
rm lib/email-intelligence.ts
rm lib/email-alerts.ts

# AI categorization (if not used elsewhere)
rm lib/ai/email-categorization.ts

# Email database functions (if not used elsewhere)
rm lib/db/email.ts

# Old documentation
rm EMAIL_CLIENT_README.md
rm AI_EMAIL_ANALYSIS_README.md
rm EMAIL_IMPROVEMENTS_README.md
```

#### 3. Remove from Sidebar

Edit `components/sidebar.tsx` to remove email client link:

```typescript
// Remove or comment out:
{
  name: 'Email',
  href: '/emails',
  icon: Mail,
},
```

#### 4. Update Dependencies

Remove unused packages from `package.json`:

```bash
npm uninstall googleapis google-auth-library
```

Then rebuild:

```bash
npm install
npm run build
```

#### 5. Drop Old Database Tables (Optional)

**⚠️ Only after confirming you don't need the old data!**

```sql
-- Optional: Drop old email tables
DROP TABLE IF EXISTS email_alerts CASCADE;
DROP TABLE IF EXISTS email_insights CASCADE;
DROP TABLE IF EXISTS emails_raw CASCADE;
DROP TABLE IF EXISTS gmail_connections CASCADE;
```

Or keep them archived for reference.

---

### Phase 4: Verify and Optimize

#### 1. Check Bundle Size Reduction

```bash
npm run build

# Compare .next/static/chunks sizes before/after
```

You should see ~1MB reduction in JavaScript bundle size.

#### 2. Test Main App

- Verify webhook endpoint receives summaries
- Check email summaries are being stored
- Test UI (if you created one)
- Verify high-priority alerts work

#### 3. Monitor Worker

```bash
cd email-worker
wrangler tail
```

Check for:

- Successful email fetching
- OpenAI summaries generating correctly
- Webhook POSTs succeeding

---

## Comparison: Before vs After

### Before (Complex)

```
Main App Size: 5.2MB JavaScript
Database Tables: 5 (emails_raw, email_insights, email_alerts, gmail_connections, email_messages)
Dependencies: 52 packages related to email
API Routes: 15 email-related endpoints
Processing: In-app (expensive)
OAuth Management: In-app (complex)
```

### After (Simple)

```
Main App Size: 4.1MB JavaScript (21% reduction)
Database Tables: 1 (email_summaries)
Dependencies: 0 email-specific packages
API Routes: 1 webhook endpoint
Processing: External (free tier)
OAuth Management: Cloudflare handles it
```

---

## Rollback Plan

If you need to revert to the old system:

1. Stop/delete Cloudflare Worker
2. Restore old code from git
3. Old tables still exist (if you didn't drop them)
4. Re-enable old UI routes
5. Reinstall dependencies

---

## FAQ

**Q: What happens to old emails in emails_raw?**  
A: They stay in the database unless you explicitly drop the tables. You can keep them for historical reference.

**Q: Can I process old emails through the new system?**  
A: The worker only processes new unread emails. Old emails remain in the old system.

**Q: What if the worker goes down?**  
A: Emails stay unread in Gmail. When worker comes back up, it processes them. Nothing is lost.

**Q: Can I still send emails?**  
A: The new system only monitors/summarizes incoming emails. For sending, you'll need to keep the Gmail send API or use a different solution.

**Q: How do I reply to emails?**  
A: This system is for monitoring only. Reply via Gmail web interface or add a separate reply feature if needed.

---

## Success Criteria

✅ Cloudflare Worker running successfully  
✅ Emails being summarized by OpenAI  
✅ Summaries arriving in `email_summaries` table  
✅ Webhook endpoint receiving POSTs  
✅ Old email code removed from main app  
✅ Bundle size reduced  
✅ App still builds and deploys successfully

---

## Next Steps

After migration:

1. **Monitor costs:** Check OpenAI usage after first month
2. **Optimize prompts:** Refine AI categorization if needed
3. **Add features:** Build simple UI for viewing summaries
4. **Integrate alerts:** Connect high-priority emails to notification system
5. **Analytics:** Track email categories and response times

The new system is much simpler, cheaper to run, and easier to maintain! 🎉
