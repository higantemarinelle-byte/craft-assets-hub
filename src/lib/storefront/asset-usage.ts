// Pure helpers for tracking Asset ID references embedded in the theme.
// Save flow: extract refs → diff against last snapshot → sync (draft or
// published scope) via server functions.

import type { Theme } from "../theme";
import type { AssetSourceType, UsageScope } from "./assets";

export type AssetRef = {
  assetId: string;
  source_type: AssetSourceType;
  source_id: string | null;
  field_path: string;
};

/**
 * Extract every AssetId reference embedded in a Theme.
 *
 * Initial tracked fields:
 *  - brand.logoAssetId
 *  - home.hero.imageAssetId
 *
 * Extend this function (not its call sites) as more sections learn about
 * Asset IDs — gallery, campaigns, navigation, footer, product.
 */
export function extractAssetRefs(theme: Theme | undefined | null): AssetRef[] {
  if (!theme) return [];
  const refs: AssetRef[] = [];

  const logoId = (theme.brand as any)?.logoAssetId as string | null | undefined;
  if (logoId) {
    refs.push({
      assetId: logoId,
      source_type: "theme",
      source_id: null,
      field_path: "brand.logoAssetId",
    });
  }

  const heroId = (theme.home?.hero as any)?.imageAssetId as string | null | undefined;
  if (heroId) {
    refs.push({
      assetId: heroId,
      source_type: "theme",
      source_id: null,
      field_path: "home.hero.imageAssetId",
    });
  }

  return refs;
}

function refKey(r: AssetRef, scope: UsageScope): string {
  return `${scope}::${r.source_type}::${r.source_id ?? ""}::${r.field_path}::${r.assetId}`;
}

export type UsageDiff = { added: AssetRef[]; removed: AssetRef[] };

export function diffUsage(prev: AssetRef[], next: AssetRef[], scope: UsageScope): UsageDiff {
  const prevMap = new Map(prev.map((r) => [refKey(r, scope), r]));
  const nextMap = new Map(next.map((r) => [refKey(r, scope), r]));
  const added: AssetRef[] = [];
  const removed: AssetRef[] = [];
  for (const [k, r] of nextMap) if (!prevMap.has(k)) added.push(r);
  for (const [k, r] of prevMap) if (!nextMap.has(k)) removed.push(r);
  return { added, removed };
}