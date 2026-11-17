# Two agent sessions, one GBrain (unofficial demo)

On GBrain's default keyless install (PGLite), every Claude Code session starts its own `gbrain serve`. PGLite has one writer, so a second session that is open at the same time goes status-only and works without memory. `gbrain_status` then offers one shared `gbrain serve --http`, which docs/mcp/CLAUDE_CODE.md also recommends, but its `share_http_plan` fails at step 3 on PGLite: `gbrain bootstrap harness` exits 1 because "a live `gbrain serve` holds this PGLite brain, so the harness cannot mint a token".

Live page: https://gbrain-two-sessions.vercel.app

## Evidence (2026-11-17, gbrain 0.60.733.0 stable and master 09fe4c5a)
- 72 headless Claude Code runs (Sonnet), 7 brain-backed tasks + 1 control, 3 reps, a 3-note fictional company brain:
  alone 17/21, second session 0/21 (Sentry wired 3/3 against "Sentry rejected", Stripe 2/3 against "Paddle only"), one shared server 21/21.
- `bench/repro/share-plan-repro*.txt`: the plan followed literally (step 3 exit 1, harness left on stdio), then the five steps that work.
- Related: https://github.com/garrytan/gbrain/issues/6661 (mint vs. serve deadlock on PGLite; minting through the live serve still open).

## What is here
- `bench/`: `run.sh` (arms solo / second / shared), `holder.py` (the other session), `grade.py`, prompts, the fictional brain (`company/`) and app, `results.json`, and per-run tool calls + final answers in `bench/runs/` (paths sanitized; raw session streams not published).
- `app/`, `lib/`: the Next.js page; `lib/bench.ts` builds the tables from `bench/results.json`.

## Run
```
npm install && npm test && npm run build && npm start
```
Bench: install gbrain per its README, build a brain from `bench/company`, run `gbrain setup claude-code`, then `xargs -P 4 -L 1 ./run.sh < jobs.txt` and `python3 grade.py` (paths in run.sh point at the author's scratch dirs).

Unofficial demo by Cheryl Aurelia: not affiliated with GBrain. Hosted gbrain.io was not tested.
