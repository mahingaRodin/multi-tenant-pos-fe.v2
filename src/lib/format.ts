export function fmtMoney(value: number | undefined | null, currency = "USD") {
  const n = typeof value === "number" ? value : 0;
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(n);
  } catch {
    return `$${n.toFixed(2)}`;
  }
}

export function productImg(src?: string | null) {
  return src && src.trim()
    ? src
    : "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80";
}
