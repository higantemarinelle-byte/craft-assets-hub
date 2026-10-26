// Craft Studio Theme Builder — Shopify-style customizer shell.
// Left: editor sidebar (header/announcement, homepage sections, footer,
// theme settings, version history). Right: persistent live preview.
// Backend (save draft / publish / versions) is unchanged.

import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  ChevronLeft,
  ExternalLink,
  History,
  Rocket,
  Save,
  RotateCcw,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  adminGetTheme,
  adminSaveThemeDraft,
  adminPublishTheme,
  adminListThemeVersions,
  adminRevertThemeVersion,
  getPublishedTheme,
} from "@/lib/theme.functions";
import { Link } from "@tanstack/react-router";
import { DEFAULT_THEME, mergeTheme, syncLegacyBrandFromTokens, type Theme } from "@/lib/theme";
import { DEFAULT_DESIGN_TOKENS } from "@/lib/storefront/tokens";
import { useAuth } from "@/lib/auth";
import { themeQueryKeys, craftStudioQueryKeys } from "@/lib/theme-query-keys";

import {
  ThemeBrandEditor,
  ThemeColorEditor,
  ThemeTypographyEditor,
  ThemeButtonEditor,
  ThemeLayoutEditor,
  ThemePresetPicker,
} from "./DesignEditors";
import {
  ThemeAnnouncementEditor,
  ThemeHeroEditor,
  ThemeMarqueeEditor,
  ThemeSectionSettingsEditor,
  ThemePagesEditor,
  ThemeInventoryEditor,
  ThemeCommerceEditor,
  SectionsEditor,
  sectionLabel,
} from "./ContentEditors";
import { ThemePreviewCanvas, sectionRegionId, type PreviewFocus } from "./ThemePreviewCanvas";

const routeApi = getRouteApi("/_authenticated/portal-admin/theme");

type PanelId =
  | "homepage"
  | "hero"
  | "marquee"
  | "sections"
  | "announcement"
  | "navigation"
  | "footer"
  | "brand"
  | "colors"
  | "typography"
  | "buttons"
  | "layout"
  | "presets"
  | "pages"
  | "inventory"
  | "commerce"
  | "history";

/** Maps the ?panel= search param to an internal panel. */
function panelFromSearch(panel: string | undefined): PanelId {
  switch (panel) {
    case "theme":
      return "brand";
    case "announcement":
      return "announcement";
    case "history":
      return "history";
    case "draft":
    case "homepage":
      return "homepage";
    default:
      return "homepage";
  }
}

