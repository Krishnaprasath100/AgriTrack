# Gemini Project Guidance

This repository is an AgriTrack farm-ledger application.

When making changes:

1. Keep the existing visual design intact unless the request explicitly asks for a redesign.
2. Place page-specific code in the relevant `frontend/src/app/<route>/page.tsx` file.
3. Keep reusable client data operations in `frontend/src/lib/services/dataService.ts`.
4. Verify frontend changes with `npm.cmd run build --prefix frontend`.
5. Avoid deleting user data, credentials, or project files unless the request clearly authorizes it.
6. For custom crop or expense-type choices, persist them per signed-in user so they reappear in the relevant dropdown.
