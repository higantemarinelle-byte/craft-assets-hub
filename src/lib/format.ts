import { useMemo } from "react";

export const SUPPORTED_CURRENCIES = ["USD", "AUD", "EUR", "PHP"] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

const CURRENCY_LOCALE: Record<SupportedCurrency, string> = {
  USD: "en-US",
  AUD: "en-AU",
  EUR: "en-IE",
  PHP: "en-PH",
};

export function money(n: number | string, currency: string = "USD"): string {
  const value = typeof n === "string" ? parseFloat(n) : n;
  const code = (SUPPORTED_CURRENCIES as readonly string[]).includes(currency)
    ? (currency as SupportedCurrency)
    : "USD";
  return new Intl.NumberFormat(CURRENCY_LOCALE[code], {
    style: "currency",
    currency: code,
  }).format(isFinite(value) ? value : 0);
}

/** Hook: currency-aware formatter bound to the storefront theme. */
export function useMoney(overrideCurrency?: string) {
  // Lazy import to avoid a hard cycle for non-storefront pages.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { useTheme } = require("@/lib/theme-context") as typeof import("@/lib/theme-context");
  const { theme } = useTheme();
  const currency = overrideCurrency ?? theme.commerce?.currency ?? "USD";
  return useMemo(() => (n: number | string) => money(n, currency), [currency]);
}
