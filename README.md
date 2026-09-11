# LLD Practice Platform — CipherSchools Assignment

Practice Low-Level Design (Parking Lot, Vending Machine, Elevator, Library, Splitwise),
submit your design, get hybrid deterministic + AI feedback, and track attempts over time.

Flow: Home → `/problems` → `/problems/[id]` (design + submit + feedback) → `/history`.

## Quickstart

```bash
npm install
# .env (SQLite by default)
echo 'DATABASE_URL="file:./dev.db"' > .env
# optional: enables AI critique (without it, deterministic-only feedback)
# echo 'GEMINI_API_KEY="your-key"' >> .env

npx prisma db push
npm run db:seed
npm run dev   # http://localhost:3000
```

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start Next.js dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm test` | Run vitest suite (`tests/`) |
| `npm run db:seed` | Seed 5 LLD problems + demo user |
| `npx prisma studio` | Inspect SQLite data |

## How evaluation works
- **Deterministic (40 pts):** per-problem required-entity checks (e.g. Parking Lot → `ParkingLot, ParkingSpot,
  Vehicle, Ticket, Payment, Floor`), proportional scoring + per-check hints. Never fails.
- **LLM via Gemini (60 pts):** rubric critique of SRP/OCP, patterns, abstraction, relationships; strict-JSON prompt
  (`aiScore`, `aiInsights`, `strengths`, `suggestions`), 25s timeout. Failures degrade gracefully — deterministic
  score is kept and the row is marked `FAILED` or completed-with-note, never hangs.

## Key decisions
- Monolith (Next.js + Prisma/SQLite); sync evaluation with persisted `PENDING → EVALUATING → COMPLETED | FAILED`.
- `EvaluationStrategy` interface: add a new evaluator without touching routes (see `src/lib/evaluation.ts`).
- Email-keyed identity (no passwords) for frictionless per-user history.

## Limitations
- Text/code submissions only (no diagram parsing yet — interface supports extension).
- Keyword checks are recall-oriented (mention ≠ correct use; LLM covers depth).
- Single demo identity model; no real auth/rate-limiting.

## Docs
- `RESEARCH.md` — learner problem, existing tools, gaps, direction.
- `DESIGN.md` — MVP flow, classes/interfaces, evaluation, trade-offs, failure handling.
- `AI_USAGE.md` — 5 meaningful AI-assisted decisions.

## Note on `skill.md` / Prisma Composer
The `prisma-composer-core-concepts` skill provided in the prompt describes `@prisma/composer`
(service/resource/module topology, `compute()`, deploy targets). This prototype intentionally does **not**
use Composer: it's a single Next.js monolith with direct Prisma access, which matches the assignment's
"simple monolith is completely acceptable" scope. No `module.ts`, no deploy config, no `process.env`-free
service wiring was introduced — adding Composer here would be over-engineering. The evaluation engine's
`EvaluationStrategy` interface preserves a clean seam if the app ever grows into composed services.
