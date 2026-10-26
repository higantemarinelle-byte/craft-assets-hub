// Shared, clearly visible file chooser for Craft Studio asset uploads.
// Click, keyboard or drag-and-drop; previews the chosen image.

import { useEffect, useId, useState } from "react";
import { ImagePlus } from "lucide-react";
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from "@/lib/storefront/assets";

/** Returns an error message for an invalid file, or null when acceptable. */
export function validateAssetFile(file: { type: string; size: number }): string | null {
  if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(file.type)) {
    return "Unsupported file type. Use PNG, JPG, WEBP, GIF or AVIF.";
  }
  if (file.size > MAX_FILE_SIZE_BYTES) return "File is larger than 15 MB.";
  return null;
}

function formatSize(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function AssetFileDropzone({
  file,
  onChange,
}: {
  file: File | null;
  onChange: (file: File | null, error: string | null) => void;
}) {
  const id = useId();
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!file) { setPreview(null); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const pick = (f: File | null | undefined) => {
    if (!f) return;
    const err = validateAssetFile(f);
    onChange(err ? null : f, err);
  };

  return (
    <div>
      <input
        id={id}
        type="file"
        accept={ALLOWED_MIME_TYPES.join(",")}
        className="sr-only"
        onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }}
      />
      {file ? (
        <div className="flex items-center gap-3 rounded-md border-2 border-ink/20 p-3">
          {preview && <img src={preview} alt="" className="h-16 w-16 rounded object-cover" />}
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{file.name}</div>
            <div className="text-xs text-muted-foreground">{formatSize(file.size)}</div>
          </div>
          <label htmlFor={id} className="cursor-pointer text-sm font-semibold underline">Change file</label>
        </div>
      ) : (
        <label
          htmlFor={id}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") { e.preventDefault(); document.getElementById(id)?.click(); }
          }}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); pick(e.dataTransfer.files?.[0]); }}
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed p-8 text-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            dragging ? "border-primary bg-muted" : "border-ink/40 hover:bg-muted/60"
          }`}
        >
          <ImagePlus className="h-8 w-8 text-muted-foreground" />
          <span className="text-sm font-semibold">Click to choose an image or drag it here</span>
          <span className="text-xs text-muted-foreground">PNG, JPG, WEBP, GIF or AVIF · up to 15 MB</span>
        </label>
      )}
    </div>
  );
}
