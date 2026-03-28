# Academic Torrents

## Current State
Admin role claimed via _initializeAccessControlWithSecret with URL token. Insecure.

## Requested Changes (Diff)

### Add
- claimFirstAdmin() backend: any authenticated caller, only succeeds if no admin yet.
- Frontend: show principal + CLAIM ADMIN button when logged in but not admin.

### Modify
- access-control.mo: add claimFirstAdmin helper.
- main.mo: replace _initializeAccessControlWithSecret with claimFirstAdmin.
- AdminPage.tsx: add claim panel.
- useQueries.ts: add useClaimFirstAdmin mutation.

### Remove
- _initializeAccessControlWithSecret from backend.

## Implementation Plan
1. Update access-control.mo.
2. Update main.mo.
3. Add useClaimFirstAdmin hook.
4. Update AdminPage.
