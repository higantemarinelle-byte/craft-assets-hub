import { STATUS_STYLES, STATUS_LABELS, type ProjectStatus } from "@/lib/project-status";
import { cn } from "@/lib/utils";

export function ProjectStatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const s = (STATUS_LABELS as any)[status] ? (status as ProjectStatus) : "submitted";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border-2 px-3 py-0.5 text-xs font-bold uppercase tracking-wider",
        STATUS_STYLES[s],
        className,
      )}
    >
      {STATUS_LABELS[s]}
    </span>
  );
}
