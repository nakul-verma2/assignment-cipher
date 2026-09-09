# Design Note — LLD Practice Platform (MVP)

## 1. MVP & user flow
**Flow:** Home → `/problems` (choose) → `/problems/[id]` (read requirements, write design in guided editor, submit)
→ feedback panel (score / checks / AI insights / strengths / suggestions) → `/history` (all attempts) → try again.

**Scope decisions:**
- Submission format: free text/code with a starter template that prompts for classes, responsibilities, relationships.
  Diagram upload deferred — the `EvaluationStrategy` interface accepts a string today and can accept structured blocks later.
- Auth: lightweight email-keyed identity (upsert `User` by email). No passwords for the prototype.
- Sync evaluation: request runs deterministic checks + one LLM call (25s timeout), then returns. Status lifecycle
  `EVALUATING → COMPLETED | FAILED` is persisted so slow/failing AI is visible and retryable.

## 2. Important classes / interfaces
```
EvaluationStrategy.evaluate(submission, problem): Promise<Partial<FeedbackReport>>
├── DeterministicEvaluator   // keyword/entity presence → 0–40 pts + per-check hints
└── LLMEvaluator             // Gemini rubric critique → 0–60 pts + insights/strengths/suggestions
EvaluationEngine              // orchestrates both; LLM failure degrades gracefully (keeps deterministic score)
getKeywordsForProblem(title)  // problem → required-entity registry (extension point for per-problem rubrics)
Prisma models: User ─< Submission >─ Problem
API: GET /api/problems, GET /api/problems/[id],
     POST /api/submissions (validate → EVALUATING → evaluate → COMPLETED/FAILED),
     GET /api/submissions?email=&problemId=, GET /api/submissions/[id]
UI: app/problems/page.tsx, app/problems/[id]/page.tsx, app/history/page.tsx
```

## 3. Evaluation approach
| Part | Deterministic | LLM |
|---|---|---|
| Entity coverage ("did you model Ticket/Payment?") | ✅ fast, explainable, stable | ❌ |
| SOLID, patterns, abstraction quality, trade-offs | ❌ multiple valid solutions | ✅ nuanced critique |
| Scoring | 40 pts, proportional | 60 pts via constrained JSON prompt (temperature 0.3) |
| Failure mode | never fails | timeout/API error → catch → FAILED-safe: keep deterministic score, explain degradation |

Prompt constrains the model to a strict JSON schema (`aiScore`, `aiInsights`, `strengths`, `suggestions`),
parsed defensively (fence-tolerant regex + try/catch). Without `GEMINI_API_KEY` the engine still works
(deterministic-only) so the demo never bricks.

## 4. Key trade-offs
- **Monolith over services:** one Next.js app + SQLite. Correct for 2-day prototype; scales to Postgres + queue later.
- **Sync over queue:** simpler UX; acceptable because evaluation is <30s. If LLM latency grows, move to background jobs
  (mark EVALUATING, poll/SSE, worker updates row) — status field already supports this.
- **Keywords over AST parsing:** recall-oriented and explainable; can false-positive on mere mentions. Mitigated by
  weighting keywords only 40% and letting the LLM judge real usage.
- **No reference-solution diffing:** avoids penalising valid alternative designs; rubric critique generalises better.

## 5. Extensibility
- New evaluation approach: implement `EvaluationStrategy`, inject into `EvaluationEngine` — no route changes.
- New submission format (diagram/structured blocks): widen `evaluate()` input type; deterministic checker gains new rules.
- New problems: seed row + keyword entry; no code changes.
- Scaling sketch: Postgres + `Submission.status` polling + LLM worker pool + rate limiting; reads are already paginated by user.

## 6. Failure handling
- Validation: missing fields → 400; <50 chars → 400 with guidance; unknown problem → 404.
- LLM timeout/error → row marked FAILED or COMPLETED-with-degradation-note (never hangs); UI shows status badge + retry.
- AI key absent → explicit "deterministic-only" message instead of silent 0.
