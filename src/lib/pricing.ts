/**
 * MAB AI Strategies — rubric pricing engine (pure functions).
 *
 * price = serviceBase × Π(rubric multipliers) × tierFactor, rounded.
 * Tier factors: Good 0.85 (lean scope) / Better 1.00 (market-rate) / Best 1.35 (premium scope).
 */

export interface Factor {
  id: number;
  category: string;
  label: string;
  detail: string | null;
  multiplier: string;
  sortOrder: number;
}

export interface CatalogService {
  id: number;
  name: string;
  category: string;
  unit: string;
  basePrice: string;
  description: string | null;
  goodDesc: string | null;
  betterDesc: string | null;
  bestDesc: string | null;
  sortOrder: number;
}

export const FILTER_CATEGORIES = [
  { key: "location", label: "Location", hint: "Cost-of-market index for the client's market" },
  { key: "size", label: "Employee Count", hint: "Company size as budget proxy" },
  { key: "industry", label: "Industry", hint: "Willingness & ability to pay by sector" },
  { key: "title", label: "POC Position / Title", hint: "Budget authority of your point of contact" },
  { key: "urgency", label: "Timeline / Urgency", hint: "Priority scheduling premium" },
  { key: "relationship", label: "Client Relationship", hint: "New vs. repeat vs. partner channel" },
  { key: "complexity", label: "Delivery Complexity", hint: "Integration, data & compliance burden" },
] as const;

export type FilterKey = (typeof FILTER_CATEGORIES)[number]["key"];
export type Selections = Record<FilterKey, string>; // factor id as string

export const TIERS = [
  { key: "good", label: "Good", factor: 0.85, tagline: "Essential scope, lean delivery" },
  { key: "better", label: "Better", factor: 1.0, tagline: "Market-rate, recommended" },
  { key: "best", label: "Best", factor: 1.35, tagline: "Premium scope, white-glove" },
] as const;

export type TierKey = (typeof TIERS)[number]["key"];

export function roundPrice(value: number, unit: string): number {
  const step = unit === "per hour" ? 5 : value < 1500 ? 25 : 50;
  return Math.round(value / step) * step;
}

export function fmtMoney(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export interface StackEntry {
  key: FilterKey;
  label: string;
  optionLabel: string;
  multiplier: number;
}

export function buildStack(
  factors: Factor[],
  selections: Selections,
): { stack: StackEntry[]; combined: number } {
  const stack: StackEntry[] = [];
  let combined = 1;
  for (const cat of FILTER_CATEGORIES) {
    const factor = factors.find(
      (f) => f.category === cat.key && String(f.id) === selections[cat.key],
    );
    const m = factor ? parseFloat(factor.multiplier) : 1;
    stack.push({
      key: cat.key,
      label: cat.label,
      optionLabel: factor?.label ?? "—",
      multiplier: m,
    });
    combined *= m;
  }
  return { stack, combined: Math.round(combined * 1000) / 1000 };
}

export interface LineQuote {
  service: CatalogService;
  adjustedBase: number;
  good: number;
  better: number;
  best: number;
}

export function quoteService(service: CatalogService, combined: number): LineQuote {
  const base = parseFloat(service.basePrice) * combined;
  const g = roundPrice(base * TIERS[0].factor, service.unit);
  const b = roundPrice(base * TIERS[1].factor, service.unit);
  const t = roundPrice(base * TIERS[2].factor, service.unit);
  return { service, adjustedBase: base, good: g, better: b, best: t };
}

export function tierTotals(lines: LineQuote[]) {
  return {
    good: lines.reduce((s, l) => s + l.good, 0),
    better: lines.reduce((s, l) => s + l.better, 0),
    best: lines.reduce((s, l) => s + l.best, 0),
  };
}

/** Human read on the combined market index. */
export function indexVerdict(combined: number): string {
  const pct = Math.round((combined - 1) * 100);
  if (pct <= -15) return `${Math.abs(pct)}% below baseline — budget-sensitive market. Anchor on Good.`;
  if (pct < -4) return `${Math.abs(pct)}% below baseline — slight discount pressure.`;
  if (pct <= 4) return "At baseline mid-Atlantic market rate.";
  if (pct <= 15) return `${pct}% above baseline — healthy budget headroom.`;
  return `${pct}% above baseline — premium market. Lead with Better/Best.`;
}
