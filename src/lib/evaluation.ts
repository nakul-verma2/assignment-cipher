/**
 * Evaluation Domain - Core business logic for evaluating LLD submissions.
 *
 * Architecture:
 * - EvaluationStrategy interface: decouples evaluation from submission logic
 * - DeterministicEvaluator: fast, rule-based checks (required keywords, entities)
 * - LLMEvaluator: AI-powered design critique via Gemini API
 * - EvaluationEngine: orchestrates both evaluators and combines results
 */

export interface EvaluationResult {
  score: number; // 0–100
  feedback: string; // JSON-stringified FeedbackReport
}

export interface FeedbackReport {
  overallScore: number;
  deterministicChecks: CheckResult[];
  aiInsights: string;
  suggestions: string[];
  strengths: string[];
}

export interface CheckResult {
  label: string;
  passed: boolean;
  hint?: string;
}

// ------------------------------------------------------------------
// EvaluationStrategy interface
// ------------------------------------------------------------------
export interface EvaluationStrategy {
  evaluate(submission: string, problem: ProblemSpec): Promise<Partial<FeedbackReport>>;
}

export interface ProblemSpec {
  title: string;
  requiredKeywords: string[];
}

// ------------------------------------------------------------------
// DeterministicEvaluator
// Checks that the submission mentions all required keywords/entities.
// ------------------------------------------------------------------
export class DeterministicEvaluator implements EvaluationStrategy {
  async evaluate(
    submission: string,
    problem: ProblemSpec
  ): Promise<Partial<FeedbackReport>> {
    const lower = submission.toLowerCase();

    const checks: CheckResult[] = problem.requiredKeywords.map((kw) => {
      const passed = lower.includes(kw.toLowerCase());
      return {
        label: `Contains "${kw}"`,
        passed,
        hint: passed
          ? undefined
          : `Your design doesn't seem to mention "${kw}" — consider adding it.`,
      };
    });

    const passedCount = checks.filter((c) => c.passed).length;
    const deterministicScore = Math.round((passedCount / checks.length) * 40); // max 40 pts

    return { deterministicChecks: checks, overallScore: deterministicScore };
  }
}

// ------------------------------------------------------------------
// LLMEvaluator
// Sends submission to Gemini for design critique.
// ------------------------------------------------------------------
export class LLMEvaluator implements EvaluationStrategy {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async evaluate(
    submission: string,
    problem: ProblemSpec
  ): Promise<Partial<FeedbackReport>> {
    const prompt = `
You are an expert software engineer and interviewer evaluating a candidate's Low-Level Design (LLD) solution.

**Problem:** ${problem.title}

**Candidate's Design Submission:**
\`\`\`
${submission}
\`\`\`

Evaluate the submission based on:
1. Single Responsibility Principle — each class has a clear, focused responsibility
2. Open/Closed Principle — extensible without modifying core classes
3. Correct use of design patterns where appropriate
4. Proper abstraction and encapsulation
5. Clarity and correctness of relationships (inheritance, composition, aggregation)

Respond ONLY with a valid JSON object in this exact format (no extra text):
{
  "aiScore": <number 0-60>,
  "aiInsights": "<one paragraph summary of the overall design quality>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "suggestions": ["<suggestion 1>", "<suggestion 2>", "<suggestion 3>"]
}
`.trim();

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 1024,
          },
        }),
        signal: AbortSignal.timeout(25000),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const rawText: string =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    // Extract JSON from the response (handles markdown code fences)
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse AI response as JSON");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      overallScore: Math.min(60, Math.max(0, parsed.aiScore ?? 0)),
      aiInsights: parsed.aiInsights ?? "",
      strengths: parsed.strengths ?? [],
      suggestions: parsed.suggestions ?? [],
    };
  }
}

// ------------------------------------------------------------------
// EvaluationEngine — orchestrates both evaluators
// ------------------------------------------------------------------
export class EvaluationEngine {
  private deterministic: DeterministicEvaluator;
  private llm: LLMEvaluator | null;

  constructor(geminiApiKey?: string) {
    this.deterministic = new DeterministicEvaluator();
    this.llm = geminiApiKey ? new LLMEvaluator(geminiApiKey) : null;
  }

  async evaluate(
    submission: string,
    problem: ProblemSpec
  ): Promise<EvaluationResult> {
    // Run deterministic checks always
    const detResult = await this.deterministic.evaluate(submission, problem);

    let aiResult: Partial<FeedbackReport> = {
      aiInsights:
        "AI evaluation is unavailable (no API key configured). Please add GEMINI_API_KEY to your .env file.",
      strengths: [],
      suggestions: [],
      overallScore: 0,
    };

    if (this.llm) {
      try {
        aiResult = await this.llm.evaluate(submission, problem);
      } catch (err) {
        console.error("LLM evaluation failed:", err);
        aiResult.aiInsights =
          "AI evaluation timed out or encountered an error. Your deterministic score is still recorded.";
      }
    }

    const totalScore =
      (detResult.overallScore ?? 0) + (aiResult.overallScore ?? 0);

    const report: FeedbackReport = {
      overallScore: Math.min(100, totalScore),
      deterministicChecks: detResult.deterministicChecks ?? [],
      aiInsights: aiResult.aiInsights ?? "",
      strengths: aiResult.strengths ?? [],
      suggestions: aiResult.suggestions ?? [],
    };

    return {
      score: report.overallScore,
      feedback: JSON.stringify(report),
    };
  }
}

// ------------------------------------------------------------------
// Problem keyword registry
// Maps problem ID → required keywords for deterministic checks
// ------------------------------------------------------------------
export const PROBLEM_KEYWORDS: Record<string, string[]> = {
  "parking-lot": [
    "ParkingLot",
    "ParkingSpot",
    "Vehicle",
    "Ticket",
    "Payment",
    "Floor",
  ],
  "vending-machine": [
    "VendingMachine",
    "Product",
    "Coin",
    "Inventory",
    "State",
    "Dispense",
  ],
  elevator: [
    "Elevator",
    "Floor",
    "Request",
    "Direction",
    "Door",
    "Scheduler",
  ],
};

export function getKeywordsForProblem(problemTitle: string): string[] {
  const title = problemTitle.toLowerCase();
  if (title.includes("parking")) return PROBLEM_KEYWORDS["parking-lot"];
  if (title.includes("vending")) return PROBLEM_KEYWORDS["vending-machine"];
  if (title.includes("elevator")) return PROBLEM_KEYWORDS["elevator"];
  // Generic fallback: require class and interface
  return ["class", "interface"];
}
