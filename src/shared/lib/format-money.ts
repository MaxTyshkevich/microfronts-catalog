export function formatMoney(minor: number, currency = "USD") {
  return new Intl.NumberFormat("ru-RU", { style: "currency", currency }).format(minor / 100);
}
