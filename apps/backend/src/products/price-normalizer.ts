/**
 * Normalizes a product name for comparison and grouping.
 * Removes accents, special characters, and generic unit words.
 */
export function normalizeName(name: string): string {
    return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')        // remove accent marks
        .replace(/[^a-z0-9\s]/g, ' ')           // special chars → space
        .replace(
            /\b(tipo|un|cx|pct|cj|fr|kg|g|mg|ml|l|lt|lata|caixa|pacote|pote|saco|unidade|unid|und|tablete|barra)\b/g,
            ' ',
        )
        .replace(/\b\d+(\.\d+)?\s*(kg|g|ml|l|un)?\b/g, ' ')  // remove quantities
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Levenshtein distance between two strings (used for fuzzy grouping).
 */
export function levenshtein(a: string, b: string): number {
    const m = a.length;
    const n = b.length;
    const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
        Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
    );

    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            dp[i][j] =
                a[i - 1] === b[j - 1]
                    ? dp[i - 1][j - 1]
                    : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
    }

    return dp[m][n];
}

/**
 * Returns true if two normalized names likely refer to the same product.
 * Strategy: share the first significant token AND Levenshtein distance ≤ 3.
 */
export function isSameProduct(a: string, b: string): boolean {
    if (a === b) return true;

    const tokensA = a.split(' ').filter(Boolean);
    const tokensB = b.split(' ').filter(Boolean);

    if (tokensA.length === 0 || tokensB.length === 0) return false;

    // Must share first token (brand / first word)
    if (tokensA[0] !== tokensB[0]) return false;

    return levenshtein(a, b) <= 3;
}
