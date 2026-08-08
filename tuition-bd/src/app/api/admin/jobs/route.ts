import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const jobs = await prisma.tuitionJob.findMany({
      include: {
        parent: {
          select: {
            name: true,
            email: true,
            profile: {
              select: {
                phone: true,
              }
            }
          }
        },
        tutor: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: {
              select: {
                tutorSeq: true,
                phone: true,
              }
            }
          }
        },
        payments: {
          select: {
            id: true,
            amount: true,
            status: true,
            type: true,
            trxId: true,
            tutorId: true,
            payerRole: true,
            refundRequestedAt: true,
            refundStatus: true,
            refundReason: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "desc"
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      },
    });

    // Compute progress counts per job
    const jobIds = jobs.map((j: any) => j.id);
    
    const progressCounts = await prisma.progressUpdate.groupBy({
      by: ["jobId"],
      where: { jobId: { in: jobIds } },
      _count: { id: true },
    });
    
    const countMap: Record<string, number> = {};
    for (const pc of progressCounts) {
      countMap[pc.jobId] = pc._count.id;
    }

    // Attach latest update info per job
    const latestUpdates = await prisma.progressUpdate.findMany({
      where: { jobId: { in: jobIds } },
      orderBy: { createdAt: "desc" },
      distinct: ["jobId"],
      select: { jobId: true, createdAt: true, seen: true, type: true },
    });

    const latestMap: Record<string, any> = {};
    for (const u of latestUpdates) {
      latestMap[u.jobId] = u;
    }

    const enriched = jobs.map((j: any) => ({
      ...j,
      progressCount: countMap[j.id] || 0,
      lastProgressUpdate: latestMap[j.id] || null,
    }));

    return NextResponse.json(enriched);
  } catch (error) {
    console.error("ADMIN_GET_JOBS_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { jobId, action, tutorId, tutorRequirement } = body;

    if (!jobId) {
      return new NextResponse("Missing jobId", { status: 400 });
    }

    if (action === "assign") {
      if (!tutorId) {
        return new NextResponse("Missing tutorId", { status: 400 });
      }

      // Manually set status as ASSIGNED, keeping locationUnlocked = false (until matching payment is cleared)
      const updatedJob = await prisma.tuitionJob.update({
        where: { id: jobId },
        data: {
          status: "ASSIGNED",
          tutorId: tutorId,
          locationUnlocked: false
        }
      });

      return NextResponse.json({ updatedJob, message: "Tutor assigned manually (Pay Later)." });
    }

    if (action === "release") {
      const updatedJob = await prisma.tuitionJob.update({
        where: { id: jobId },
        data: {
          tutorDetailsReleased: true
        }
      });

      return NextResponse.json({ updatedJob, message: "Tutor details released successfully." });
    }

    if (action === "approve") {
      const updatedJob = await prisma.tuitionJob.update({
        where: { id: jobId },
        data: {
          status: "OPEN",
          tutorRequirement: tutorRequirement !== undefined ? tutorRequirement : undefined
        }
      });

      return NextResponse.json({ updatedJob, message: "Tuition post approved successfully." });
    }

    if (action === "updateRequirement") {
      const updatedJob = await prisma.tuitionJob.update({
        where: { id: jobId },
        data: {
          tutorRequirement: tutorRequirement !== undefined ? tutorRequirement : undefined
        }
      });

      return NextResponse.json({ updatedJob, message: "Tutor requirement updated successfully." });
    }

    if (action === "approve-refund") {
      const { paymentId } = body;
      if (!paymentId) {
        return new NextResponse("Missing paymentId", { status: 400 });
      }

      // Update payment refund status
      const payment = await prisma.payment.update({
        where: { id: paymentId },
        data: {
          refundStatus: "APPROVED",
          status: "FAILED", // Mark original payment as failed/refunded
        }
      });

      // Revert the unlock on the job
      await prisma.tuitionJob.update({
        where: { id: jobId },
        data: {
          commissionPaid: false,
          locationUnlocked: false,
          tutorDetailsReleased: false,
        }
      });

      return NextResponse.json({ payment, message: "Refund approved. Details re-locked." });
    }

    if (action === "reject-refund") {
      const { paymentId } = body;
      if (!paymentId) {
        return new NextResponse("Missing paymentId", { status: 400 });
      }

      const payment = await prisma.payment.update({
        where: { id: paymentId },
        data: {
          refundStatus: "REJECTED",
        }
      });

      return NextResponse.json({ payment, message: "Refund request rejected." });
    }

    if (action === "verify-payment") {
      // Admin manually verifies a payment and unlocks details
      const updatedJob = await prisma.tuitionJob.update({
        where: { id: jobId },
        data: {
          commissionPaid: true,
          locationUnlocked: true,
          tutorDetailsReleased: true,
        }
      });

      return NextResponse.json({ updatedJob, message: "Payment verified and details unlocked." });
    }

    return new NextResponse("Invalid action", { status: 400 });
  } catch (error) {
    console.error("ADMIN_PATCH_JOBS_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");

    if (!jobId) {
      return new NextResponse("Missing jobId", { status: 400 });
    }

    await prisma.tuitionJob.delete({
      where: { id: jobId }
    });

    return NextResponse.json({ success: true, message: "Job post deleted successfully." });
  } catch (error) {
    console.error("ADMIN_DELETE_JOB_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
