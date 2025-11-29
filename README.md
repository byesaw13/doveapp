# DoveApp - Field Service Management Tool

A Next.js + Supabase application for managing handyman and painting services, inspired by Jobber. Built for solo contractors who need client management, job tracking, and invoicing with local data backup.

## Features

### Phase 1A: Client Management (✅ Complete)
- Full CRUD operations for clients
- Search and filter by name, email, or company
- Import customers from Square API
- Local data backup and restore
- Mobile-responsive UI with shadcn/ui

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.local.example` to `.env.local` and fill in your credentials:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Square API Configuration
SQUARE_ENVIRONMENT=sandbox  # or 'production'
SQUARE_ACCESS_TOKEN=your-square-access-token
```

### 3. Set Up Supabase Database

1. Create a free account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to SQL Editor and run the migration:

```bash
# Copy the contents of supabase/migrations/001_create_clients_table.sql
# and paste into Supabase SQL Editor, then click "Run"
```

### 4. Set Up Square API (Optional)

1. Create a Square Developer account at [developer.squareup.com](https://developer.squareup.com)
2. Create a new application
3. Get your Access Token (use Sandbox for testing)
4. Add the token to `.env.local`

### 5. Run Development Server
```bash
npm run dev
```

Visit [http://localhost:3000/clients](http://localhost:3000/clients) to see the app!

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Auto-fix linting issues
- `npm run format` - Format code with Prettier
- `npm run type-check` - TypeScript type checking
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode

## Testing

### Manual Testing Checklist for Phase 1A:
- [ ] Create a new client
- [ ] Edit an existing client
- [ ] Delete a client (with confirmation)
- [ ] Search for clients
- [ ] Import customers from Square (if configured)
- [ ] Export backup (coming soon - UI needed)
- [ ] Import from backup (coming soon - UI needed)

### Automated Tests:
```bash
npm test
```

## Project Structure

```
doveapp/
├── app/
│   ├── clients/              # Client management pages
│   │   ├── components/       # Client-specific components
│   │   └── page.tsx          # Main clients list page
│   └── api/
│       └── square/           # Square API routes
├── lib/
│   ├── db/                   # Database operations
│   ├── square/               # Square API integration
│   ├── validations/          # Zod schemas
│   ├── backup.ts             # Backup/restore utilities
│   └── supabase.ts           # Supabase client
├── types/                    # TypeScript types
├── components/ui/            # shadcn/ui components
└── supabase/migrations/      # Database migrations
```

## Next Steps (Future Phases)

### Phase 1B: Jobs & Invoices
- Job creation and management
- Convert quotes to jobs
- Import Square invoices as historical jobs
- Job status workflow

### Phase 1C: Payment History
- Payment tracking
- Link payments to invoices
- Import Square payment history

### Phase 2: Properties
- Multiple service locations per client
- Property-specific notes

### Phase 3+: Advanced Features
- Calendar/scheduling view
- Before/after photos
- Materials/inventory tracking
- PDF invoice generation

## Troubleshooting

### "Failed to load clients" Error
- Check that Supabase URL and keys are correct in `.env.local`
- Verify the `clients` table exists in your Supabase database
- Check browser console for specific error messages

### Square Import Not Working
- Verify `SQUARE_ACCESS_TOKEN` is set in `.env.local`
- Check that `SQUARE_ENVIRONMENT` is set to `sandbox` or `production`
- Ensure you have customers in your Square account

### Build Errors
- Run `npm run type-check` to see TypeScript errors
- Run `npm run lint` to check for linting issues
- Clear `.next` folder and rebuild: `rm -rf .next && npm run build`

## License

Private project - All rights reserved
