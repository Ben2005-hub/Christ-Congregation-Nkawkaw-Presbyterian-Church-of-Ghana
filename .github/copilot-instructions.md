<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

This project is a full-stack web application for the Presbyterian Church of Ghana. It includes a React frontend, Node.js/Express backend, and Twilio SMS integration. Prioritize clean code, security, and user-friendly design.

Guidance for AI agents working on this repository
-------------------------------------------------

Summary (big picture):
- Frontend: Vite + React app in `src/` (entry: `src/App.jsx`, `src/Login.jsx`, `src/Member.jsx`). UI uses `react-bootstrap` and expects the backend at http://localhost:5001.
- Backend: Express server in `server/` (entry: `server/index.js`). Lightweight in-memory data stores live in `server/members.js`, `server/payments.js`, and `server/admins.js`.
- SMS: Twilio helper at `server/sms.js` reads `TWILIO_*` env vars. The server calls `sendSMS()` after registration and payments but errors are caught and logged.

What to know before editing code:
- State is ephemeral: members, payments, and admins are stored in-memory (arrays). Any change that requires persistence should add a DB (not present) and update API contracts accordingly.
- Backend port: the Express server defaults to `process.env.PORT || 5001`. Frontend fetch calls target `http://localhost:5001` in the current code. Keep CORS in place when changing ports.
- Auth is minimal: `server/admins.js` stores plaintext passwords in-memory. Any work touching authentication should assume it's a placeholder and document migration to hashed credentials & persistent storage.

Developer workflows & useful commands (reproducible):
- Install and run frontend dev server (from repo root):
	- npm install
	- npm run dev
	- Frontend default: http://localhost:5173
- Install and run backend (in `server/`):
	- cd server; npm install
	- npm run dev (uses nodemon, runs `index.js`)
	- API base: http://localhost:5001
- Environment variables for SMS (create `server/.env`):
	- TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
	- BIRTHDAY_MODE (optional) — set to `dev` to run birthday checks every minute for testing; default is production daily checks
	- SMS_SIMULATE (optional) — set to `true` to simulate SMS sends locally (recommended for development)

Authentication & env vars:
- Admin endpoints are now JWT-protected. After successful login POST `/api/admin/login` returns `{ token }`.
- Protect client calls by including Authorization: Bearer <token>.
- Environment variable: `JWT_SECRET` (optional) — default present for dev, but change in production.

Additional SMS endpoints and automation:
- POST `/api/sms/bulk` — accepts `{ payloads: [{to,message}, ...] }` or `{ to: [phones], message: '...' }` and returns per-recipient results.
- POST `/api/sms/birthday` — immediate birthday send (personalized).
- POST `/api/sms/trigger-birthday-check` — manual trigger for the automated birthday check (useful during testing).

Patterns and conventions to follow (examples):
- HTTP API shape: all endpoints are under `/api/*` (e.g., `/api/members`, `/api/payments`, `/api/admin/*`). Follow existing request/response patterns — simple JSON bodies and error objects like { error: '...' }.
- Frontend expectations: responses are used directly as JSON; handlers check `res.ok` and read `.json()` on error to show messages (see `src/Login.jsx` and `src/App.jsx`). Maintain this pattern when changing API responses.
- SMS calls are fire-and-log: `sendSMS()` is awaited inside try/catch; failures are logged but do not block API success. Preserve this behavior unless intentionally changing UX.

Quick code examples for common edits:
- Add a new member field (e.g., `email`): update `server/members.js` (add to registerMember default values), update `src/AdminPortal` register form (`src/App.jsx` — form state `member`), and ensure backend accepts/returns `email` in responses.
- Replace in-memory store with a DB: introduce a `db/` module, update `server/members.js`, `server/payments.js`, and `server/admins.js` to export async functions, and update `server/index.js` routes to `await` them. Keep API contract stable where possible.

Testing and safety notes for agents:
- No automated tests currently. Keep changes small and run the app locally to smoke-test. Start backend first, then frontend.
- Do not commit real Twilio credentials. Use `.env` and `.gitignore` for secrets.

Files of interest (start here):
- `server/index.js` — backend routes and main app wiring
- `server/sms.js` — Twilio integration
- `server/members.js`, `server/payments.js`, `server/admins.js` — in-memory models
- `src/App.jsx`, `src/Login.jsx`, `src/Member.jsx` — main UI flows and API usage
- `package.json` and `server/package.json` — scripts and dependency lists

When you propose changes, include:
- Updated files and a short rationale (2–3 lines).
- Any required env changes and example `.env` entries.
- A short smoke test (routes to hit or UI flows to exercise).

If anything is ambiguous (DB choice, auth strategy, Twilio test numbers), ask the maintainer before making high-impact changes.

End of instructions.