export function ThemeBuilder() {
  const { isOwner } = useAuth();
  const qc = useQueryClient();
  const search = routeApi.useSearch();

  const getFn = useServerFn(adminGetTheme);
  const saveFn = useServerFn(adminSaveThemeDraft);
  const publishFn = useServerFn(adminPublishTheme);
  const versionsFn = useServerFn(adminListThemeVersions);
  const revertFn = useServerFn(adminRevertThemeVersion);

  const { data: row, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: themeQueryKeys.admin,
    queryFn: () => getFn(),
    retry: false,
  });
  const { data: versions = [] } = useQuery({ queryKey: themeQueryKeys.versions, queryFn: () => versionsFn() });

  const [draft, setDraft] = useState<Theme | null>(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState<"save" | "publish" | null>(null);
  const [statusNote, setStatusNote] = useState<string | null>(null);
  const [liveSynced, setLiveSynced] = useState(false);
  const publishedAt: string | null = (row as any)?.published_at ?? null;
  const [panel, setPanel] = useState<PanelId>(() => panelFromSearch((search as any)?.panel));
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

  // Follow ?panel= changes coming from Craft Studio module links.
  useEffect(() => {
    setPanel(panelFromSearch((search as any)?.panel));
    setActiveSectionId(null);
  }, [(search as any)?.panel]);

  // Hydrate once — do not stomp local edits when the query refreshes.
  useEffect(() => {
    if (isLoading || draft) return;
    if (row) {
      setDraft(mergeTheme((row as any).draft));
    } else if (!error) {
      setDraft(mergeTheme(undefined));
    }
  }, [row, draft, isLoading, error]);

  // Warn on unload while dirty.
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const update = useMemo(() => (fn: (t: Theme) => Theme) => {
    setDraft((prev) => (prev ? fn(prev) : prev));
    setDirty(true);
    setStatusNote(null);
  }, []);

  if (isLoading && !draft) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading theme…
      </div>
    );
  }

  if (error && !draft) {
    return (
      <div className="max-w-lg space-y-3 rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm">
        <div className="font-medium text-destructive">Couldn't load theme</div>
        <div className="text-muted-foreground break-words">
          {(error as any)?.message ?? "Unknown error"}
        </div>
        <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? "Retrying…" : "Retry"}
        </Button>
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Preparing editor…
      </div>
    );
  }

  const save = async () => {
    if (!draft) return;
    setBusy("save");
    try {
      const synced = syncLegacyBrandFromTokens(draft);
      await saveFn({ data: { draft: synced } });
      setDraft(synced);
      setDirty(false);
      setStatusNote("Draft saved");
      await Promise.all([
        qc.invalidateQueries({ queryKey: themeQueryKeys.admin }),
        qc.invalidateQueries({ queryKey: themeQueryKeys.draft }),
        qc.invalidateQueries({ queryKey: craftStudioQueryKeys.dashboard, refetchType: "all" }),
      ]);
      toast.success("Draft saved");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to save draft");
    } finally {
      setBusy(null);
    }
  };

  const publish = async () => {
    if (!draft) return;
    setBusy("publish");
    try {
      if (dirty) {
        const synced = syncLegacyBrandFromTokens(draft);
        await saveFn({ data: { draft: synced } });
        setDraft(synced);
      }
      const res: any = await publishFn({ data: {} });
      setDirty(false);
      await Promise.all([
        qc.invalidateQueries({ queryKey: themeQueryKeys.admin }),
        qc.invalidateQueries({ queryKey: themeQueryKeys.draft }),
        qc.invalidateQueries({ queryKey: themeQueryKeys.versions }),
        qc.invalidateQueries({ queryKey: craftStudioQueryKeys.dashboard, refetchType: "all" }),
      ]);
      // Verify the public reader sees the exact version we just published.
      const live = await qc.fetchQuery({ queryKey: themeQueryKeys.published, queryFn: () => getPublishedTheme(), staleTime: 0 });
      const same = (live as any)?.status === "ok" && !!res?.published_at &&
        new Date((live as any).published_at).getTime() === new Date(res.published_at).getTime();
      setLiveSynced(same);
      if (same) {
        setStatusNote("Live · Published just now");
        toast.success("Published live");
      } else {
        setStatusNote("Saved — live sync not verified");
        toast.error("Theme was saved but live storefront sync could not be verified.");
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to publish");
    } finally {
      setBusy(null);
    }
  };

  const revert = async (versionId: string) => {
    try {
      await revertFn({ data: { versionId } });
      const fresh: any = await getFn();
      setDraft(mergeTheme(fresh?.draft));
      setDirty(false);
      await qc.invalidateQueries({ queryKey: themeQueryKeys.admin });
      toast.success("Loaded version into draft");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to load version");
    }
  };

  const resetAllDesign = () => {
    if (!window.confirm("Reset ALL design tokens (colours, typography, buttons, layout) to defaults? Content stays untouched.")) return;
    update((t) => ({ ...t, tokens: DEFAULT_DESIGN_TOKENS }));
  };

  const selectSection = (id: string) => {
    setActiveSectionId(id);
    setPanel("sections");
  };

  const activeSection = activeSectionId
    ? draft.home.sections.find((s) => s.id === activeSectionId) ?? null
    : null;

  const statusText = dirty ? "Unsaved changes" : statusNote ?? "All changes saved";

  // Which storefront region the preview should focus for the current panel.
  const previewFocus: PreviewFocus = (() => {
    if (panel === "sections" && activeSectionId) return sectionRegionId(activeSectionId);
    switch (panel) {
      case "announcement":
        return "announcement";
      case "navigation":
        return "navigation";
      case "hero":
        return "hero";
      case "marquee":
        return "marquee";
      case "footer":
        return "footer";
      default:
        return null;
    }
  })();

  return (
    <div>
      {/* Persistent toolbar */}
      <div className="sticky top-0 z-20 -mx-4 mb-4 flex flex-wrap items-center justify-between gap-3 border-b-2 border-ink bg-cream px-4 py-3 sm:-mx-6 sm:px-6">
        <div>
          <h1 className="text-display text-2xl">Theme Builder</h1>
          <p className="text-sm text-muted-foreground">
            Craft Studio ·{" "}
            <span className={dirty ? "rounded bg-yellow px-2 py-0.5 text-xs font-bold uppercase tracking-widest text-ink" : "font-semibold"}>
              {statusText}
            </span>
          </p>
          <p className="text-xs text-muted-foreground">
            Last published:{" "}
            {publishedAt
              ? new Date(publishedAt).toLocaleString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })
              : "Never"}
            {liveSynced && <span className="ml-2 font-semibold text-foreground">· Live theme synced</span>}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={save} disabled={!dirty || busy !== null}>
            {busy === "save" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save draft
          </Button>
          <a href="/?theme=draft" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-md border-2 border-ink bg-cream px-4 py-2 text-sm font-bold hover:bg-yellow">
            <ExternalLink className="h-4 w-4" /> Preview
          </a>
          {isOwner && (
            <Button onClick={publish} disabled={busy !== null} className="bg-magenta text-cream hover:bg-magenta/90">
              {busy === "publish" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Rocket className="mr-2 h-4 w-4" />}
              Publish
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
        {/* Editor sidebar */}
        <div className="space-y-4">
          <nav className="rounded-lg border-2 border-ink bg-cream p-3">
            <SidebarGroup label="Storefront">
              <SidebarItem active={panel === "announcement"} onClick={() => setPanel("announcement")}>Announcement</SidebarItem>
              <SidebarItem active={panel === "navigation"} onClick={() => setPanel("navigation")}>Header / navigation</SidebarItem>
            </SidebarGroup>

            <SidebarGroup label="Homepage">
              <SidebarItem active={panel === "homepage"} onClick={() => { setPanel("homepage"); setActiveSectionId(null); }}>Sections</SidebarItem>
              <SidebarItem active={panel === "hero"} onClick={() => setPanel("hero")}>Hero</SidebarItem>
              <SidebarItem active={panel === "marquee"} onClick={() => setPanel("marquee")}>Marquee</SidebarItem>
              {draft.home.sections.map((s) => (
                <SidebarItem
                  key={s.id}
                  nested
                  active={panel === "sections" && activeSectionId === s.id}
                  onClick={() => selectSection(s.id)}
                >
                  {sectionLabel(s)}
                </SidebarItem>
              ))}
            </SidebarGroup>

            <SidebarGroup label="Footer">
              <SidebarItem active={panel === "footer"} onClick={() => setPanel("footer")}>Footer content</SidebarItem>
            </SidebarGroup>

            <SidebarGroup label="Theme settings">
              <SidebarItem active={panel === "brand"} onClick={() => setPanel("brand")}>Brand</SidebarItem>
              <SidebarItem active={panel === "colors"} onClick={() => setPanel("colors")}>Colours</SidebarItem>
              <SidebarItem active={panel === "typography"} onClick={() => setPanel("typography")}>Typography</SidebarItem>
              <SidebarItem active={panel === "buttons"} onClick={() => setPanel("buttons")}>Buttons</SidebarItem>
              <SidebarItem active={panel === "layout"} onClick={() => setPanel("layout")}>Layout</SidebarItem>
              <SidebarItem active={panel === "presets"} onClick={() => setPanel("presets")}>Presets</SidebarItem>
            </SidebarGroup>

            <SidebarGroup label="Other content">
              <SidebarItem active={panel === "pages"} onClick={() => setPanel("pages")}>Pages</SidebarItem>
              <SidebarItem active={panel === "inventory"} onClick={() => setPanel("inventory")}>Inventory</SidebarItem>
              <SidebarItem active={panel === "commerce"} onClick={() => setPanel("commerce")}>Commerce</SidebarItem>
            </SidebarGroup>

            <SidebarGroup label="Publishing">
              <SidebarItem active={panel === "history"} onClick={() => setPanel("history")}>Version history</SidebarItem>
            </SidebarGroup>
          </nav>

          <div className="rounded-lg border-2 border-ink bg-cream p-4">
            {panel === "sections" && activeSection && (
              <button
                type="button"
                onClick={() => { setPanel("homepage"); setActiveSectionId(null); }}
                className="mb-3 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-ink"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Back to homepage
              </button>
            )}
            <div className="mb-3 text-sm font-bold uppercase tracking-widest">
              {panel === "sections" && activeSection ? sectionLabel(activeSection) : PANEL_TITLES[panel]}
            </div>

            {panel === "homepage" && (
              <SectionsEditor
                sections={draft.home.sections}
                onChange={(sections) => update((t) => ({ ...t, home: { ...t.home, sections } }))}
                onSelect={selectSection}
              />
            )}
            {panel === "hero" && <ThemeHeroEditor theme={draft} update={update} />}
            {panel === "marquee" && <ThemeMarqueeEditor theme={draft} update={update} />}
            {panel === "sections" && activeSectionId && (
              <ThemeSectionSettingsEditor theme={draft} sectionId={activeSectionId} update={update} />
            )}
            {panel === "announcement" && <ThemeAnnouncementEditor theme={draft} update={update} />}
            {panel === "navigation" && (
              <BuilderLink to="/portal-admin/craft-studio/navigation" title="Navigation Builder"
                text="The live header menu is edited in the Navigation Builder. Save any changes here first." />
            )}
            {panel === "footer" && (
              <BuilderLink to="/portal-admin/craft-studio/footer" title="Footer Builder"
                text="The live footer is edited in the Footer Builder. Save any changes here first." />
            )}
            {panel === "brand" && <ThemeBrandEditor theme={draft} update={update} />}
            {panel === "colors" && <ThemeColorEditor theme={draft} update={update} />}
            {panel === "typography" && <ThemeTypographyEditor theme={draft} update={update} />}
            {panel === "buttons" && <ThemeButtonEditor theme={draft} update={update} />}
            {panel === "layout" && (
              <>
                <ThemeLayoutEditor theme={draft} update={update} />
                <div className="mt-6 border-t border-ink/10 pt-4">
                  <Button variant="outline" size="sm" onClick={resetAllDesign}>
                    <RotateCcw className="mr-2 h-3.5 w-3.5" /> Reset ALL design tokens
                  </Button>
                </div>
              </>
            )}
            {panel === "presets" && (
              <ThemePresetPicker update={update} onApply={() => toast.success("Preset applied — remember to save")} />
            )}
            {panel === "pages" && <ThemePagesEditor theme={draft} update={update} />}
            {panel === "inventory" && <ThemeInventoryEditor theme={draft} update={update} />}
            {panel === "commerce" && <ThemeCommerceEditor theme={draft} update={update} />}
            {panel === "history" && <VersionPanel versions={versions as any[]} onRevert={revert} isOwner={isOwner} />}
          </div>
        </div>

        {/* Live preview */}
        <div className="lg:sticky lg:top-24 lg:h-fit">
          <ThemePreviewCanvas theme={draft} focus={previewFocus} />
        </div>
      </div>
    </div>
  );
}

const PANEL_TITLES: Record<PanelId, string> = {
  homepage: "Homepage sections",
  hero: "Hero",
  marquee: "Marquee",
  sections: "Section settings",
  announcement: "Announcement bar",
  navigation: "Header / navigation",
  footer: "Footer",
  brand: "Brand",
  colors: "Colours",
  typography: "Typography",
  buttons: "Buttons",
  layout: "Layout",
  presets: "Presets",
  pages: "Pages",
  inventory: "Inventory",
  commerce: "Commerce",
  history: "Version history",
};

function SidebarGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3 last:mb-0">
      <div className="mb-1 px-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</div>
      <ul className="space-y-0.5">{children}</ul>
    </div>
  );
}

