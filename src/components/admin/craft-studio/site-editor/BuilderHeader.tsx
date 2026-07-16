import { Button } from "@/components/ui/button";
import { ExternalLink, Loader2, Rocket, Save } from "lucide-react";

type Props = {
  title: string;
  subtitle?: string;
  dirty: boolean;
  busy: "save" | "publish" | null;
  onSave: () => void;
  onPublish: () => void;
};

export function BuilderHeader({ title, subtitle, dirty, busy, onSave, onPublish }: Props) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-display text-3xl">{title}</h1>
        <p className="text-sm text-muted-foreground">
          {subtitle ?? "Craft Studio"}
          {dirty && (
            <span className="ml-2 rounded bg-yellow px-2 py-0.5 text-xs font-bold uppercase tracking-widest text-ink">
              Unsaved
            </span>
          )}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" onClick={onSave} disabled={!dirty || busy !== null}>
          {busy === "save" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save draft
        </Button>
        <a
          href="/?theme=draft"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-md border-2 border-ink bg-cream px-4 py-2 text-sm font-bold hover:bg-yellow"
        >
          <ExternalLink className="h-4 w-4" /> Full preview
        </a>
        <Button onClick={onPublish} disabled={busy !== null} className="bg-magenta text-cream hover:bg-magenta/90">
          {busy === "publish" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Rocket className="mr-2 h-4 w-4" />}
          Publish
        </Button>
      </div>
    </div>
  );
}