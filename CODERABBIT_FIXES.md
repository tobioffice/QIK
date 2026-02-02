# CodeRabbit Review - Issues to Fix

## Critical Issues

### 1. ⚠️ api.old.ts should be deleted
- Problem: Old file included in TypeScript compilation, duplicate exports
- Fix: Delete api.old.ts, rely on git history

### 2. ⚠️ Headers overwrite issue in api.ts
- Problem: `...options` spread after headers, overwrites Content-Type and Authorization
- Fix: Spread options first, then override with headers

### 3. ⚠️ MAX_RETRIES naming misleading
- Problem: Used as total attempts, not retry count
- Fix: Rename to MAX_ATTEMPTS or adjust logic

### 4. ⚠️ .eslintrc.js conflicts with existing eslint.config.js
- Problem: Repo already uses ESLint v9 flat config
- Fix: Merge into existing eslint.config.js

### 5. ⚠️ Prettier not in package.json
- Problem: Config exists but dependency missing
- Fix: Note in PR (don't modify package.json in this PR)

## Minor Issues

### 6. 🟡 ErrorBoundary apostrophe
- Problem: "We're" triggers react/no-unescaped-entities
- Fix: Escape as "We&apos;re" or use template literals

### 7. 🟡 JSON parse failure handling
- Problem: Returns empty object on parse failure
- Fix: Better error message

### 8. 📝 Documentation updates
- Fix checkboxes in FIX_PLAN.md
- Update PR_SUMMARY.md with correct retry count

Let's fix these!
