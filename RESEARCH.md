# Research Note — LLD Practice Platform

## 1. Learner problem
LLD practice is easy to start but hard to evaluate. A learner can design a Parking Lot or Vending Machine
and still not know whether responsibilities, abstractions, relationships, and trade-offs are actually good.
Common pain points found via quick research (interview-prep forums, peer review threads):
- No tight feedback loop: learners post designs on forums and wait hours/days for uneven-quality reviews.
- Binary answer keys don't work: there are many valid LLD solutions; learners need critique, not exact-match grading.
- Learners don't know what "good" looks like: SOLID, pattern usage, and extensibility are cited but rarely scored.
- No iteration history: one-shot solving doesn't build design intuition; progress over attempts matters.

## 2. Existing approaches / tools researched
| Tool | What it does | Gap for LLD practice |
|---|---|---|
| LeetCode / AlgoExpert | Structured problems + deterministic test cases | Great for DSA; no open-ended design critique |
| Educative / "Grokking OOD" | Guided LLD courses with reference solutions | Passive; learner can't submit own design for review |
| ChatGPT / Claude (raw) | Free-form design feedback if prompted well | Unstructured, no problem set, no history, prompt-dependent quality |
| Exponent / interview peer mocks | Human mock interviews with rubrics | Expensive, not on-demand, inconsistent rubrics |
| Exercism | Practice + mentor feedback loop | Closest model (submit → feedback → iterate), but DSA/language focused |

## 3. Key gaps
1. No product combines a **curated LLD problem set + structured submission + explainable feedback + history** in one loop.
2. Pure-LLM feedback is ungrounded (hallucinates scores); pure-keyword checks are shallow. A hybrid is needed.
3. Learners need to know **what to submit**: unguided "paste your design" produces unreviewable attempts.

## 4. Product direction (MVP)
Focus on the learner loop: **Choose problem → Think/design → Submit → Get feedback → Review → Try again**.
- Small set of 5 classic LLD problems with requirements + guided template (classes, responsibilities, relationships).
- Text/code submission (lowest friction; diagram support deferred as an extension point).
- Hybrid evaluation: deterministic keyword/entity checks (fast, explainable, 40 pts) + LLM critique of SOLID/patterns/extensibility (nuanced, 60 pts).
- Attempt history per user + per problem so improvement is visible.
- Monolith (Next.js + SQLite/Prisma) — appropriate for prototype scale; HLD deferred deliberately.

## 5. Open questions for post-MVP
- Rubric calibration: how to keep LLM scores consistent across runs?
- Reference-solution comparison vs. pure rubric critique — which teaches better?
- Diagram/UML submission parsing.
