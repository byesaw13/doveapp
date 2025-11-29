# Agent Guidelines for DoveApp

## Build & Development Commands
- `npm run dev` - Start development server on localhost:3000
- `npm run build` - Production build with type checking
- `npm run lint` - Run ESLint on all files
- `npm run lint:fix` - Auto-fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run type-check` - TypeScript type checking without build

## Code Style
- **Imports**: Use `@/` alias for absolute imports (e.g., `@/lib/supabase`)
- **Formatting**: Prettier config with single quotes, 2 spaces, 80 char width
- **Types**: Always use TypeScript types; define interfaces in `types/` directory
- **Naming**: camelCase for variables/functions, PascalCase for components/types
- **Error Handling**: Always handle Supabase errors with explicit error checking
- **File Structure**: App Router in `app/`, utilities in `lib/`, types in `types/`

## Environment Setup
- Copy `.env.local.example` to `.env.local` and add Supabase credentials
- Supabase client is configured in `lib/supabase.ts`
- Local backup utilities available in `lib/backup.ts`
