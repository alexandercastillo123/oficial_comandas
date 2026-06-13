export function formatCurrency(value) {
  const num = parseFloat(value || 0);
  return `S/ ${num.toFixed(2)}`;
}
