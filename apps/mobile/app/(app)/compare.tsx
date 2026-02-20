import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    StatusBar,
    ScrollView,
} from 'react-native';
import { useState, useCallback, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS } from '../../src/constants/colors';
import { productsService } from '../../src/services/products';
import { PriceCompareCard } from '../../src/components/PriceCompareCard';
import type { CompareResult, SavingsOpportunity } from '../../src/services/products';
import { useFocusEffect } from 'expo-router';

const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

export default function CompareScreen() {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [compareResult, setCompareResult] = useState<CompareResult | null>(null);
    const [topSavings, setTopSavings] = useState<SavingsOpportunity[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingTop, setLoadingTop] = useState(true);
    const [searchMode, setSearchMode] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useFocusEffect(
        useCallback(() => {
            loadTopSavings();
        }, [])
    );

    const loadTopSavings = async () => {
        setLoadingTop(true);
        try {
            const data = await productsService.getTopSavings(8);
            setTopSavings(data);
        } catch {
            // Pro feature — silently fail if not subscribed
        } finally {
            setLoadingTop(false);
        }
    };

    const onQueryChange = (text: string) => {
        setQuery(text);
        setCompareResult(null);

        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (text.trim().length < 2) {
            setSuggestions([]);
            setSearchMode(false);
            return;
        }

        setSearchMode(true);
        debounceRef.current = setTimeout(async () => {
            try {
                const results = await productsService.search(text.trim());
                setSuggestions(results);
            } catch {
                setSuggestions([]);
            }
        }, 300);
    };

    const onSelectProduct = async (name: string) => {
        setQuery(name);
        setSuggestions([]);
        setSearchMode(false);
        setLoading(true);
        try {
            const result = await productsService.compare(name);
            setCompareResult(result);
        } catch {
            setCompareResult(null);
        } finally {
            setLoading(false);
        }
    };

    const clearSearch = () => {
        setQuery('');
        setSuggestions([]);
        setCompareResult(null);
        setSearchMode(false);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.TEXT} />
                </TouchableOpacity>
                <Text style={styles.title}>Comparador de Preços</Text>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={18} color={COLORS.TEXT_MUTED} style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Buscar produto (ex: arroz, leite...)"
                    placeholderTextColor={COLORS.TEXT_MUTED}
                    value={query}
                    onChangeText={onQueryChange}
                    returnKeyType="search"
                    autoCapitalize="none"
                />
                {query.length > 0 && (
                    <TouchableOpacity onPress={clearSearch}>
                        <Ionicons name="close-circle" size={18} color={COLORS.TEXT_MUTED} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Autocomplete Suggestions */}
            {searchMode && suggestions.length > 0 && (
                <View style={styles.suggestionsBox}>
                    {suggestions.map((s) => (
                        <TouchableOpacity
                            key={s}
                            style={styles.suggestionItem}
                            onPress={() => onSelectProduct(s)}
                        >
                            <Ionicons name="pricetag-outline" size={14} color={COLORS.TEXT_MUTED} />
                            <Text style={styles.suggestionText} numberOfLines={1}>{s}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* Compare Result */}
            {loading && (
                <View style={styles.centered}>
                    <ActivityIndicator color={COLORS.PRIMARY} size="large" />
                </View>
            )}

            {!loading && compareResult && (
                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <Text style={styles.sectionLabel}>
                        {compareResult.stores.length === 0
                            ? 'Produto encontrado em apenas 1 loja'
                            : `Encontrado em ${compareResult.stores.length} lojas`}
                    </Text>

                    {compareResult.stores.length === 0 ? (
                        <View style={styles.emptyCard}>
                            <Ionicons name="storefront-outline" size={32} color={COLORS.TEXT_MUTED} />
                            <Text style={styles.emptyTitle}>Somente uma loja</Text>
                            <Text style={styles.emptyText}>
                                Este produto só aparece em uma loja no seu histórico. Escaneie mais
                                notas para comparar.
                            </Text>
                        </View>
                    ) : (
                        <PriceCompareCard
                            stores={compareResult.stores}
                            savingsPotential={compareResult.savingsPotential}
                        />
                    )}
                </ScrollView>
            )}

            {/* Top Savings — default state */}
            {!loading && !compareResult && !searchMode && (
                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={styles.scrollContent}
                >
                    <Text style={styles.sectionLabel}>💡 Maiores oportunidades de economia</Text>
                    <Text style={styles.sectionSub}>
                        Produtos que você comprou em lojas diferentes com preços distintos
                    </Text>

                    {loadingTop ? (
                        <ActivityIndicator color={COLORS.PRIMARY} style={{ marginTop: 32 }} />
                    ) : topSavings.length === 0 ? (
                        <View style={styles.emptyCard}>
                            <Ionicons name="analytics-outline" size={40} color={COLORS.TEXT_MUTED} />
                            <Text style={styles.emptyTitle}>Ainda sem dados suficientes</Text>
                            <Text style={styles.emptyText}>
                                Escaneie notas de pelo menos 2 supermercados diferentes para ver
                                oportunidades de economia.
                            </Text>
                        </View>
                    ) : (
                        <FlatList
                            data={topSavings}
                            keyExtractor={(item) => item.product}
                            scrollEnabled={false}
                            renderItem={({ item, index }) => (
                                <TouchableOpacity
                                    style={styles.opportunityCard}
                                    onPress={() => onSelectProduct(item.product)}
                                    activeOpacity={0.75}
                                >
                                    <View style={styles.opportunityRank}>
                                        <Text style={styles.rankText}>#{index + 1}</Text>
                                    </View>
                                    <View style={styles.opportunityBody}>
                                        <Text style={styles.opportunityProduct} numberOfLines={1}>
                                            {item.product}
                                        </Text>
                                        <Text style={styles.opportunityStores} numberOfLines={1}>
                                            {item.cheapestStore} vs {item.currentStore}
                                        </Text>
                                    </View>
                                    <View style={styles.opportunitySaving}>
                                        <Text style={styles.savingAmount}>
                                            {fmt(item.savingsPotential)}
                                        </Text>
                                        <Text style={styles.savingLabel}>por un.</Text>
                                    </View>
                                    <Ionicons
                                        name="chevron-forward"
                                        size={16}
                                        color={COLORS.TEXT_MUTED}
                                    />
                                </TouchableOpacity>
                            )}
                            ItemSeparatorComponent={() => <View style={styles.separator} />}
                        />
                    )}
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.BG,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 56,
        paddingHorizontal: 20,
        paddingBottom: 16,
        gap: 12,
        backgroundColor: COLORS.SURFACE,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.BORDER,
    },
    backBtn: {
        padding: 4,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.TEXT,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.SURFACE,
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: COLORS.BORDER,
        gap: 8,
    },
    searchIcon: {
        marginRight: 4,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: COLORS.TEXT,
    },
    suggestionsBox: {
        backgroundColor: COLORS.SURFACE,
        marginHorizontal: 16,
        marginTop: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.BORDER,
        overflow: 'hidden',
        zIndex: 10,
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.BORDER,
    },
    suggestionText: {
        fontSize: 14,
        color: COLORS.TEXT,
        flex: 1,
    },
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        gap: 12,
        paddingBottom: 40,
    },
    sectionLabel: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.TEXT,
        marginBottom: 4,
    },
    sectionSub: {
        fontSize: 13,
        color: COLORS.TEXT_MUTED,
        marginBottom: 8,
        lineHeight: 18,
    },
    opportunityCard: {
        backgroundColor: COLORS.SURFACE,
        borderRadius: 14,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderWidth: 1,
        borderColor: COLORS.BORDER,
    },
    opportunityRank: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: COLORS.PRIMARY_LIGHT,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rankText: {
        fontSize: 12,
        fontWeight: '800',
        color: COLORS.PRIMARY_DARK,
    },
    opportunityBody: {
        flex: 1,
        gap: 3,
    },
    opportunityProduct: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.TEXT,
    },
    opportunityStores: {
        fontSize: 12,
        color: COLORS.TEXT_MUTED,
    },
    opportunitySaving: {
        alignItems: 'flex-end',
    },
    savingAmount: {
        fontSize: 15,
        fontWeight: '800',
        color: COLORS.PRIMARY,
    },
    savingLabel: {
        fontSize: 10,
        color: COLORS.TEXT_MUTED,
    },
    separator: {
        height: 8,
    },
    emptyCard: {
        backgroundColor: COLORS.SURFACE,
        borderRadius: 16,
        padding: 28,
        alignItems: 'center',
        gap: 10,
        borderWidth: 1,
        borderColor: COLORS.BORDER,
        marginTop: 8,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.TEXT,
        textAlign: 'center',
    },
    emptyText: {
        fontSize: 13,
        color: COLORS.TEXT_MUTED,
        textAlign: 'center',
        lineHeight: 18,
    },
});
