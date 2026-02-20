import { normalizeName } from '../products/price-normalizer';

export interface ProductVariation {
  product: string;
  variation: number; // percentage, e.g. 12.5 means +12.5%
  oldAvgPrice: number;
  newAvgPrice: number;
}

export interface InflationResult {
  personalInflation: number; // weighted average % variation
  ipcaReference: number; // static reference for the period
  period: string;
  topRisers: ProductVariation[];
  topFallers: ProductVariation[];
  hasEnoughData: boolean;
  productCount: number;
}

// Static IPCA 12-month reference (updated when needed)
const IPCA_REFERENCE: Record<string, number> = {
  '2026': 5.8,
  '2025': 4.83,
  '2024': 4.62,
  '2023': 4.62,
};

export function getIpcaReference(year: number): number {
  return IPCA_REFERENCE[String(year)] ?? 4.5;
}

/**
 * Calculates personal inflation from a list of invoice items.
 *
 * Algorithm:
 * - Splits the last 12 months into two halves: "old" (7-12 months ago) and "new" (last 6 months)
 * - For each product that appears in BOTH halves with 2+ data points, calculates price variation
 * - Weights each product's variation by its total spend (heavier items matter more)
 * - Returns weighted average as the personal inflation rate
 */
export function calcInflationFromItems(
  items: Array<{
    description: string;
    unitPrice: number;
    totalPrice: number;
    invoiceDate: Date;
  }>,
): InflationResult {
  const now = new Date();
  const ipcaRef = getIpcaReference(now.getFullYear());

  const cutoff = new Date(now);
  cutoff.setMonth(cutoff.getMonth() - 6);
  const yearAgo = new Date(now);
  yearAgo.setMonth(yearAgo.getMonth() - 12);

  const recent = items.filter((i) => i.invoiceDate >= yearAgo);

  // Need at least 3 distinct months of data
  const months = new Set(
    recent.map(
      (i) => `${i.invoiceDate.getFullYear()}-${i.invoiceDate.getMonth()}`,
    ),
  );
  if (months.size < 3) {
    return {
      personalInflation: 0,
      ipcaReference: ipcaRef,
      period: 'últimos 12 meses',
      topRisers: [],
      topFallers: [],
      hasEnoughData: false,
      productCount: 0,
    };
  }

  const oldItems = recent.filter((i) => i.invoiceDate < cutoff);
  const newItems = recent.filter((i) => i.invoiceDate >= cutoff);

  type PriceGroup = { prices: number[]; original: string; totalSpent: number };
  const oldPrices = new Map<string, PriceGroup>();
  const newPrices = new Map<string, PriceGroup>();

  for (const item of oldItems) {
    const norm = normalizeName(item.description);
    if (!oldPrices.has(norm)) {
      oldPrices.set(norm, {
        prices: [],
        original: item.description,
        totalSpent: 0,
      });
    }
    const g = oldPrices.get(norm)!;
    g.prices.push(item.unitPrice);
    g.totalSpent += item.totalPrice;
  }

  for (const item of newItems) {
    const norm = normalizeName(item.description);
    if (!newPrices.has(norm)) {
      newPrices.set(norm, {
        prices: [],
        original: item.description,
        totalSpent: 0,
      });
    }
    const g = newPrices.get(norm)!;
    g.prices.push(item.unitPrice);
    g.totalSpent += item.totalPrice;
  }

  type Weighted = ProductVariation & { weight: number };
  const variations: Weighted[] = [];

  for (const [norm, oldG] of oldPrices) {
    const newG = newPrices.get(norm);
    if (!newG || oldG.prices.length < 2 || newG.prices.length < 2) continue;

    const oldAvg = oldG.prices.reduce((a, b) => a + b, 0) / oldG.prices.length;
    const newAvg = newG.prices.reduce((a, b) => a + b, 0) / newG.prices.length;
    const variation = ((newAvg - oldAvg) / oldAvg) * 100;

    variations.push({
      product: newG.original,
      variation,
      oldAvgPrice: oldAvg,
      newAvgPrice: newAvg,
      weight: newG.totalSpent + oldG.totalSpent,
    });
  }

  if (variations.length === 0) {
    return {
      personalInflation: 0,
      ipcaReference: ipcaRef,
      period: 'últimos 12 meses',
      topRisers: [],
      topFallers: [],
      hasEnoughData: false,
      productCount: 0,
    };
  }

  const totalWeight = variations.reduce((s, v) => s + v.weight, 0);
  const personalInflation =
    totalWeight > 0
      ? variations.reduce(
          (s, v) => s + (v.variation * v.weight) / totalWeight,
          0,
        )
      : 0;

  const sorted = [...variations].sort((a, b) => b.variation - a.variation);
  const topRisers = sorted
    .slice(0, 5)
    .filter((v) => v.variation > 0)
    .map(({ product, variation, oldAvgPrice, newAvgPrice }) => ({
      product,
      variation: Math.round(variation * 10) / 10,
      oldAvgPrice,
      newAvgPrice,
    }));
  const topFallers = sorted
    .slice(-5)
    .reverse()
    .filter((v) => v.variation < 0)
    .map(({ product, variation, oldAvgPrice, newAvgPrice }) => ({
      product,
      variation: Math.round(variation * 10) / 10,
      oldAvgPrice,
      newAvgPrice,
    }));

  return {
    personalInflation: Math.round(personalInflation * 10) / 10,
    ipcaReference: ipcaRef,
    period: 'últimos 12 meses',
    topRisers,
    topFallers,
    hasEnoughData: true,
    productCount: variations.length,
  };
}
