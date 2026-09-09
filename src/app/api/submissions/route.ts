import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { EvaluationEngine, getKeywordsForProblem } from "@/lib/evaluation";

// POST /api/submissions – create and evaluate a new submission
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { content, problemId, userName, userEmail } = body;

    if (!content || !problemId) {
      return NextResponse.json(
        { error: "content and problemId are required" },
        { status: 400 }
      );
    }

    const problem = await prisma.problem.findUnique({
      where: { id: problemId },
    });
    if (!problem) {
      return NextResponse.json(
        { error: "Problem not found" },
        { status: 404 }
      );
    }

    // Upsert user by email (use anonymous if not provided)
    const email = userEmail || "anonymous@example.com";
    const name = userName || "Anonymous Learner";

    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, name },
    });

    // Create submission in PENDING state first
    const submission = await prisma.submission.create({
      data: {
        content,
        status: "EVALUATING",
        userId: user.id,
        problemId,
      },
    });

    // Run evaluation engine
    const engine = new EvaluationEngine(process.env.GEMINI_API_KEY);
    const keywords = getKeywordsForProblem(problem.title);
    const result = await engine.evaluate(content, {
      title: problem.title,
      requiredKeywords: keywords,
    });

    // Update submission with results
    const updated = await prisma.submission.update({
      where: { id: submission.id },
      data: {
        status: "COMPLETED",
        score: result.score,
        feedback: result.feedback,
      },
    });

    return NextResponse.json(updated, { status: 201 });
  } catch (err) {
    console.error("Submission error:", err);
    return NextResponse.json(
      { error: "Failed to process submission" },
      { status: 500 }
    );
  }
}

// GET /api/submissions?email=...  – list submissions for a user
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email") || "anonymous@example.com";

  try {
    const submissions = await prisma.submission.findMany({
      where: { user: { email } },
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