function SidebarItem({
  active,
  nested,
  onClick,
  children,
}: {
  active: boolean;
  nested?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        aria-current={active ? "true" : undefined}
        className={`w-full rounded px-2 py-1.5 text-left text-sm font-semibold transition-colors ${
          nested ? "pl-6 text-[13px] font-medium" : ""
        } ${active ? "bg-ink text-cream" : "hover:bg-ink/10"}`}
      >
        {children}
      </button>
    </li>
  );
}

function VersionPanel({ versions, onRevert, isOwner }: { versions: any[]; onRevert: (id: string) => void; isOwner: boolean }) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-widest">
        <History className="h-4 w-4" /> Version history
      </div>
      {versions.length === 0 && <p className="text-xs text-muted-foreground">No previous versions. Publishing snapshots the current live theme.</p>}
      <ul className="space-y-2">
        {versions.map((v) => (
          <li key={v.id} className="rounded border-2 border-ink/20 p-2 text-xs">
            <div className="font-semibold">{v.label ?? "Snapshot"}</div>
            <div className="text-muted-foreground">{new Date(v.created_at).toLocaleString()}</div>
            {isOwner && (
              <button className="mt-1 text-magenta hover:underline" onClick={() => onRevert(v.id)}>Load into draft</button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

// Silence "DEFAULT_THEME unused" if a future edit removes references.
void DEFAULT_THEME;

function BuilderLink({ to, title, text }: { to: "/portal-admin/craft-studio/navigation" | "/portal-admin/craft-studio/footer"; title: string; text: string }) {
  return (
    <div className="space-y-3 rounded border-2 border-ink/20 p-4 text-sm">
      <p>{text}</p>
      <Link to={to} className="inline-flex items-center gap-2 rounded-md border-2 border-ink bg-cream px-4 py-2 font-bold hover:bg-yellow">
        Open {title} <ExternalLink className="h-4 w-4" />
      </Link>
    </div>
  );
}
