# High Priority Fixes - Implementation Plan

## P0 (Critical)
### #44 - Extract components from 650-line index.tsx
- [x] Create app/(tabs)/home/components/ directory
- [ ] Extract GlassCard component
- [ ] Extract CircularProgress component  
- [ ] Extract AttendanceCard component
- [ ] Extract MidmarksCard component
- [ ] Extract ErrorCard component
- [ ] Update index.tsx imports
- [ ] Test functionality

## P1 (High)
### #45 - Fix API service
- [ ] Remove all console.log statements
- [ ] Add retry logic with exponential backoff
- [ ] Move timeout into fetchApi

### #46 - TypeScript + ESLint
- [ ] Create .eslintrc.js
- [ ] Create .prettierrc
- [ ] Enable strict mode in tsconfig.json
- [ ] Fix any type errors
- [ ] Add Husky pre-commit

### #47 - Zod validation
- [ ] Install Zod
- [ ] Create validation schemas
- [ ] Add input validation
- [ ] Add response validation

### #48 - Error boundaries
- [ ] Create ErrorBoundary component
- [ ] Wrap root layouts
- [ ] Add error UI
- [ ] Test error handling

## Estimated Total Time: 8-10 hours
Let's start!
