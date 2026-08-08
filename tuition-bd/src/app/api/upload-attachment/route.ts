import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filename = searchParams.get("filename") || `attachment-${Date.now()}.jpg`;

    if (!request.body) {
      return new NextResponse("Missing file body", { status: 400 });
    }

    const fileBlob = await request.blob();

    // Upload to Catbox (same host as main upload, but skip face detection / HEIC conversion)
    const formData = new FormData();
    formData.append("reqtype", "fileupload");
    formData.append("fileToUpload", fileBlob, filename);

    const postRes = await fetch("https://catbox.moe/user/api.php", {
      method: "POST",
      body: formData,
    });

    if (!postRes.ok) {
      throw new Error(`Catbox upload failed with status: ${postRes.status}`);
    }

    const directUrl = (await postRes.text()).trim();

    if (!directUrl.startsWith("https://files.catbox.moe/")) {
      throw new Error(`Catbox returned an error: ${directUrl}`);
    }

    return NextResponse.json({ url: directUrl });
  } catch (error: any) {
    console.error("ATTACHMENT_UPLOAD_ERROR", error);
    return new NextResponse(error?.message || "Internal Server Error", { status: 500 });
  }
}
