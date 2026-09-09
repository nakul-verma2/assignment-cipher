# AI_USAGE.md — Meaningful AI-assisted decisions

1. **Hybrid evaluation split (deterministic 40 / LLM 60)**
   - AI suggested: pure-LLM grading with a single 0–100 score.
   - Accepted / rejected: rejected pure-LLM; kept LLM but capped at 60 pts with deterministic grounding (40 pts).
   - Why: pure-LLM scores are uncalibrated and hallucinate; keyword checks are stable and explainable. Hybrid answers
     "which parts deterministic vs LLM" from the brief directly.

2. **Strategy-pattern evaluator design (`EvaluationStrategy` + `EvaluationEngine`)**
   - AI suggested: a single `evaluateSubmission()` function with inline fetch.
   - Accepted / rejected: rejected the monolith; accepted the direction but implemented Strategy + Engine orchestration.
   - Why: the brief asks how to accommodate another evaluation approach later — a strategy interface makes that a
     one-class addition with graceful LLM-failure degradation.

3. **Constrained JSON prompt (temperature 0.3, fence-tolerant parse)**
   - AI suggested: open-ended "give feedback" prompt.
   - Accepted / rejected: rejected open-ended; used strict-schema prompt with regex JSON extraction + try/catch.
   - Why: open-ended output breaks the UI contract; constrained output keeps feedback renderable and testable.

4. **Sync evaluation with persisted EVALUATING/COMPLETED/FAILED statuses**
   - AI suggested: background queue (BullMQ + Redis) from the start.
   - Accepted / rejected: rejected the queue for MVP scope.
   - Why: brief says "do not turn the assignment into a distributed-systems project"; status column preserves the
     upgrade path (poll/worker later) without the infra cost now.

5. **Email-keyed lightweight identity instead of full auth**
   - AI suggested: NextAuth with OAuth providers.
   - Accepted / rejected: rejected full auth for the prototype.
   - Why: learner journey (not LMS) is the focus; email upsert gives per-user history with zero auth friction,
     and can be swapped for real auth later without touching evaluation logic.
