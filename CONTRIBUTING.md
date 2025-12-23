# Contributing to DoveApp

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js 18+ (we recommend using [nvm](https://github.com/nvm-sh/nvm))
- npm 8+ (comes with Node.js)
- Git
- A Supabase account (for database setup)

## Local Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd doveapp
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment setup**
   - Copy `.env.example` to `.env.local`
   - Fill in the required environment variables (see `.env.example` for details)
   - For E2E testing, also set up `.env.e2e` if running end-to-end tests

4. **Database setup**
   - Ensure you have a Supabase project set up
   - Run any pending migrations (see `supabase/migrations/`)

## Running the Application

### Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### Production Build

```bash
npm run build
npm start
```

## Running Checks

### Code Quality

```bash
# Format code
npm run format

# Lint code
npm run lint

# Type checking
npm run type-check

# Run all quality checks
npm run lint && npm run type-check
```

### Testing

```bash
# Unit tests
npm run test

# End-to-end tests
npm run test:e2e

# E2E with UI
npm run test:e2e:ui
```

### Build Verification

```bash
npm run build
```

## Branch and PR Guidelines

- **Branch naming**: Use `feature/`, `bugfix/`, `chore/`, or `docs/` prefixes
- **Commit messages**: Use conventional commits (`feat:`, `fix:`, `chore:`, `docs:`)
- **Small commits**: Keep commits focused and atomic
- **No secrets**: Never commit API keys, passwords, or sensitive data
- **Update docs**: Keep documentation current with code changes
- **Test locally**: Run checks before pushing
- **Clean PRs**: Ensure no generated files, unused imports, or console.logs in production code

## Development Scripts

See `package.json` for the full list of available scripts. Common ones:

- `npm run dev` - Start development server
- `npm run build` - Production build
- `npm run test` - Run tests
- `npm run lint` - Code linting
- `npm run format` - Code formatting

## Getting Help

- Check existing issues on GitHub
- Review the README.md for detailed setup
- See docs/ for additional documentation
- Reach out to the team for questions
