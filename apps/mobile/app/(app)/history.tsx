import { View, Text, FlatList, TouchableOpacity, StatusBar, ActivityIndicator } from 'react-native';
import { useCallback, useState, useMemo } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useInvoiceStore } from '../../src/store/invoiceStore';
import { HistoryCard } from '../../src/components/HistoryCard';
import { COLORS } from '../../src/constants/colors';
import { Invoice } from '../../src/types';
import { invoiceService } from '../../src/services/invoices';

interface FilterDef {
    label: string;
    keywords: string[] | null; // null = show all
}

const FILTERS: FilterDef[] = [
    { label: 'Todos', keywords: null },
    { label: 'Supermercado', keywords: ['super', 'mercado', 'carrefour', 'pão de açúcar', 'extra', 'condor', 'muffato', 'big'] },
    { label: 'Farmácia', keywords: ['farmácia', 'farmacia', 'drogaria', 'droga'] },
    { label: 'Atacado', keywords: ['atacad', 'assaí', 'makro', 'atacarejo', 'fort'] },
    { label: 'Padaria', keywords: ['padaria', 'panific', 'confeitaria'] },
    { label: 'Outros', keywords: [] }, // Matches anything NOT matched by other filters
];

function matchesFilter(name: string, filter: FilterDef): boolean {
    if (filter.keywords === null) return true; // "Todos"

    const lower = name.toLowerCase();

    // "Outros" — matches if none of the other named filters match
    if (filter.label === 'Outros') {
        const namedFilters = FILTERS.filter((f) => f.keywords !== null && f.label !== 'Outros');
        return !namedFilters.some((f) =>
            f.keywords!.some((kw) => lower.includes(kw))
        );
    }

    return filter.keywords.some((kw) => lower.includes(kw));
}

export default function History() {
    const router = useRouter();
    const { invoices, setInvoices } = useInvoiceStore();
    const [activeFilter, setActiveFilter] = useState('Todos');
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            setLoading(true);
            invoiceService.findAll()
                .then(setInvoices)
                .catch(console.error)
                .finally(() => setLoading(false));
        }, [])
    );

    // Apply active filter
    const filteredInvoices = useMemo(() => {
        const filter = FILTERS.find((f) => f.label === activeFilter) ?? FILTERS[0];
        return invoices.filter((inv) => matchesFilter(inv.establishmentName, filter));
    }, [invoices, activeFilter]);

    // Group filtered invoices by month
    const groupedInvoices = useMemo(() => {
        const groups: { title: string; total: number; data: Invoice[] }[] = [];
        const sorted = [...filteredInvoices].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        sorted.forEach((inv) => {
            const date = new Date(inv.date);
            const monthKey = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
            const capitalized = monthKey.charAt(0).toUpperCase() + monthKey.slice(1);

            let group = groups.find((g) => g.title === capitalized);
            if (!group) {
                group = { title: capitalized, total: 0, data: [] };
                groups.push(group);
            }
            group.data.push(inv);
            group.total += Number(inv.totalValue);
        });

        return groups;
    }, [filteredInvoices]);

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    const totalFiltered = useMemo(
        () => filteredInvoices.reduce((acc, inv) => acc + Number(inv.totalValue), 0),
        [filteredInvoices]
    );

    return (
        <View style={{ flex: 1, backgroundColor: COLORS.BG }}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.BG} />

            {/* Header */}
            <View style={{ paddingTop: 56, paddingHorizontal: 24, paddingBottom: 12 }}>
                <Text style={{ fontSize: 28, fontWeight: '800', color: COLORS.TEXT, letterSpacing: -0.5 }}>
                    Histórico
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 8 }}>
                    <Text style={{ fontSize: 14, color: COLORS.TEXT_MUTED }}>
                        {filteredInvoices.length} {filteredInvoices.length === 1 ? 'compra' : 'compras'}
                    </Text>
                    {activeFilter !== 'Todos' && (
                        <View style={{
                            backgroundColor: COLORS.PRIMARY_LIGHT,
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            borderRadius: 100,
                        }}>
                            <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.PRIMARY }}>
                                {formatCurrency(totalFiltered)}
                            </Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Filter chips */}
            <FlatList
                horizontal
                data={FILTERS}
                keyExtractor={(item) => item.label}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 16, gap: 8 }}
                renderItem={({ item }) => {
                    const isActive = item.label === activeFilter;
                    return (
                        <TouchableOpacity
                            onPress={() => setActiveFilter(item.label)}
                            style={{
                                paddingHorizontal: 16,
                                paddingVertical: 8,
                                borderRadius: 100,
                                backgroundColor: isActive ? COLORS.PRIMARY : COLORS.SURFACE,
                                borderWidth: 1,
                                borderColor: isActive ? COLORS.PRIMARY : COLORS.BORDER,
                            }}
                        >
                            <Text style={{
                                fontSize: 13,
                                fontWeight: '700',
                                color: isActive ? '#FFFFFF' : COLORS.TEXT_MUTED,
                            }}>
                                {item.label}
                            </Text>
                        </TouchableOpacity>
                    );
                }}
            />

            {/* Invoice list grouped by month */}
            <FlatList
                data={groupedInvoices}
                keyExtractor={(item) => item.title}
                contentContainerStyle={{ paddingBottom: 100 }}
                renderItem={({ item: group }) => (
                    <View>
                        <View style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            paddingHorizontal: 24,
                            paddingVertical: 12,
                            borderTopWidth: 1,
                            borderTopColor: COLORS.BORDER,
                        }}>
                            <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.TEXT_MUTED, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                                {group.title}
                            </Text>
                            <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.TEXT_MUTED }}>
                                {formatCurrency(group.total)}
                            </Text>
                        </View>
                        {group.data.map((invoice) => (
                            <View key={invoice.id} style={{ paddingHorizontal: 16 }}>
                                <HistoryCard
                                    invoice={invoice}
                                    onPress={() => router.push(`/invoice/${invoice.id}`)}
                                />
                            </View>
                        ))}
                    </View>
                )}
                ListEmptyComponent={
                    loading ? (
                        <View style={{ alignItems: 'center', marginTop: 60 }}>
                            <ActivityIndicator size="large" color={COLORS.PRIMARY} />
                        </View>
                    ) : (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 80, paddingHorizontal: 40 }}>
                            <View style={{
                                width: 64, height: 64, borderRadius: 32,
                                backgroundColor: COLORS.PRIMARY_LIGHT,
                                justifyContent: 'center', alignItems: 'center', marginBottom: 16,
                            }}>
                                <Ionicons name="receipt-outline" size={28} color={COLORS.PRIMARY} />
                            </View>
                            <Text style={{ color: COLORS.TEXT, fontSize: 16, fontWeight: '700', marginBottom: 8 }}>
                                {activeFilter === 'Todos' ? 'Nenhuma compra registrada' : `Nenhuma compra em "${activeFilter}"`}
                            </Text>
                            <Text style={{ color: COLORS.TEXT_MUTED, fontSize: 14, textAlign: 'center', lineHeight: 22 }}>
                                {activeFilter === 'Todos'
                                    ? 'Escaneie suas notas fiscais para ver o histórico aqui'
                                    : 'Tente outro filtro ou escaneie mais notas'}
                            </Text>
                        </View>
                    )
                }
            />
        </View>
    );
}
