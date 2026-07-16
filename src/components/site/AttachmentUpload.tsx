import { useRef } from "react";
import { Paperclip, X, FileImage } from "lucide-react";
import type { CartAttachment } from "@/lib/cart";
import { toast } from "sonner";

const MAX_PREVIEW_BYTES = 2 * 1024 * 1024; // 2MB inline preview
const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25MB hard cap

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

async function toDataUrl(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = () => rej(r.error);
    r.readAsDataURL(file);
  });
}

export function AttachmentUpload({
  label,
  accept,
  value,
  onChange,
  helper,
}: {
  label: string;
  accept?: string;
  value?: CartAttachment;
  onChange: (a: CartAttachment | undefined) => void;
  helper?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const onFile = async (file: File) => {
    if (file.size > MAX_FILE_BYTES) {
      toast.error("File too large", { description: `Max ${formatBytes(MAX_FILE_BYTES)}.` });
      return;
    }
    const isImage = file.type.startsWith("image/");
    let dataUrl: string | undefined;
    if (isImage && file.size <= MAX_PREVIEW_BYTES) {
      try { dataUrl = await toDataUrl(file); } catch {}
    }
    onChange({ name: file.name, size: file.size, type: file.type, dataUrl });
  };

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-widest">{label}</span>
        {value && (
          <button
            type="button"
            onClick={() => { onChange(undefined); if (inputRef.current) inputRef.current.value = ""; }}
            className="text-xs text-muted-foreground hover:text-destructive"
          >
            Remove
          </button>
        )}
      </div>

      {value ? (
        <div className="flex items-center gap-3 rounded-md border-2 border-ink bg-cream p-2">
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded border-2 border-ink bg-white">
            {value.dataUrl ? (
              <img src={value.dataUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-ink/60">
                <FileImage className="h-6 w-6" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 text-sm">
            <div className="truncate font-semibold">{value.name}</div>
            <div className="text-xs text-muted-foreground">{formatBytes(value.size)}</div>
          </div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="rounded-md border-2 border-ink px-3 py-1 text-xs font-bold hover:bg-yellow"
          >
            Replace
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-md border-2 border-dashed border-ink/60 bg-cream/50 px-3 py-4 text-sm font-semibold text-ink/70 hover:border-magenta hover:text-magenta"
        >
          <Paperclip className="h-4 w-4" /> Upload {label.toLowerCase()}
        </button>
      )}

      {helper && <p className="mt-1 text-xs text-muted-foreground">{helper}</p>}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
      />
    </div>
  );
}
