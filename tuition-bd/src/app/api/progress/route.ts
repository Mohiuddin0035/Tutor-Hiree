import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET: Fetch progress updates for a job
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
    const type = searchParams.get("type"); // CLASS_NOTE, HOMEWORK, EXAM, ATTENDANCE, GENERAL
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    if (!jobId) {
      return new NextResponse("jobId is required", { status: 400 });
    }

    // Verify the user has access to this job (is tutor or parent)
    const job = await prisma.tuitionJob.findUnique({ where: { id: jobId } });
    if (!job) return new NextResponse("Job not found", { status: 404 });

    const isTutor = job.tutorId === user.id;
    const isParent = job.parentId === user.id;
    const isAdmin = user.role === "ADMIN";

    if (!isTutor && !isParent && !isAdmin) {
      return new NextResponse("Access denied", { status: 403 });
    }

    const where: any = { jobId };
    if (type) where.type = type;

    const [updates, total] = await Promise.all([
      prisma.progressUpdate.findMany({
        where,
        include: {
          tutor: { select: { name: true, image: true } },
          comments: {
            include: { guardian: { select: { name: true } } },
            orderBy: { createdAt: "asc" },
          },
          homeworks: true,
        },
        orderBy: { sessionDate: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.progressUpdate.count({ where }),
    ]);

    // Count unseen updates for the guardian
    const unseenCount = isParent
      ? await prisma.progressUpdate.count({ where: { jobId, seen: false } })
      : 0;

    return NextResponse.json({ updates, total, unseenCount, page, limit });
  } catch (error: any) {
    console.error("PROGRESS_GET_ERROR", error);
    return new NextResponse(error?.message || "Internal Server Error", { status: 500 });
  }
}

// POST: Create a new progress update (tutor only)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user || user.role !== "TUTOR") {
      return new NextResponse("Only tutors can post progress updates", { status: 403 });
    }

    const body = await request.json();
    const { jobId, type, title, description, sessionDate, rating, attachmentUrls, homework } = body;

    if (!jobId || !type || !title || !description || !sessionDate) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Validate type
    const validTypes = ["CLASS_NOTE", "HOMEWORK", "EXAM", "ATTENDANCE", "GENERAL"];
    if (!validTypes.includes(type)) {
      return new NextResponse("Invalid update type", { status: 400 });
    }

    // Validate rating
    if (rating !== undefined && rating !== null && (rating < 1 || rating > 5)) {
      return new NextResponse("Rating must be between 1 and 5", { status: 400 });
    }

    // Verify this job is assigned to this tutor
    const job = await prisma.tuitionJob.findUnique({ where: { id: jobId } });
    if (!job) return new NextResponse("Job not found", { status: 404 });
    if (job.tutorId !== user.id) {
      return new NextResponse("You are not assigned to this job", { status: 403 });
    }
    if (job.status !== "ASSIGNED") {
      return new NextResponse("Job is not in ASSIGNED status", { status: 400 });
    }

    // Create the progress update
    const update = await prisma.progressUpdate.create({
      data: {
        jobId,
        tutorId: user.id,
        guardianId: job.parentId,
        type,
        title,
        description,
        sessionDate: new Date(sessionDate),
        rating: rating || null,
        attachmentUrls: attachmentUrls || [],
      },
      include: {
        tutor: { select: { name: true, image: true } },
        comments: true,
        homeworks: true,
      },
    });

    // Optionally create homework if included
    if (homework && homework.title && homework.dueDate) {
      await prisma.homework.create({
        data: {
          jobId,
          tutorId: user.id,
          progressUpdateId: update.id,
          title: homework.title,
          description: homework.description || null,
          subject: homework.subject || job.subject,
          dueDate: new Date(homework.dueDate),
        },
      });
    }

    return NextResponse.json(update, { status: 201 });
  } catch (error: any) {
    console.error("PROGRESS_POST_ERROR", error);
    return new NextResponse(error?.message || "Internal Server Error", { status: 500 });
  }
}

// PATCH: Edit update (tutor, 24h) or mark as seen (guardian)
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return new NextResponse("User not found", { status: 404 });

    const body = await request.json();
    const { updateId, action } = body;

    if (!updateId) return new NextResponse("updateId is required", { status: 400 });

    const update = await prisma.progressUpdate.findUnique({ where: { id: updateId } });
    if (!update) return new NextResponse("Update not found", { status: 404 });

    // Guardian: Mark as seen
    if (action === "mark-seen") {
      if (update.guardianId !== user.id) {
        return new NextResponse("Access denied", { status: 403 });
      }
      const result = await prisma.progressUpdate.update({
        where: { id: updateId },
        data: { seen: true, seenAt: new Date() },
      });
      return NextResponse.json(result);
    }

    // Guardian: Mark all as seen for a job
    if (action === "mark-all-seen") {
      const jobId = body.jobId;
      if (!jobId) return new NextResponse("jobId is required", { status: 400 });

      const job = await prisma.tuitionJob.findUnique({ where: { id: jobId } });
      if (!job || job.parentId !== user.id) {
        return new NextResponse("Access denied", { status: 403 });
      }

      await prisma.progressUpdate.updateMany({
        where: { jobId, guardianId: user.id, seen: false },
        data: { seen: true, seenAt: new Date() },
      });
      return NextResponse.json({ success: true });
    }

    // Tutor: Edit update (within 24h)
    if (action === "edit") {
      if (update.tutorId !== user.id) {
        return new NextResponse("Access denied", { status: 403 });
      }

      const hoursSinceCreation = (Date.now() - update.createdAt.getTime()) / (1000 * 60 * 60);
      if (hoursSinceCreation > 24) {
        return new NextResponse("Updates can only be edited within 24 hours", { status: 400 });
      }

      const { title, description, type, rating, attachmentUrls } = body;
      const result = await prisma.progressUpdate.update({
        where: { id: updateId },
        data: {
          ...(title && { title }),
          ...(description && { description }),
          ...(type && { type }),
          ...(rating !== undefined && { rating }),
          ...(attachmentUrls && { attachmentUrls }),
        },
      });
      return NextResponse.json(result);
    }

    return new NextResponse("Invalid action", { status: 400 });
  } catch (error: any) {
    console.error("PROGRESS_PATCH_ERROR", error);
    return new NextResponse(error?.message || "Internal Server Error", { status: 500 });
  }
}

// DELETE: Delete an update (tutor only, within 24h)
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return new NextResponse("User not found", { status: 404 });

    const { searchParams } = new URL(request.url);
    const updateId = searchParams.get("updateId");

    if (!updateId) return new NextResponse("updateId is required", { status: 400 });

    const update = await prisma.progressUpdate.findUnique({ where: { id: updateId } });
    if (!update) return new NextResponse("Update not found", { status: 404 });

    if (update.tutorId !== user.id) {
      return new NextResponse("Access denied", { status: 403 });
    }

    const hoursSinceCreation = (Date.now() - update.createdAt.getTime()) / (1000 * 60 * 60);
    if (hoursSinceCreation > 24) {
      return new NextResponse("Updates can only be deleted within 24 hours", { status: 400 });
    }

    await prisma.progressUpdate.delete({ where: { id: updateId } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("PROGRESS_DELETE_ERROR", error);
    return new NextResponse(error?.message || "Internal Server Error", { status: 500 });
  }
}
