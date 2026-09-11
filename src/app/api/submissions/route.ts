import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { EvaluationEngine, getKeywordsForProblem } from "@/lib/evaluation";

const MIN_CONTENT_LENGTH = 50;

// POST /api/submissions – create and evaluate a new submission
export async function POST(req: NextRequest) {
  let submissionId: string | null = null;
  try {
    const body = await req.json();
    const { content, problemId, userName, userEmail } = body;

    if (!content || !problemId) {
      return NextResponse.json(
        { error: "content and problemId are required" },
        { status: 400 }
      );
    }

    if (
      typeof content !== "string" ||
      content.trim().length < MIN_CONTENT_LENGTH
    ) {
      return NextResponse.json(
        {
          error: `Submission is too short. Please provide at least ${MIN_CONTENT_LENGTH} characters describing your classes, responsibilities, and relationships.`,
        },
        { status: 400 }
      );
    }

    const problem = await prisma.problem.findUnique({
      where: { id: problemId },
    });
    if (!problem) {
      return NextResponse.json({ error: "Problem not found" }, { status: 404 });
    }

    // Upsert user by email (use anonymous if not provided)
    const email =
      typeof userEmail === "string" && userEmail.includes("@")
        ? userEmail
        : "anonymous@example.com";
    const name = userName || "Anonymous Learner";

    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, name },
    });

    // Create submission in EVALUATING state first (visible status)
    const submission = await prisma.submission.create({
      data: {
        content,
        status: "EVALUATING",
        userId: user.id,
        problemId,
      },
    });
    submissionId = submission.id;

    // Run evaluation engine (deterministic always; LLM when key present)
    try {
      const engine = new EvaluationEngine(process.env.GEMINI_API_KEY);
      const keywords = getKeywordsForProblem(problem.title);
      const result = await engine.evaluate(content, {
        title: problem.title,
        requiredKeywords: keywords,
      });

      const updated = await prisma.submission.update({
        where: { id: submission.id },
        data: {
          status: "COMPLETED",
          score: result.score,
          feedback: result.feedback,
        },
      });
      return NextResponse.json(updated, { status: 201 });
    } catch (evalErr) {
      console.error("Evaluation failed:", evalErr);
      const failed = await prisma.submission.update({
        where: { id: submission.id },
        data: {
          status: "FAILED",
          feedback: JSON.stringify({
            overallScore: 0,
            deterministicChecks: [],
            aiInsights:
              "Evaluation failed unexpectedly. Please try submitting again.",
            strengths: [],
            suggestions: ["Retry your submission in a moment."],
          }),
        },
      });
      return NextResponse.json(failed, { status: 201 });
    }
  } catch (err) {
    console.error("Submission error:", err);
    // Best-effort: mark the row FAILED if we created it
    if (submissionId) {
      try {
        await prisma.submission.update({
          where: { id: submissionId },
          data: { status: "FAILED" },
        });
      } catch {
        /* ignore */
      }
    }
    return NextResponse.json(
      { error: "Failed to process submission" },
      { status: 500 }
    );
  }
}

// GET /api/submissions?email=...&problemId=... – list submissions for a user
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email") || "anonymous@example.com";
  const problemId = searchParams.get("problemId");

  try {
    const submissions = await prisma.submission.findMany({
      where: {
        user: { email },
        ...(problemId ? { problemId } : {}),
      },
      include: { problem: { select: { title: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(submissions);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch submissions" },
      { status: 500 }
    );
  }
}
