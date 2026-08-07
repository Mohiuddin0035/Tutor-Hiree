import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");

    if (role !== "TUTOR") {
      return new NextResponse("Invalid Request", { status: 400 });
    }

    const tutors = await prisma.user.findMany({
      where: {
        role: "TUTOR",
        profile: {
          verificationStatus: "VERIFIED",
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        profile: true,
        appliedJobs: {
          where: {
            status: {
              in: ["ASSIGNED", "COMPLETED"],
            },
          },
          select: {
            id: true,
          },
        },
        receivedReviews: {
          select: {
            rating: true,
            comment: true,
            createdAt: true,
            author: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    const sanitizedTutors = tutors.map((tutor) => ({
      ...tutor,
      // Show name and education details for guardians to browse
      // Phone and address are hidden until commission is paid
      profile: tutor.profile ? {
        ...tutor.profile,
        phone: "•••••••••••",
        address: "•••••••••••",
        nidImageUrl: null, // Keep NID private
      } : null,
      receivedReviews: tutor.receivedReviews.map((review) => ({
        ...review,
        author: {
          name: "Anonymous Parent"
        }
      }))
    }));

    return NextResponse.json(sanitizedTutors);
  } catch (error) {
    console.error("GET_USERS_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
