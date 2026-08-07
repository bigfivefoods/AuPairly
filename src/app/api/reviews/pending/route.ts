import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPendingReviewsForUser } from "@/lib/pending-reviews";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pending = await getPendingReviewsForUser(session.user.id);
  return NextResponse.json({ pending });
}
