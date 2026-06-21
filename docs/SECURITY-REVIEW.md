# Security Review

**Date**: 2026-06-22
**Status**: reviewed

## Scope

Reviewed the current static GitHub Pages climbing log implementation, with emphasis on the browser editor, GitHub API publishing, external video links, static data validation, dependency risk, and accidental secret exposure.

## Findings

### Resolved: GitHub token persisted in localStorage

The editor previously saved the GitHub token in `localStorage`, which made the token persist across browser restarts and increased exposure if the browser profile, extension environment, or future page script were compromised.

The token is now kept only in React state. It is cleared on refresh and is not written to persistent browser storage.

### Resolved: External video links accepted any scheme

Video links could previously render directly from the data file. A malformed value such as a non-http scheme could become a clickable link.

The data validator now requires `videoUrl` to be empty or start with `http://` or `https://`, and the `VideoLink` component verifies the URL before rendering an anchor.

### Resolved: Publish path lacked schema validation

The editor now validates the merged data with the same Zod schema before writing to GitHub. Invalid local edits fail before publishing.

## Remaining Risks

- The static editor still sends a user-provided GitHub token from the browser to the GitHub API. This is inherent to a no-server static editor. Use a fine-grained token limited to this repository and `Contents: Read and write`.
- The site has no private backend. Anything committed to `src/data/climbing-log.json` and deployed to GitHub Pages should be treated as public.
- External video availability depends on the external platform.
- `npm audit --audit-level=moderate` passes, but npm still reports one low-severity advisory in Vite's nested `esbuild` dependency affecting the development server on Windows. `npm audit fix` did not resolve it in this environment because install-script approval is required.

## Checks

- No `dangerouslySetInnerHTML` usage found.
- No hardcoded API keys, tokens, passwords, or `.env` files found in source.
- External links open with `rel="noopener noreferrer"`.
- Video files are ignored by `.gitignore`.
- GitHub Pages workflow uses OIDC with minimal Pages deployment permissions.
- `npm run validate:data`, `npm run test`, `npm run lint`, and `npm run build` pass after the review changes.
