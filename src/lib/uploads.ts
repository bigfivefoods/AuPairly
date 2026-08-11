import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB images/docs
const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50 MB intro videos
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const DOC_TYPES = new Set([
  ...IMAGE_TYPES,
  "application/pdf",
]);
const VIDEO_TYPES = new Set([
  "video/webm",
  "video/mp4",
  "video/quicktime",
  "video/x-matroska",
]);

export type UploadResult = { url: string; mime: string; size: number; path?: string };

export type UploadKind = "avatar" | "cover" | "document" | "gallery" | "video";

/**
 * Upload to Supabase Storage when configured; else local public/uploads or data URL.
 * Bucket: `aupairly` (create in Supabase Dashboard → Storage, public read recommended for avatars).
 */
export async function saveImageUpload(
  file: File,
  userId: string,
  kind: UploadKind = "avatar"
): Promise<UploadResult> {
  const allowDocs = kind === "document";
  const allowVideo = kind === "video";
  const allowed = allowVideo
    ? VIDEO_TYPES
    : allowDocs
      ? DOC_TYPES
      : IMAGE_TYPES;
  if (!allowed.has(file.type)) {
    throw new Error(
      allowVideo
        ? "Only MP4, WebM, or QuickTime videos are allowed."
        : allowDocs
          ? "Only images or PDF documents are allowed."
          : "Only JPEG, PNG, WebP, or GIF images are allowed."
    );
  }
  const max = allowVideo ? MAX_VIDEO_BYTES : MAX_BYTES;
  if (file.size > max) {
    throw new Error(
      allowVideo ? "Video must be under 50 MB." : "File must be under 5 MB."
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = extensionFor(file.type, kind);
  const filename = `${kind}-${Date.now()}-${randomBytes(4).toString("hex")}.${ext}`;
  const objectPath = `${userId}/${filename}`;

  // Prefer Supabase Storage
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const supabase = createServerSupabaseClient();
      const bucket = process.env.SUPABASE_STORAGE_BUCKET || "aupairly";
      const { error } = await supabase.storage.from(bucket).upload(objectPath, buffer, {
        contentType: file.type,
        upsert: true,
      });
      if (error) {
        // Try create bucket then retry once
        if (error.message?.includes("not found") || error.message?.includes("Bucket")) {
          await supabase.storage.createBucket(bucket, { public: true });
          const retry = await supabase.storage.from(bucket).upload(objectPath, buffer, {
            contentType: file.type,
            upsert: true,
          });
          if (retry.error) throw retry.error;
        } else {
          throw error;
        }
      }
      const { data } = supabase.storage.from(bucket).getPublicUrl(objectPath);
      return { url: data.publicUrl, mime: file.type, size: file.size, path: objectPath };
    } catch (e) {
      console.warn("[upload] Supabase Storage failed, falling back:", e);
    }
  }

  // Local disk fallback
  const relDir = path.join("uploads", userId);
  const absDir = path.join(process.cwd(), "public", relDir);
  const absPath = path.join(absDir, filename);
  const publicUrl = `/${relDir.replace(/\\/g, "/")}/${filename}`;

  try {
    await mkdir(absDir, { recursive: true });
    await writeFile(absPath, buffer);
    return { url: publicUrl, mime: file.type, size: file.size, path: objectPath };
  } catch {
    const b64 = buffer.toString("base64");
    return {
      url: `data:${file.type};base64,${b64}`,
      mime: file.type,
      size: file.size,
    };
  }
}

function extensionFor(mime: string, kind?: UploadKind) {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  if (mime === "application/pdf") return "pdf";
  if (mime === "video/webm" || mime.includes("webm")) return "webm";
  if (mime === "video/mp4") return "mp4";
  if (mime === "video/quicktime") return "mov";
  if (kind === "video") return "webm";
  return "jpg";
}
