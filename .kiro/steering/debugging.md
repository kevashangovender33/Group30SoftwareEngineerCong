# Debugging, Verification & Execution Rules

## After Fixing Issues — Resume Execution Immediately

After fixing a bug or resolving an issue (whether self-discovered or pointed out by the user):
1. **Do NOT ask the user to restart servers or re-run tests manually.** Do it yourself.
2. **Kill stale processes, restart servers, and re-run the failing tests** in the same turn.
3. **Continue task execution** — don't stop and wait for the user to confirm the fix worked.
4. If a fix requires a server restart, kill the old process, start a fresh one, verify it works with curl, then run the E2E/unit tests.

## Server Restart After Route Changes

When API routes return 404 or the frontend shows "Failed to load resource: 404 (Not Found)" errors:

1. **Always check for stale server processes first.** Run `lsof -i :3001` to see if an old server is still running.
2. **Kill the stale process** and restart the server before investigating code issues.
3. After creating or modifying any Express route file, the running dev server must be restarted to pick up changes. The `tsx` loader does NOT hot-reload new files automatically.

## E2E Test Failures — Diagnostic Order

When Playwright E2E tests fail, follow this diagnostic order:

1. **Check if the backend is running and serving the expected routes** — `curl http://localhost:3001/api/<endpoint>` before blaming frontend code.
2. **Check for stale server processes** — a server started before new routes were added will 404 on those routes.
3. **Check the Vite proxy** — ensure `/api` is proxied to the correct backend port.
4. **Only then** investigate frontend component logic, hooks, or test selectors.

## General Rule

Never assume a code bug when the symptom is "API returns 404 for a route that clearly exists in the source." The most common cause is a stale server process. Restart first, investigate code second.
