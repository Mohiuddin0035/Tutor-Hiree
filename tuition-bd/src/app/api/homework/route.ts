import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET: Fetch homework for a job
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return new NextResponse("User not found", { status: 404 });

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");
    const status = searchParams.get("status"); // ASSIGNED, COMPLETED, OVERDUE

    if (!jobId) return new NextResponse("jobId is required", { status: 400 });

    // Verify access
    const job = await prisma.tuitionJob.findUnique({ where: { id: jobId } });
    if (!job) return new NextResponse("Job not found", { status: 404 });

    const isTutor = job.tutorId === user.id;
    const isParent = job.parentId === user.id;
    const isAdmin = user.role === "ADMIN";

    if (!isTutor && !isParent && !isAdmin) {
      return new NextResponse("Access denied", { status: 403 });
    }

    const where: any = { jobId };
    if (status) where.status = status;

    const homeworks = await prisma.homework.findMany({
      where,
      include: {
        tutor: { select: { name: true } },
      },
      orderBy: { dueDate: "desc" },
    });

    // Auto-detect overdue items
    const now = new Date();
    const overdueIds: string[] = [];
    for (const hw of homeworks) {
      if (hw.status === "ASSIGNED" && new Date(hw.dueDate) < now) {
        overdueIds.push(hw.id);
      }
    }

    // Batch update overdue items
    if (overdueIds.length > 0) {
      await prisma.homework.updateMany({
        where: { id: { in: overdueIds } },
        data: { status: "OVERDUE" },
      });
      // Reflect in response
      for (const hw of homeworks) {
        if (overdueIds.includes(hw.id)) {
          hw.status = "OVERDUE";
        }
      }
    }

    // Compute summary stats
    const total = homeworks.length;
    const completed = homeworks.filter((h) => h.status === "COMPLETED").length;
    const overdue = homeworks.filter((h) => h.status === "OVERDUE").length;
    const assigned = homeworks.filter((h) => h.status === "ASSIGNED").length;

    return NextResponse.json({ homeworks, stats: { total, completed, overdue, assigned } });
  } catch (error: any) {
    console.error("HOMEWORK_GET_ERROR", error);
    return new NextResponse(error?.message || "Internal Server Error", { status: 500 });
  }
}

// POST: Create standalone homework (tutor only)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user || user.role !== "TUTOR") {
      return new NextResponse("Only tutors can assign homework", { status: 403 });
    }

    const body = await request.json();
    const { jobId, title, description, subject, dueDate } = body;

    if (!jobId || !title || !dueDate) {
      return new NextResponse("Missing required fields (jobId, title, dueDate)", { status: 400 });
    }

    // Verify assignment
    const job = await prisma.tuitionJob.findUnique({ where: { id: jobId } });
    if (!job) return new NextResponse("Job not found", { status: 404 });
    if (job.tutorId !== user.id) {
      return new NextResponse("You are not assigned to this job", { status: 403 });
    }

    const homework = await prisma.homework.create({
      data: {
        jobId,
        tutorId: user.id,
        title,
        description: description || null,
        subject: subject || job.subject,
        dueDate: new Date(dueDate),
      },
    });

    return NextResponse.json(homework, { status: 201 });
  } catch (error: any) {
    console.error("HOMEWORK_POST_ERROR", error);
    return new NextResponse(error?.message || "Internal Server Error", { status: 500 });
  }
}

// PATCH: Update homework status (tutor only)
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user || user.role !== "TUTOR") {
      return new NextResponse("Only tutors can update homework", { status: 403 });
    }

    const body = await request.json();
    const { homeworkId, status, tutorRemarks } = body;

    if (!homeworkId) return new NextResponse("homeworkId is required", { status: 400 });

    const homework = await prisma.homework.findUnique({ where: { id: homeworkId } });
    if (!homework) return new NextResponse("Homework not found", { status: 404 });
    if (homework.tutorId !== user.id) {
      return new NextResponse("Access denied", { status: 403 });
    }

    const validStatuses = ["ASSIGNED", "COMPLETED", "OVERDUE", "CANCELLED"];
    if (status && !validStatuses.includes(status)) {
      return new NextResponse("Invalid status", { status: 400 });
    }

    const data: any = {};
    if (status) {
      data.status = status;
      if (status === "COMPLETED") data.completedAt = new Date();
    }
    if (tutorRemarks !== undefined) data.tutorRemarks = tutorRemarks;

    const result = await prisma.homework.update({
      where: { id: homeworkId },
      data,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("HOMEWORK_PATCH_ERROR", error);
    return new NextResponse(error?.message || "Internal Server Error", { status: 500 });
  }
}
