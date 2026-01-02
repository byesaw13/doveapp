# Lint Playbook

This doc describes the preferred fixes for recurring rules. Apply the smallest safe change and keep behavior stable.

## @typescript-eslint/no-explicit-any

- Prefer specific DTOs or minimal interfaces.
- Use `unknown` and narrow at usage when shape is unknown.
- Use `Json`, `Record<string, Json>`, or an index signature for flexible payloads.
- Avoid broad `any` in public types.

## @typescript-eslint/no-unused-vars

- Remove unused imports/vars.
- If a parameter is required, prefix with `_`.
- Drop unused destructured properties.

## react-hooks/exhaustive-deps

- Do not blindly add deps.
- Prefer `useCallback`/`useMemo` for stable functions.
- Split effects or move logic inside to avoid behavior changes.
- If suppression is necessary, keep it scoped and explain why.

## react/no-unescaped-entities

- Replace apostrophes/quotes with HTML entities (e.g., `&apos;`, `&quot;`).

## @next/next/no-img-element

- Replace `<img>` with `next/image`.
- Preserve layout by specifying `width`/`height` or `fill` and proper `sizes`.

## @typescript-eslint/ban-ts-comment

- Replace `@ts-ignore` with `@ts-expect-error` and explain the reason.
- Remove unnecessary `@ts-nocheck` by tightening types.

## @typescript-eslint/no-unused-expressions

- Replace bare expressions with explicit statements (e.g., `if` or direct call).
