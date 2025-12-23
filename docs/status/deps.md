# Dependency Status

## Current Dependencies

All major dependencies appear to be actively used and properly declared:

### Required Dependencies

- `@sentry/nextjs` - Used in `lib/sentry.*.config.js` for error tracking
- `@radix-ui/react-tooltip` - Imported in UI components for tooltips
- `@jest/globals` - Used in test files for Jest global functions

### Notes

- No unused dependencies were identified for safe removal
- All dependencies are compatible with Next.js 16+ and React 19+
- Versions are kept reasonably current but conservative to avoid breaking changes

## Future Considerations

- Consider updating to latest compatible versions during major version bumps
- Monitor for deprecated packages and plan migrations
- Add automated dependency checking to CI pipeline
