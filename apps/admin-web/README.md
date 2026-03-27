# Admin Web

Next.js App Router admin surface for bounded internal workflows only.

Current Phase 13 scope:

- login / session gate
- spring management list
- create spring
- edit spring
- moderation queue
- moderation review

This app is intentionally separate from the mobile/public read flow.

Local development:

```bash
cd /Users/meniwap/mayyanhot
pnpm admin-web:dev
```

Local public env placeholders live in:

- `/Users/meniwap/mayyanhot/apps/admin-web/.env.example`

Real credentials stay in local ignored env only and must never be committed.
