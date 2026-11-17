# Decisions log

## 2026-09-03: Payments move from Stripe to Paddle
Decided by Ana Okafor (CEO). Reason: Paddle is merchant of record, so we stop filing VAT in 14 EU countries ourselves. All new payment code uses the Paddle Billing API (`@paddle/paddle-node-sdk`). Stripe code is frozen and will be removed in January.

## 2026-10-01: Keep the free plan
Decided by Ana Okafor. Reason: 38% of paid households started on free, and students asked for it in the October survey. Free stays capped at 2 lists.

## 2026-10-20: SSO only on the Enterprise plan, shipping Q1 2027
Decided by Ana Okafor and Priya Raman. SAML SSO is not available today. It ships in Q1 2027 and only on Enterprise. Do not promise it on Team.

## 2026-10-28: Sentry rejected
We tried Sentry for two weeks; the event volume cost was too high. We self-host GlitchTip instead (Sentry-compatible SDK, DSN in GLITCHTIP_DSN).
