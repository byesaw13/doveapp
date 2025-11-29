# Properties Migration Guide

## 🎯 **Migrate Existing Client Addresses to Properties**

Your existing clients already have address data! This guide shows how to convert that data into properties so you don't lose any information.

## 📋 **What This Does**

- Takes address data from existing clients
- Creates "Primary Residence" properties for each client with address info
- Preserves all existing address details
- Keeps existing jobs linked to clients (doesn't break anything)

## 🚀 **Option 1: SQL Migration (Recommended)**

### Step 1: Run the Properties Table Migration

First, create the properties table:

1. Go to your Supabase SQL Editor
2. Copy the contents of: `supabase/migrations/005_create_properties_table.sql`
3. Paste and click "Run"

### Step 2: Migrate Client Addresses

Now migrate the existing address data:

1. In Supabase SQL Editor, copy the contents of: `supabase/migrations/006_migrate_client_addresses_to_properties.sql`
2. Paste and click "Run"

**That's it!** Your client addresses are now properties.

## 🚀 **Option 2: Node.js Script (Alternative)**

If you prefer to run it programmatically:

### Prerequisites

```bash
# Install dependencies (if not already done)
npm install

# Set environment variables
cp .env.local.example .env.local
# Edit .env.local with your Supabase credentials
```

### Run the Migration

```bash
npm run migrate:addresses
```

## 📊 **What Gets Created**

For each client with address data, you'll get:

- **Property Name**: "Primary Residence"
- **Address**: Copied from client address fields
- **Type**: "Residential"
- **Notes**: "Migrated from client address data"

## 🔍 **Verification**

After migration, check:

1. Visit `/properties` - You should see properties for clients with addresses
2. Visit `/clients` - Click "View Properties" on clients with addresses
3. Dashboard should show updated property counts

## 📈 **Example Results**

**Before Migration:**

- Client: "John Smith" has address: "123 Main St, Boston, MA 02101"

**After Migration:**

- Property: "Primary Residence" for John Smith
- Address: "123 Main St, Boston, MA 02101"
- Type: Residential

## ⚠️ **Important Notes**

- **Existing jobs remain unchanged** - Still linked to clients
- **No data loss** - Client addresses are preserved
- **Future jobs can link to properties** - New flexibility for job creation
- **Safe to run multiple times** - Won't create duplicates (but check for conflicts)

## 🎯 **Next Steps**

After migration:

1. **Review properties** - Edit names/types as needed
2. **Add more properties** - Clients can have multiple locations
3. **Create jobs linked to properties** - More specific job tracking

## 🆘 **Troubleshooting**

**Migration didn't work?**

- Check that properties table exists first
- Verify client has address_line1 and city filled
- Check Supabase logs for errors

**Want to customize?**

- Edit the migration SQL to change property names
- Modify the script for different property types
- Add additional logic for your specific needs

---

**Ready to migrate?** Run the SQL migration and preserve your valuable address data! 🏠✨
