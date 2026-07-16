// Reusable Media Picker for Craft Studio. Used by any editor that stores an
// Asset ID (logo, hero, gallery, section images, etc.).
//
// Consumers:
//   <MediaPicker value={value} onChange={setValue}>
//     <Button>Choose image</Button>
//   </MediaPicker>
//
// The picker exposes two tabs:
//   - Library: pick from existing craft_assets rows
//   - Upload: upload a new file (reserves an asset row, then uploads to
//     Supabase Storage via the user-session client — RLS enforces owner-only)

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn as useServerFnRouter } from "@tanstack/react-start";
import { Loader2, Upload, X } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import {
  adminListAssets,
  adminReserveAssetUpload,
} from "@/lib/storefront/assets.functions";
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  readImageDimensions,
  resolvePublicUrl,
  type AssetPickerValue,
  type CraftAsset,
} from "@/lib/storefront/assets";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Props = {
  value?: AssetPickerValue | null;
  onChange: (value: AssetPickerValue | null) => void;
  children?: React.ReactNode;
  triggerLabel?: string;
};

export function MediaPicker({ value, onChange, children, triggerLabel = "Choose image" }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-2">
      {value?.url ? (
        <div className="flex items-center gap-3 rounded border border-border p-2">
          <img
            src={value.url}
            alt={value.alt ?? ""}
            className="h-16 w-16 rounded object-cover"
          />
          <div className="flex-1 text-xs text-muted-foreground truncate">
            <div className="font-mono">{value.assetId}</div>
            {value.width && value.height ? (
              <div>{value.width} × {value.height}</div>
            ) : null}
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : null}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {children ?? (
            <Button type="button" variant="outline" size="sm">
              {triggerLabel}
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Media library</DialogTitle>
          </DialogHeader>
          <PickerBody
            onPick={(v) => {
              onChange(v);
              setOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PickerBody({ onPick }: { onPick: (v: AssetPickerValue) => void }) {
  const [search, setSearch] = useState("");
  const listFn = useServerFnRouter(adminListAssets);
  const query = useQuery({
    queryKey: ["craft-assets", { search }],
    queryFn: () => listFn({ data: { search: search || undefined, status: "active" as const } }),
  });

  return (
    <Tabs defaultValue="library" className="w-full">
      <TabsList>
        <TabsTrigger value="library">Library</TabsTrigger>
        <TabsTrigger value="upload">Upload</TabsTrigger>
      </TabsList>
      <TabsContent value="library" className="space-y-3">
        <Input
          placeholder="Search by name or filename…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {query.isLoading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : query.error ? (
          <div className="text-sm text-destructive">Failed to load assets.</div>
        ) : (
          <AssetGrid
            assets={(query.data?.assets ?? []) as (CraftAsset & { url: string })[]}
            onPick={onPick}
          />
        )}
      </TabsContent>
      <TabsContent value="upload">
        <UploadPanel onUploaded={onPick} />
      </TabsContent>
    </Tabs>
  );
}

function AssetGrid({
  assets,
  onPick,
}: {
  assets: (CraftAsset & { url: string })[];
  onPick: (v: AssetPickerValue) => void;
}) {
  if (assets.length === 0) {
    return <div className="py-8 text-center text-sm text-muted-foreground">No assets yet. Upload one to get started.</div>;
  }
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
      {assets.map((a) => (
        <button
          key={a.id}
          type="button"
          className="group relative aspect-square overflow-hidden rounded border border-border transition hover:border-primary"
          onClick={() =>
            onPick({
              assetId: a.id,
              url: a.url,
              alt: a.alt_text ?? null,
              width: a.width ?? null,
              height: a.height ?? null,
            })
          }
          title={a.name}
        >
          <img src={a.url} alt={a.alt_text ?? ""} className="h-full w-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 truncate bg-black/60 px-1 py-0.5 text-[10px] text-white opacity-0 group-hover:opacity-100">
            {a.name}
          </div>
        </button>
      ))}
    </div>
  );
}

function UploadPanel({ onUploaded }: { onUploaded: (v: AssetPickerValue) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [alt, setAlt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const reserveFn = useServerFnRouter(adminReserveAssetUpload);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Choose a file.");
      if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(file.type)) {
        throw new Error("Unsupported file type.");
      }
      if (file.size > MAX_FILE_SIZE_BYTES) throw new Error("File exceeds 15 MB.");
      const dims = await readImageDimensions(file);
      const reserved = await reserveFn({
        data: {
          name: name.trim() || file.name,
          filename: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
          width: dims?.width ?? null,
          height: dims?.height ?? null,
          altText: alt.trim() || null,
        },
      });
      const { error: upErr } = await supabase.storage
        .from(reserved.bucket)
        .upload(reserved.path, file, { contentType: file.type, upsert: false });
      if (upErr) throw new Error(upErr.message);
      const url = resolvePublicUrl(reserved.bucket, reserved.path);
      onUploaded({
        assetId: reserved.asset.id,
        url,
        alt: reserved.asset.alt_text,
        width: reserved.asset.width,
        height: reserved.asset.height,
      });
      queryClient.invalidateQueries({ queryKey: ["craft-assets"] });
    },
    onError: (e: any) => setError(e?.message ?? "Upload failed"),
  });

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-semibold">File</label>
        <input
          type="file"
          accept={ALLOWED_MIME_TYPES.join(",")}
          className="mt-1 block w-full text-sm"
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            setFile(f);
            if (f && !name) setName(f.name.replace(/\.[^.]+$/, ""));
          }}
        />
      </div>
      <div>
        <label className="text-xs font-semibold">Name</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Display name" />
      </div>
      <div>
        <label className="text-xs font-semibold">Alt text</label>
        <Input value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="Describe the image for accessibility" />
      </div>
      {error ? <div className="text-sm text-destructive">{error}</div> : null}
      <Button
        type="button"
        onClick={() => {
          setError(null);
          mutation.mutate();
        }}
        disabled={!file || mutation.isPending}
      >
        {mutation.isPending ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading…</>
        ) : (
          <><Upload className="mr-2 h-4 w-4" /> Upload</>
        )}
      </Button>
    </div>
  );
}
