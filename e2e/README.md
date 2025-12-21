# E2E Test Suite

## Running Tests

### Headless (Default)

```bash
npm run test:e2e
```

### UI Mode (requires X server or Xvfb)

```bash
npm run test:e2e:ui
```

Note: UI mode automatically uses `xvfb-run` for headless environments without X server.

### Headed Mode (requires X server or Xvfb)

```bash
npm run test:e2e:headed
```

### UI Mode (requires X server or Xvfb)

```bash
# On Linux without X server, use xvfb:
xvfb-run -a npm run test:e2e:ui

# On systems with X server:
npm run test:e2e:ui
```

### Link Audit Only

```bash
npm run test:e2e:audit
```

## Output

Test results are written to:

- `playwright-report/` - HTML report for all tests
- `e2e/output/latest/` - Latest QA summary (for link audit)
- `e2e/output/<timestamp>/` - Timestamped QA summaries

## Notes

- UI mode (`--ui`) requires an X server or xvfb-run on headless Linux systems
- Headless mode works in all environments including CI
- Link audit generates comprehensive QA summaries in JSON and Markdown formats
