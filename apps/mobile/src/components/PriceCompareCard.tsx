import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import type { StoreComparison } from '../services/products';

interface PriceCompareCardProps {
    stores: StoreComparison[];
    savingsPotential: number;
}

const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

export function PriceCompareCard({ stores, savingsPotential }: PriceCompareCardProps) {
    if (stores.length === 0) return null;

    const cheapest = stores[0];
    const maxAvg = stores[stores.length - 1]?.avgPrice ?? cheapest.avgPrice;

    return (
        <View style={styles.card}>
            {savingsPotential > 0 && (
                <View style={styles.savingsBanner}>
                    <Ionicons name="trending-down" size={16} color={COLORS.PRIMARY} />
                    <Text style={styles.savingsText}>
                        Economize {fmt(savingsPotential)} comprando no lugar certo
                    </Text>
                </View>
            )}

            {stores.map((store, i) => {
                const isCheapest = i === 0;
                const barWidth =
                    maxAvg > 0 ? `${Math.round((store.avgPrice / maxAvg) * 100)}%` : '100%';

                return (
                    <View key={store.name} style={styles.storeRow}>
                        <View style={styles.storeHeader}>
                            <View style={styles.storeNameRow}>
                                {isCheapest && (
                                    <View style={styles.bestBadge}>
                                        <Text style={styles.bestBadgeText}>Melhor preço</Text>
                                    </View>
                                )}
                                <Text style={styles.storeName} numberOfLines={1}>
                                    {store.name}
                                </Text>
                            </View>
                            <Text
                                style={[
                                    styles.storePrice,
                                    isCheapest && styles.cheapestPrice,
                                ]}
                            >
                                {fmt(store.avgPrice)}
                            </Text>
                        </View>

                        <View style={styles.barTrack}>
                            <View
                                style={[
                                    styles.barFill,
                                    {
                                        width: barWidth as any,
                                        backgroundColor: isCheapest
                                            ? COLORS.PRIMARY
                                            : COLORS.BORDER,
                                    },
                                ]}
                            />
                        </View>

                        <Text style={styles.storeMeta}>
                            {store.count === 1
                                ? '1 compra registrada'
                                : `${store.count} compras registradas`}{' '}
                            · mín {fmt(store.minPrice)} · máx {fmt(store.maxPrice)}
                        </Text>
                    </View>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.SURFACE,
        borderRadius: 16,
        padding: 16,
        gap: 12,
        borderWidth: 1,
        borderColor: COLORS.BORDER,
    },
    savingsBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: COLORS.PRIMARY_LIGHT,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
    },
    savingsText: {
        fontSize: 13,
        color: COLORS.PRIMARY_DARK,
        fontWeight: '600',
        flex: 1,
    },
    storeRow: {
        gap: 6,
    },
    storeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    storeNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flex: 1,
    },
    storeName: {
        fontSize: 14,
        color: COLORS.TEXT,
        fontWeight: '500',
        flex: 1,
    },
    storePrice: {
        fontSize: 15,
        color: COLORS.TEXT,
        fontWeight: '700',
    },
    cheapestPrice: {
        color: COLORS.PRIMARY,
    },
    bestBadge: {
        backgroundColor: COLORS.PRIMARY_LIGHT,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 100,
    },
    bestBadgeText: {
        fontSize: 10,
        color: COLORS.PRIMARY_DARK,
        fontWeight: '700',
    },
    barTrack: {
        height: 6,
        backgroundColor: COLORS.BORDER,
        borderRadius: 100,
        overflow: 'hidden',
    },
    barFill: {
        height: '100%',
        borderRadius: 100,
    },
    storeMeta: {
        fontSize: 11,
        color: COLORS.TEXT_MUTED,
    },
});
