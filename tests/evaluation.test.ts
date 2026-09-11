import { describe, it, expect, vi } from "vitest";
import {
  DeterministicEvaluator,
  EvaluationEngine,
  getKeywordsForProblem,
} from "../src/lib/evaluation";

describe("DeterministicEvaluator", () => {
  const evaluator = new DeterministicEvaluator();
  const problem = {
    title: "Design a Parking Lot",
    requiredKeywords: ["ParkingLot", "ParkingSpot", "Vehicle", "Ticket", "Payment", "Floor"],
  };

  it("awards full 40pts when all keywords present", async () => {
    const submission = problem.requiredKeywords.join(" ") + " extra design text";
    const result = await evaluator.evaluate(submission, problem);
    expect(result.deterministicChecks).toHaveLength(6);
    expect(result.deterministicChecks!.every((c) => c.passed)).toBe(true);
    expect(result.overallScore).toBe(40);
  });

  it("is case-insensitive", async () => {
    const result = await evaluator.evaluate("parkinglot parkingsSpot VEHICLE ticket payment floor", problem);
    // "parkinglot" matches ParkingLot case-insensitively; parkingsSpot is a typo -> fail
    const passed = result.deterministicChecks!.filter((c) => c.passed).length;
    expect(passed).toBeLessThan(6);
    expect(passed).toBeGreaterThanOrEqual(4);
  });

  it("scores proportionally for partial coverage", async () => {
    const result = await evaluator.evaluate("class ParkingLot with Vehicle and Ticket", problem);
    // 3 of 6 -> 20 pts
    expect(result.overallScore).toBe(20);
    const failed = result.deterministicChecks!.filter((c) => !c.passed);
    expect(failed.length).toBe(3);
    expect(failed[0].hint).toMatch(/consider adding it/);
  });

  it("scores 0 for empty submission", async () => {
    const result = await evaluator.evaluate("", problem);
    expect(result.overallScore).toBe(0);
    expect(result.deterministicChecks!.every((c) => !c.passed)).toBe(true);
  });

  it("returns 0 (not NaN) for an empty keyword list", async () => {
    const result = await evaluator.evaluate("class Foo {}", {
      title: "t",
      requiredKeywords: [],
    });
    expect(result.overallScore).toBe(0);
    expect(result.deterministicChecks).toEqual([]);
  });
});

describe("getKeywordsForProblem", () => {
  it("maps known problems", () => {
    expect(getKeywordsForProblem("Design a Parking Lot")).toContain("Ticket");
    expect(getKeywordsForProblem("Design a Vending Machine")).toContain("Dispense");
    expect(getKeywordsForProblem("Design an Elevator System")).toContain("Scheduler");
    expect(getKeywordsForProblem("Design a Library Management System")).toContain("Catalog");
    expect(getKeywordsForProblem("Design a Splitwise-style Expense Sharing App")).toContain("Settle");
  });

  it("falls back to generic keywords for unknown problems", () => {
    expect(getKeywordsForProblem("Design a Chess Game")).toEqual(["class", "interface"]);
  });
});

describe("EvaluationEngine", () => {
  it("works without an API key (deterministic only, graceful message)", async () => {
    const engine = new EvaluationEngine(undefined);
    const result = await engine.evaluate("class ParkingLot { floors: Floor[] }", {
      title: "Design a Parking Lot",
      requiredKeywords: ["ParkingLot", "Floor", "Vehicle", "Ticket", "Payment", "ParkingSpot"],
    });
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(40);
    const report = JSON.parse(result.feedback);
    expect(report.aiInsights).toMatch(/unavailable/i);
    expect(report.overallScore).toBe(result.score);
  });

  it("survives LLM failure and still returns deterministic score", async () => {
    const engine = new EvaluationEngine("fake-key");
    // Force fetch to fail
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    try {
      const result = await engine.evaluate("ParkingLot ParkingSpot Vehicle Ticket Payment Floor", {
        title: "Design a Parking Lot",
        requiredKeywords: ["ParkingLot", "ParkingSpot", "Vehicle", "Ticket", "Payment", "Floor"],
      });
      expect(result.score).toBe(40); // deterministic full marks, AI 0
      const report = JSON.parse(result.feedback);
      expect(report.aiInsights).toMatch(/timed out|error/i);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("treats a non-numeric AI score as 0 instead of NaN", async () => {
    const engine = new EvaluationEngine("fake-key");
    const fakeResponse = {
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    aiScore: "excellent",
                    aiInsights: "Great design.",
                    strengths: ["Clear classes"],
                    suggestions: ["Add patterns"],
                  }),
                },
              ],
            },
          },
        ],
      }),
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(fakeResponse));
    try {
      const result = await engine.evaluate("ParkingLot ParkingSpot Vehicle Ticket Payment Floor", {
        title: "Design a Parking Lot",
        requiredKeywords: ["ParkingLot", "ParkingSpot", "Vehicle", "Ticket", "Payment", "Floor"],
      });
      expect(Number.isNaN(result.score)).toBe(false);
      expect(result.score).toBe(40); // deterministic only, AI coerced to 0
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("caps total score at 100", async () => {
    const engine = new EvaluationEngine(undefined);
    const result = await engine.evaluate("everything " + "x".repeat(5000), {
      title: "t",
      requiredKeywords: ["everything"],
    });
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("always returns JSON-serializable feedback", async () => {
    const engine = new EvaluationEngine();
    const result = await engine.evaluate("class Foo {}", {
      title: "Design a Chess Game",
      requiredKeywords: ["class", "interface"],
    });
    expect(() => JSON.parse(result.feedback)).not.toThrow();
    const report = JSON.parse(result.feedback);
    expect(report).toHaveProperty("deterministicChecks");
    expect(report).toHaveProperty("suggestions");
    expect(report).toHaveProperty("strengths");
  });
});
