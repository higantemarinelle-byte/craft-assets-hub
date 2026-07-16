export type ProjectStatus =
  | "submitted"
  | "craft_review"
  | "waiting_for_customer"
  | "quote_ready"
  | "approved"
  | "in_production"
  | "quality_check"
  | "ready_for_pickup"
  | "shipped"
  | "completed"
  | "archived";

export const PROJECT_STATUSES: ProjectStatus[] = [
  "submitted",
  "craft_review",
  "waiting_for_customer",
  "quote_ready",
  "approved",
  "in_production",
  "quality_check",
  "ready_for_pickup",
  "shipped",
  "completed",
  "archived",
];

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  submitted: "Submitted",
  craft_review: "Craft Review",
  waiting_for_customer: "Waiting for Customer",
  quote_ready: "Quote Ready",
  approved: "Approved",
  in_production: "In Production",
  quality_check: "Quality Check",
  ready_for_pickup: "Ready for Pickup",
  shipped: "Shipped",
  completed: "Completed",
  archived: "Archived",
};

// Tailwind classes for each status badge (uses project's cream/ink/yellow/magenta palette)
export const STATUS_STYLES: Record<ProjectStatus, string> = {
  submitted: "bg-yellow text-ink border-ink",
  craft_review: "bg-cream text-ink border-ink",
  waiting_for_customer: "bg-orange-200 text-ink border-ink",
  quote_ready: "bg-blue-200 text-ink border-ink",
  approved: "bg-green-200 text-ink border-ink",
  in_production: "bg-magenta text-cream border-ink",
  quality_check: "bg-purple-200 text-ink border-ink",
  ready_for_pickup: "bg-teal-200 text-ink border-ink",
  shipped: "bg-indigo-200 text-ink border-ink",
  completed: "bg-ink text-cream border-ink",
  archived: "bg-muted text-muted-foreground border-ink/40",
};

export function statusLabel(s: string | null | undefined) {
  if (!s) return "—";
  return STATUS_LABELS[s as ProjectStatus] ?? s;
}
