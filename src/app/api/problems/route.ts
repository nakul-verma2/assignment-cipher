import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const problems = await prisma.problem.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        title: true,
        description: true,
        requirements: true,
        createdAt: true,
        _count: { select: { submissions: true } },
      },
    });
    return NextResponse.json(problems);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch problems" },
      { status: 500 }
    );
  }
}
