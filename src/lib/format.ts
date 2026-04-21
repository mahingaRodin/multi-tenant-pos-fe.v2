export function fmtMoney(value: number | undefined | null, currency = "USD") {
  const n = typeof value === "number" ? value : 0;
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(n);
  } catch {
    return `$${n.toFixed(2)}`;
  }
}
