import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

/**
 * Apple Pay domain verification for Paystack.
 * Must be reachable at:
 *   https://www.aupairly.me/.well-known/apple-developer-merchantid-domain-association
 * Content-Type: text/plain (Apple/Paystack reject HTML).
 * No auth. Prefer no redirects (register www if apex → www).
 */
export const dynamic = "force-static";
export const revalidate = false;

export async function GET() {
  try {
    const filePath = path.join(
      process.cwd(),
      "public",
      ".well-known",
      "apple-developer-merchantid-domain-association"
    );
    const body = await readFile(filePath, "utf8");
    return new NextResponse(body.trim(), {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
        // Avoid content negotiation / middleware issues
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
