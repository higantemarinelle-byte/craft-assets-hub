export function money(n: number | string): string {
  const value = typeof n === "string" ? parseFloat(n) : n;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(isFinite(value) ? value : 0);
}
