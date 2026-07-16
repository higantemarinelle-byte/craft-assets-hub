// Client-safe types + pure helpers for Craft Studio assets.
// Uploads happen from the browser using the user-session Supabase client.
// RLS on storage.objects + the craft_assets tables enforce owner-only writes.

export const CRAFT_ASSETS_BUCKET = "craft-studio-assets";

export const ALLOWED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/avif",
] as const;
export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

export const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB

export type AssetStatus = "active" | "archived";
export type UsageScope = "draft" | "published";
export type AssetSourceType =
  | "theme"
  | "homepage_section"
  | "navigation"
  | "footer"
  | "gallery"
  | "campaign"
  | "product"
  | "other";

export type CraftAssetCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type CraftAssetFolder = {
  id: string;
  name: string;
  parent_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type CraftAsset = {
  id: string;
  name: string;
  original_filename: string;
  bucket: string;
  storage_path: string;
  mime_type: string;
  size_bytes: number | null;
  width: number | null;
  height: number | null;
  alt_text: string | null;
  category_id: string | null;
  folder_id: string | null;
  tags: string[];
  status: AssetStatus;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
  /** Resolved public URL (not stored). */
  url?: string;
};

export type CraftAssetUsage = {
  id: string;
  asset_id: string;
  source_type: AssetSourceType;
  source_id: string | null;
  field_path: string;
  usage_scope: UsageScope;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

/** Value returned by the MediaPicker. Consumers store `assetId`, keep `url`
 *  as a convenience for immediate rendering. */
export type AssetPickerValue = {
  assetId: string;
  url: string;
  alt: string | null;
  width: number | null;
  height: number | null;
};

export type AssetUploadInput = {
  name: string;
  categoryId?: string | null;
  folderId?: string | null;
  altText?: string | null;
  tags?: string[];
};

export type AssetUpdateInput = {
  id: string;
  name?: string;
  altText?: string | null;
  categoryId?: string | null;
  folderId?: string | null;
  tags?: string[];
};

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

export function isAllowedMimeType(mime: string): mime is AllowedMimeType {
  return (ALLOWED_MIME_TYPES as readonly string[]).includes(mime);
}

export function validateMimeType(mime: string): void {
  if (!isAllowedMimeType(mime)) {
    throw new Error(
      `File type "${mime}" is not allowed. Supported: PNG, JPEG, WebP, GIF, AVIF.`,
    );
  }
}

export function validateFileSize(size: number): void {
  if (!Number.isFinite(size) || size <= 0) throw new Error("File is empty.");
  if (size > MAX_FILE_SIZE_BYTES) {
    throw new Error(`File exceeds ${Math.round(MAX_FILE_SIZE_BYTES / (1024 * 1024))} MB.`);
  }
}

export function sanitizeFilename(filename: string): string {
  const trimmed = filename.trim().toLowerCase();
  const dot = trimmed.lastIndexOf(".");
  const base = dot > 0 ? trimmed.slice(0, dot) : trimmed;
  const ext = dot > 0 ? trimmed.slice(dot + 1) : "";
  const safeBase = base
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "asset";
  const safeExt = ext.replace(/[^a-z0-9]/g, "").slice(0, 8) || "bin";
  return `${safeBase}.${safeExt}`;
}

export function buildStoragePath(ownerId: string, assetId: string, filename: string): string {
  return `${ownerId}/${assetId}/${sanitizeFilename(filename)}`;
}

/** Browser-only helper — read image dimensions from a File. */
export async function readImageDimensions(
  file: File,
): Promise<{ width: number; height: number } | null> {
  if (typeof window === "undefined") return null;
  if (!file.type.startsWith("image/")) return null;
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const dims = { width: img.naturalWidth, height: img.naturalHeight };
      URL.revokeObjectURL(url);
      resolve(dims);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

/** Build the public URL for a Supabase Storage object without a network call. */
export function resolvePublicUrl(bucket: string, path: string): string {
  const base =
    (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_SUPABASE_URL) ||
    (typeof process !== "undefined" && process.env?.SUPABASE_URL) ||
    "";
  if (!base) return "";
  return `${base.replace(/\/$/, "")}/storage/v1/object/public/${bucket}/${path}`;
}

export function assetPublicUrl(asset: Pick<CraftAsset, "bucket" | "storage_path">): string {
  return resolvePublicUrl(asset.bucket, asset.storage_path);
}