// Craft Studio → Asset Manager. Owner-only. Full CRUD-ish surface: list,
// filter by status, upload, edit metadata, archive/restore, delete when unused.

import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Archive, ArchiveRestore, Loader2, Trash2, Upload } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { isOwnerUser } from "@/lib/permissions";
import {
  adminArchiveAsset,
  adminDeleteAsset,
  adminGetAssetUsage,
  adminListAssets,
  adminReserveAssetUpload,
  adminRestoreAsset,
  adminUpdateAsset,
  adminListCategories,
} from "@/lib/storefront/assets.functions";
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  readImageDimensions,
  type CraftAsset,
  type CraftAssetCategory,
} from "@/lib/storefront/assets";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/portal-admin/craft-studio/assets")({
  ssr: false,
  head: () => ({
    meta: [{ title: "Assets — Craft Studio" }, { name: "robots", content: "noindex" }],
  }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!isOwnerUser(data.user)) throw redirect({ to: "/portal-admin" });
  },
  component: AssetsPage,
});

function AssetsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"active" | "archived">("active");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [selected, setSelected] = useState<CraftAsset | null>(null);

  const listFn = useServerFn(adminListAssets);
  const catsFn = useServerFn(adminListCategories);

  const cats = useQuery({
    queryKey: ["craft-asset-categories"],
    queryFn: () => catsFn({}),
  });

  const list = useQuery({
    queryKey: ["craft-assets", { search, status, categoryId }],
    queryFn: () =>
      listFn({ data: { search: search || undefined, status, categoryId } }),
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-display text-3xl">Assets</h1>
          <p className="text-sm text-muted-foreground">
            Media library for logos, hero images, gallery, campaigns, and more. Reference by Asset ID everywhere.
          </p>
        </div>
        <UploadButton onUploaded={() => list.refetch()} />
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={status} onValueChange={(v) => setStatus(v as "active" | "archived")}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryId ?? "__all__"} onValueChange={(v) => setCategoryId(v === "__all__" ? null : v)}>
          <SelectTrigger className="w-56"><SelectValue placeholder="All categories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All categories</SelectItem>
            {((cats.data?.categories ?? []) as CraftAssetCategory[]).map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {list.isLoading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : list.error ? (
        <div className="rounded border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          Failed to load assets. Have you applied the 004C migration? See <code>docs/migrations/004C_craft_studio_assets.sql</code>.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {((list.data?.assets ?? []) as (CraftAsset & { url: string })[]).map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setSelected(a)}
              className="group relative aspect-square overflow-hidden rounded border border-border text-left transition hover:border-primary"
            >
              <img src={a.url} alt={a.alt_text ?? ""} className="h-full w-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 bg-black/60 px-2 py-1 text-[11px] text-white">
                <div className="truncate">{a.name}</div>
                {a.status === "archived" ? <Badge variant="secondary" className="mt-1">Archived</Badge> : null}
              </div>
            </button>
          ))}
          {list.data?.assets?.length === 0 ? (
            <div className="col-span-full py-12 text-center text-sm text-muted-foreground">
              No assets found. Upload one to get started.
            </div>
          ) : null}
        </div>
      )}

      <AssetDrawer asset={selected} onClose={() => setSelected(null)} onChanged={() => list.refetch()} />
    </div>
  );
}

function UploadButton({ onUploaded }: { onUploaded: () => void }) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [alt, setAlt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const reserveFn = useServerFn(adminReserveAssetUpload);

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
      setOpen(false);
      setFile(null);
      setName("");
      setAlt("");
      onUploaded();
    },
    onError: (e: any) => setError(e?.message ?? "Upload failed"),
  });

  return (
    <>
      <Button onClick={() => setOpen(true)}><Upload className="mr-2 h-4 w-4" /> Upload asset</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Upload asset</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <input
              type="file"
              accept={ALLOWED_MIME_TYPES.join(",")}
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                setFile(f);
                if (f && !name) setName(f.name.replace(/\.[^.]+$/, ""));
              }}
            />
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
            <Input value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="Alt text" />
            {error ? <div className="text-sm text-destructive">{error}</div> : null}
            <Button onClick={() => { setError(null); mutation.mutate(); }} disabled={!file || mutation.isPending}>
              {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Upload
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function AssetDrawer({
  asset,
  onClose,
  onChanged,
}: {
  asset: CraftAsset | null;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [name, setName] = useState("");
  const [alt, setAlt] = useState("");
  const qc = useQueryClient();
  const updateFn = useServerFn(adminUpdateAsset);
  const archiveFn = useServerFn(adminArchiveAsset);
  const restoreFn = useServerFn(adminRestoreAsset);
  const deleteFn = useServerFn(adminDeleteAsset);
  const usageFn = useServerFn(adminGetAssetUsage);

  const usage = useQuery({
    queryKey: ["craft-asset-usage", asset?.id],
    queryFn: () => usageFn({ data: { id: asset!.id } }),
    enabled: !!asset,
  });

  const open = !!asset;
  const url = asset ? (asset as any).url ?? "" : "";

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Asset details</DialogTitle></DialogHeader>
        {asset ? (
          <div className="grid gap-4 md:grid-cols-[200px_1fr]">
            <img src={url} alt={asset.alt_text ?? ""} className="h-48 w-48 rounded object-cover" />
            <div className="space-y-3 text-sm">
              <div>
                <label className="text-xs font-semibold">Name</label>
                <Input defaultValue={asset.name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold">Alt text</label>
                <Input defaultValue={asset.alt_text ?? ""} onChange={(e) => setAlt(e.target.value)} />
              </div>
              <div className="text-xs text-muted-foreground">
                <div><span className="font-semibold">ID:</span> <span className="font-mono">{asset.id}</span></div>
                <div><span className="font-semibold">Filename:</span> {asset.original_filename}</div>
                <div><span className="font-semibold">Type:</span> {asset.mime_type}</div>
                <div>
                  <span className="font-semibold">Usage:</span>{" "}
                  {usage.isLoading ? "…" : `${(usage.data?.usages ?? []).length} reference(s)`}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                <Button
                  size="sm"
                  onClick={async () => {
                    await updateFn({ data: { id: asset.id, name: name || undefined, altText: alt || null } });
                    qc.invalidateQueries({ queryKey: ["craft-assets"] });
                    onChanged();
                    onClose();
                  }}
                >
                  Save
                </Button>
                {asset.status === "active" ? (
                  <Button size="sm" variant="outline" onClick={async () => {
                    await archiveFn({ data: { id: asset.id } });
                    onChanged();
                    onClose();
                  }}>
                    <Archive className="mr-2 h-4 w-4" /> Archive
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" onClick={async () => {
                    await restoreFn({ data: { id: asset.id } });
                    onChanged();
                    onClose();
                  }}>
                    <ArchiveRestore className="mr-2 h-4 w-4" /> Restore
                  </Button>
                )}
                <Button size="sm" variant="destructive" onClick={async () => {
                  try {
                    await deleteFn({ data: { id: asset.id } });
                    onChanged();
                    onClose();
                  } catch (e: any) {
                    alert(e?.message ?? "Failed to delete");
                  }
                }}>
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}