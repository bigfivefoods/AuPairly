import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";

const MAX_BYTES = 2.5 * 1024 * 1024; // 2.5 MB
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export type UploadResult = { url: string; mime: string; size: number };

/**
 * Persist an uploaded image.
 * - Local / long-lived disk: public/uploads/{userId}/...
 * - Falls back to data URL if filesystem write fails (e.g. some serverless)
 */
export async function saveImageUpload(
  file: File,
  userId: string,
  kind: "avatar" | "cover" | "document" = "avatar"
): Promise<UploadResult> {
  if (!ALLOWED.has(file.type)) {
    throw new Error("Only JPEG, PNG, WebP, or GIF images are allowed.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Image must be under 2.5 MB.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext =
    file.type === "image/png"
      ? "png"
      : file.type === "image/webp"
        ? "webp"
        : file.type === "image/gif"
          ? "gif"
          : "jpg";

  const filename = `${kind}-${Date.now()}-${randomBytes(4).toString("hex")}.${ext}`;
  const relDir = path.join("uploads", userId);
  const absDir = path.join(process.cwd(), "public", relDir);
  const absPath = path.join(absDir, filename);
  const publicUrl = `/${relDir.replace(/\\/g, "/")}/${filename}`;

  try {
    await mkdir(absDir, { recursive: true });
    await writeFile(absPath, buffer);
    return { url: publicUrl, mime: file.type, size: file.size };
  } catch {
    // Serverless fallback: store as data URL (fine for small avatars)
    const b64 = buffer.toString("base64");
    return {
      url: `data:${file.type};base64,${b64}`,
      mime: file.type,
      size: file.size,
    };
  }
}

export async function saveDataUrlImage(
  dataUrl: string,
  userId: string,
  kind: "avatar" | "cover" | "document" = "avatar"
): Promise<UploadResult> {
  const match = /^data:(image\/(?:jpeg|png|webp|gif));base64,(.+)$/i.exec(dataUrl);
  if (!match) throw new Error("Invalid image data URL.");

  const mime = match[1].toLowerCase();
  const buffer = Buffer.from(match[2], "base64");
  if (buffer.length > MAX_BYTES) throw new Error("Image must be under 2.5 MB.");

  const blob = new File([buffer], "upload", { type: mime });
  return saveImageUpload(blob, userId, kind);
}
