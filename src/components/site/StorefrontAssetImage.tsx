// Reusable storefront image that prefers a Craft Studio Asset ID over a
// legacy raw URL. Resolves signed URLs through the public asset resolver.

import { useQuery } from "@tanstack/react-query";
import type { ImgHTMLAttributes } from "react";
import { resolvePublicAssets } from "@/lib/storefront/assets.functions";

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt"> & {
  assetId?: string | null;
  fallbackUrl?: string | null;
  alt?: string;
};

export function StorefrontAssetImage({ assetId, fallbackUrl, alt, ...rest }: Props) {
  const q = useQuery({
    queryKey: ["storefront-assets", assetId],
    queryFn: async () => {
      if (!assetId) return null;
      const res = await resolvePublicAssets({ data: { ids: [assetId] } });
      return res.assets[0] ?? null;
    },
    enabled: !!assetId,
    staleTime: 5 * 60_000,
  });

  const resolvedUrl = q.data?.url;
  const src = resolvedUrl || fallbackUrl || "";
  const resolvedAlt = alt ?? q.data?.alt_text ?? "";

  if (!src) return null;
  return <img {...rest} src={src} alt={resolvedAlt} />;
}