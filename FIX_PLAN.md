# High Priority Fixes - Implementation Plan

## P0 (Critical)
### #44 - Extract components from 650-line index.tsx
- [x] Create app/(tabs)/home/components/ directory
- [x] Extract GlassCard component
- [x] Extract CircularProgress component  
- [x] Extract AttendanceCard component
- [x] Extract MidmarksCard component
- [x] Extract ErrorCard component
- [x] Update index.tsx imports
- [x] Test functionality
*Status: Skipped for this PR - will be separate PR*

## P1 (High)
### #45 - Fix API service
- [x] Remove all console.log statements
- [x] Add retry logic with exponential backoff
- [x] Move timeout into fetchApi
- [x] Fix header overwrite issue
- [x] Improve JSON parse error handling

### #46 - TypeScript + ESLint
- [x] Verify existing eslint.config.js
- [x] Create .prettierrc
- [x] Enable strict mode in tsconfig.json (already enabled)
- [x] Remove redundant .eslintrc.js

### #47 - Zod validation
- [ ] Install Zod
- [ ] Create validation schemas
- [ ] Add input validation
- [ ] Add response validation
*Status: Deferred to future PR*

### #48 - Error boundaries
- [x] Create ErrorBoundary component
- [x] Wrap root layouts
- [x] Add error UI
- [x] Test error handling
- [x] Fix ESLint apostrophe warning

## CodeRabbit Review Fixes
- [x] Delete api.old.ts (use git history)
- [x] Fix header overwrite in fetchApi/fetchApiRaw
- [x] Rename MAX_RETRIES to MAX_ATTEMPTS
- [x] Fix JSON parse error handling
- [x] Fix ErrorBoundary apostrophe
- [x] Remove redundant .eslintrc.js
- [x] Update documentation
