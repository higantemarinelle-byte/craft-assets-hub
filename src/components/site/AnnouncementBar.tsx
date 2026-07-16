import { Link } from "@tanstack/react-router";
import { useTheme } from "@/lib/theme-context";

export function AnnouncementBar() {
  const { theme, isDraftPreview } = useTheme();
  if (!theme.announcement.enabled || !theme.announcement.text) {
    if (!isDraftPreview) return null;
  }
  const Wrapper: any = theme.announcement.link ? Link : "div";
  const wrapperProps: any = theme.announcement.link ? { to: theme.announcement.link } : {};
  return (
    <div className="w-full bg-magenta text-cream">
      {isDraftPreview && (
        <div className="mx-auto max-w-7xl px-4 py-1 text-center text-[10px] font-bold uppercase tracking-widest">
          Draft preview — changes are not live
        </div>
      )}
      {(theme.announcement.enabled && theme.announcement.text) && (
        <Wrapper
          {...wrapperProps}
          className="mx-auto flex max-w-7xl items-center justify-center px-4 py-2 text-center text-xs font-semibold md:text-sm"
        >
          {theme.announcement.text}
        </Wrapper>
      )}
    </div>
  );
}
