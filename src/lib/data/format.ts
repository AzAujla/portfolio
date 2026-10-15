export const inr = (value: number | null | undefined, digits = 0) =>
  value == null ? '—' : `₹${value.toLocaleString('en-IN', { maximumFractionDigits: digits, minimumFractionDigits: digits })}`;

export const num = (value: number | null | undefined, digits = 1) =>
  value == null ? '—' : value.toLocaleString('en-IN', { maximumFractionDigits: digits, minimumFractionDigits: digits });

export const pct = (value: number | null | undefined, digits = 1) =>
  value == null ? '—' : `${(value * 100).toFixed(digits)}%`;

export const signedPct = (value: number | null | undefined, digits = 1) =>
  value == null ? '—' : `${value >= 0 ? '+' : ''}${value.toFixed(digits)}%`;
