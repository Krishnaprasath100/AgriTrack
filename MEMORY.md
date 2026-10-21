# Project Memory

## AgriTrack

- Frontend: Next.js 15 application in `frontend/`.
- Backend: Express/TypeScript application in `backend/`.
- Main frontend routes include `/ledger`, `/entry`, `/crops`, `/expense-types`, `/accounts`, `/payees`, `/persons`, and `/reports`.
- The app stores client-managed ledger choices and entries through `frontend/src/lib/services/dataService.ts`.
- Custom crops and expense types entered on the New Entry page are saved as quick choices for the signed-in user.

## Development notes

- Use `npm.cmd` from PowerShell on this machine.
- Run the frontend build with `npm.cmd run build --prefix frontend`.
- Development builds use standard `.next` directory (avoid custom distDir in dev to prevent Next.js 15 routes-manifest ENOENT issues).
- Preserve the current application design unless a UI redesign is explicitly requested.
