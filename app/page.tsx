import results from "../bench/results.json";
import { ARMS, CONTROL, cell, parseRuns, taskKeys, type Arm, type Cell } from "../lib/bench";

const REPO = "https://github.com/cherylaurelia/gbrain-demo";
const BENCH = `${REPO}/tree/main/bench`;
const REPRO = `${REPO}/blob/main/bench/repro/share-plan-repro-master.txt`;
const ISSUE = "https://github.com/garrytan/gbrain/issues/6661";
const STATUS_SRC = "https://github.com/garrytan/gbrain/blob/09fe4c5a/src/mcp/status-mode.ts#L228-L256";
const DOCS = "https://github.com/garrytan/gbrain/blob/09fe4c5a/docs/mcp/CLAUDE_CODE.md#L95-L105";

const runs = parseRuns(results);

const ARM_LABEL: Record<Arm, { name: string; detail: string }> = {
  solo: { name: "Alone", detail: "default `gbrain setup claude-code`, no other session open" },
  second: { name: "Second session", detail: "same setup, another session already has the brain open" },
  shared: { name: "One shared server", detail: "`gbrain serve --http`, every session connected to it" },
};

const TASKS = {
  decision_free_plan: { prompt: "What did we decide about a free plan, and why?", needs: "38% / students (decisions log)" },
  people_pg_upgrade: { prompt: "Who should I loop in on the Postgres upgrade?", needs: "Priya Raman" },
  reply_sso: { prompt: "Draft a reply to a Team customer asking about SSO.", needs: "Q1 2027, Enterprise only" },
  code_checkout: { prompt: "Add a POST /checkout endpoint with our payment provider.", needs: "Paddle (Stripe frozen)" },
  code_env: { prompt: "Write a .env.example for our staging environment.", needs: "pg-stg-3 / eu-west-2" },
  ci_node: { prompt: "Add a GitHub Actions CI workflow.", needs: "Node 22.11 exactly" },
  code_errors: { prompt: "Add error tracking to this app.", needs: "GlitchTip (Sentry rejected)" },
  control_bug: { prompt: "Order listsForHousehold by name. (control)", needs: "nothing from the brain" },
} satisfies Record<string, { prompt: string; needs: string }>;

function taskText(key: string) {
  const entry = Object.entries(TASKS).find(([k]) => k === key);

  return entry === undefined ? { prompt: key, needs: "" } : entry[1];
}

function Score({ c }: { c: Cell }) {
  const tone = c.right === c.runs ? "text-ok" : c.right === 0 ? "text-err" : "text-ink";

  return (
    <span className={`font-mono ${tone}`}>
      {c.right}/{c.runs}
    </span>
  );
}

function Code({ children }: { children: string }) {
  return <code className="rounded bg-sheet px-1.5 py-0.5 font-mono text-[0.9em] text-ink">{children}</code>;
}

function Md({ text }: { text: string }) {
  return (
    <>
      {text.split("`").map((part, i) => (i % 2 === 1 ? <Code key={part}>{part}</Code> : <span key={part}>{part}</span>))}
    </>
  );
}

const PLAN = [
  { step: "kill <PID of the other session>", result: "ok" },
  { step: "gbrain serve --http", result: "ok, /health 200" },
  { step: "gbrain bootstrap harness --harness all --yes", result: "exit 1: a live gbrain serve holds this PGLite brain, so the harness cannot mint a token" },
];

const WORKS = [
  "stop the serve",
  "gbrain auth create bootstrap-harness --scopes read,write,skills_member_self",
  "gbrain auth rescope --token bootstrap-harness --operations <the 139-operation list>",
  "gbrain serve --http",
  "gbrain bootstrap harness --harness all --yes --token <token>",
];

