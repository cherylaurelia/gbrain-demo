# Facts: Larkfield Labs (fictional demo company)

- Product: Larkfield, a shared grocery-list app for households. 4 engineers.
- Staging runs in AWS eu-west-2. Staging Postgres host: pg-stg-3.larkfield.internal, database `larkfield_stg`.
- Production Postgres is 15.6; the upgrade to Postgres 17 is owned by Priya Raman (infra). Tomasz Wilk is the backup reviewer for any database change.
- CI uses Node 22.11 exactly. Node 24 breaks our jsdom tests (built-in localStorage), so do not bump it.
- Error tracking: self-hosted GlitchTip at https://errors.larkfield.example. We do not use Sentry.
- Support email: help@larkfield.example. Replies are signed "The Larkfield team".
