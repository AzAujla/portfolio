export const format = (value: number) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: value >= 100 ? 0 : 2 }).format(value);