export default function Page() {
  const total = (arm: Arm) => cell(runs, arm);
  const toldUser = runs.filter((r) => r.arm === "second" && r.key !== CONTROL && r.toldUser).length;

  return (
    <main className="mx-auto max-w-5xl px-5 py-12 sm:py-16">
      <p className="text-sm font-semibold uppercase tracking-wide text-ink-3">GBrain · self-hosted, keyless PGLite · tested 2026-11-17</p>
      <h1 className="mt-3 text-3xl font-bold leading-tight sm:text-5xl">Open a second agent session and it works without memory.</h1>
      <p className="mt-5 max-w-3xl text-lg text-ink-2">
        <strong className="text-ink">Problem:</strong> on the README&apos;s default install, each Claude Code session starts its own{" "}
        <Code>gbrain serve</Code>, PGLite lets one of them in, and the shared-server plan <Code>gbrain_status</Code> hands the
        second one fails at step 3.
      </p>
      <p className="mt-3 max-w-3xl text-lg text-ink-2">
        <strong className="text-ink">Fix:</strong> on PGLite, have that plan print the order <Code>bootstrap harness</Code>&apos;s
        own error already asks for (pre-mint, then <Code>--token</Code>), or let the harness mint through the live serve.
      </p>
      <div className="mt-7 flex flex-wrap gap-3">
        <a href={REPRO} className="rounded-lg bg-button px-5 py-3 font-semibold text-button-ink hover:opacity-90">
          See the step-3 repro
        </a>
        <a href={BENCH} className="rounded-lg border border-line px-5 py-3 font-semibold text-ink hover:bg-card">
          Bench + 72 run logs
        </a>
        <a href={REPO} className="rounded-lg border border-line px-5 py-3 font-semibold text-ink hover:bg-card">
          Repo
        </a>
      </div>

      <section className="mt-12 grid gap-4 sm:grid-cols-3">
        {ARMS.map((arm) => (
          <div key={arm} className="rounded-xl border border-line bg-card p-5">
            <p className="text-sm text-ink-3">{ARM_LABEL[arm].name}</p>
            <p className="mt-1 text-4xl font-bold">
              <Score c={total(arm)} />
            </p>
            <p className="mt-2 text-sm text-ink-2">
              brain-backed tasks answered from the brain · <Md text={ARM_LABEL[arm].detail} />
            </p>
          </div>
        ))}
      </section>
      <p className="mt-3 text-sm text-ink-3">
        72 headless Claude Code runs (Sonnet), 7 tasks that need a fact from the brain plus 1 control, 3 runs each. The brain is 3
        fictional notes (facts, decisions log, one call transcript). Small n, one model, Claude Code only: read it as a
        reproduction, not an accuracy score. Hosted gbrain.io was not tested.
      </p>

      <section className="mt-12">
        <h2 className="text-2xl font-bold">What the second session did instead</h2>
        <ul className="mt-4 space-y-3 text-ink-2">
          <li>
            Wired <strong className="text-err">Sentry in 3 of 3</strong> runs. The decisions log says &quot;Sentry rejected&quot;
            and the team self-hosts GlitchTip; alone, 2 of 3 used GlitchTip, and shared, 3 of 3.
          </li>
          <li>
            Called <strong className="text-err">api.stripe.com in 2 of 3</strong> checkout runs. The 2026-11-04 call says
            &quot;Paddle only for anything new in checkout.&quot;
          </li>
          <li>
            Left staging hosts as placeholders and could not say who owns the Postgres upgrade, which the brain answers.
          </li>
          <li>
            The status message itself works: <strong className="text-ink">{toldUser} of 21</strong> final answers told the user
            memory was unavailable. They told the user; they still had to guess.
          </li>
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold">Per task</h2>
        <div className="mt-4 overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-sheet text-ink-2">
              <tr>
                <th className="p-3 font-semibold">Prompt</th>
                <th className="p-3 font-semibold">Needs from the brain</th>
                {ARMS.map((arm) => (
                  <th key={arm} className="p-3 font-semibold">
                    {ARM_LABEL[arm].name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {taskKeys(runs).map((key) => (
                <tr key={key} className="border-t border-line">
                  <td className="p-3">{taskText(key).prompt}</td>
                  <td className="p-3 text-ink-2">{taskText(key).needs}</td>
                  {ARMS.map((arm) => (
                    <td key={arm} className="p-3">
                      <Score c={cell(runs, arm, key)} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-ink-3">
          Alone misses: the CI task read the brain every time but pinned Node 22 or a 20/22 matrix, not 22.11 (3), and one error
          tracking run used Sentry (1). Graded by grep on the answer or the written files (bench/grade.py).
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold">The plan the second session gets</h2>
        <p className="mt-3 max-w-3xl text-ink-2">
          <Code>gbrain_status</Code> answers <Code>lock_held</Code> and offers one shared server, as{" "}
          <a className="text-link underline" href={DOCS}>
            docs/mcp/CLAUDE_CODE.md
          </a>{" "}
          recommends. Its <Code>share_http_plan</Code> (
          <a className="text-link underline" href={STATUS_SRC}>
            status-mode.ts
          </a>
          ), followed literally on a fresh install:
        </p>
        <ol className="mt-4 space-y-2">
          {PLAN.map((p, i) => (
            <li key={p.step} className="rounded-lg border border-line bg-card p-3 font-mono text-sm">
              <span className="text-ink-3">{i + 1}.</span> {p.step}
              <span className={`block pt-1 font-sans ${i === 2 ? "text-err" : "text-ok"}`}>{p.result}</span>
            </li>
          ))}
        </ol>
        <p className="mt-4 max-w-3xl text-ink-2">
          Lock contention only happens on PGLite, and PGLite is the one engine where step 3 cannot mint (&quot;Postgres brains
          mint fine while the serve runs&quot;). Same result on stable 0.60.733.0 and master 09fe4c5a. The harness stays on stdio,
          so the next session is locked out again. An outside user reported the mint/serve deadlock in{" "}
          <a className="text-link underline" href={ISSUE}>
            #6661
          </a>
          ; the <Code>--token</Code> path was fixed there, and minting through the running serve is still open.
        </p>
        <h3 className="mt-8 text-lg font-bold">The order that works (from step 3&apos;s own error), used for the shared arm</h3>
        <ol className="mt-3 space-y-2">
          {WORKS.map((w, i) => (
            <li key={w} className="rounded-lg border border-line bg-card p-3 font-mono text-sm">
              <span className="text-ink-3">{i + 1}.</span> {w}
            </li>
          ))}
        </ol>
        <p className="mt-4 max-w-3xl text-ink-2">
          After it, Claude Code&apos;s entry points at <Code>http://127.0.0.1:3131/mcp</Code>, the smoke test passes, and with runs
          going 4 at a time the shared arm answered 21 of 21. Step 5 still exits 1, because hooks from <Code>gbrain setup claude-code</Code>{" "}
          are already wired (&quot;refusing to double-wire&quot;), so an agent reading the exit code would report failure.
        </p>
      </section>

      <section className="mt-12 rounded-xl border border-line bg-sheet p-6">
        <h2 className="text-2xl font-bold">The one change</h2>
        <p className="mt-3 text-ink-2">
          In <Code>statusFix</Code>, when the engine is PGLite, emit the five steps above as the plan instead of{" "}
          <Code>serve --http</Code> then <Code>bootstrap harness</Code>, or make <Code>bootstrap harness</Code> mint through the
          live serve (#6661 option A) so today&apos;s three steps work as written. Smaller follow-up: treat already-wired setup
          hooks as success in step 5, and say in the README that two sessions at once need the shared server.
        </p>
      </section>

      <section className="mt-12 text-sm text-ink-3">
        <h2 className="text-base font-semibold text-ink-2">How it was run</h2>
        <p className="mt-2">
          gbrain 0.60.733.0 (stable) from <Code>bun install -g github:garrytan/gbrain#stable</Code>,{" "}
          <Code>gbrain init --pglite --no-embedding</Code>, the notes added with <Code>gbrain sources add</Code>, then{" "}
          <Code>gbrain setup claude-code</Code>. Each run: a fresh copy of the brain and a small Express app,{" "}
          <Code>claude -p --setting-sources project --model sonnet</Code> with the MCP entry, hooks and brain-first block that
          setup wrote (the block as a project CLAUDE.md, since user settings were kept out). The &quot;second session&quot; is a
          real <Code>gbrain serve</Code> that did a handshake and one recall first. bench/run.sh has every flag.
        </p>
      </section>

      <footer className="mt-16 border-t border-line pt-6 text-sm text-ink-3">
        Unofficial demo by Cheryl Aurelia: not affiliated with GBrain. Fictional company data; no gbrain.io account was used.
      </footer>
    </main>
  );
}
