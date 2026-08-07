import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET: Fetch comments for a progress update
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return new NextResponse("User not found", { status: 404 });

    const { searchParams } = new URL(request.url);
    const progressUpdateId = searchParams.get("progressUpdateId");

    if (!progressUpdateId) {
      return new NextResponse("progressUpdateId is required", { status: 400 });
    }

    // Verify access via the progress update's job
    const update = await prisma.progressUpdate.findUnique({
      where: { id: progressUpdateId },
      include: { job: true },
    });
    if (!update) return new NextResponse("Update not found", { status: 404 });

    const isTutor = update.job.tutorId === user.id;
    const isParent = update.job.parentId === user.id;
    const isAdmin = user.role === "ADMIN";

    if (!isTutor && !isParent && !isAdmin) {
      return new NextResponse("Access denied", { status: 403 });
    }

    const comments = await prisma.guardianComment.findMany({
      where: { progressUpdateId },
      include: { guardian: { select: { name: true, image: true } } },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(comments);
  } catch (error: any) {
    console.error("COMMENTS_GET_ERROR", error);
    return new NextResponse(error?.message || "Internal Server Error", { status: 500 });
  }
}

// POST: Guardian posts a comment on a progress update
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user || user.role !== "PARENT") {
      return new NextResponse("Only guardians can comment on progress updates", { status: 403 });
    }

    const body = await request.json();
    const { progressUpdateId, comment } = body;

    if (!progressUpdateId || !comment?.trim()) {
      return new NextResponse("progressUpdateId and comment are required", { status: 400 });
    }

    // Verify this guardian owns the progress update
    const update = await prisma.progressUpdate.findUnique({ where: { id: progressUpdateId } });
    if (!update) return new NextResponse("Update not found", { status: 404 });
    if (update.guardianId !== user.id) {
      return new NextResponse("Access denied", { status: 403 });
    }

    const newComment = await prisma.guardianComment.create({
      data: {
        progressUpdateId,
        guardianId: user.id,
        comment: comment.trim(),
      },
      include: { guardian: { select: { name: true, image: true } } },
    });

    return NextResponse.json(newComment, { status: 201 });
  } catch (error: any) {
    console.error("COMMENTS_POST_ERROR", error);
    return new NextResponse(error?.message || "Internal Server Error", { status: 500 });
  }
}
