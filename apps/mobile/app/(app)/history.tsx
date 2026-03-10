import {
    View, Text, SectionList, FlatList, TouchableOpacity,
    StatusBar, ActivityIndicator,
} from 'react-native';
import { useCallback, useState, useMemo } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useInvoiceStore } from '../../src/store/invoiceStore';
import { HistoryCard } from '../../src/components/HistoryCard';
import { COLORS } from '../../src/constants/colors';
import { Invoice } from '../../src/types';
import { invoiceService } from '../../src/services/invoices';

// ─── Filters ──────────────────────────────────────────────────────────────────

interface FilterDef {
    label: string;
    icon: string;
    keywords: string[] | null;
}

const FILTERS: FilterDef[] = [
    { label: 'Todos', icon: 'apps-outline', keywords: null },
    { label: 'Supermercado', icon: 'cart-outline', keywords: ['super', 'mercado', 'carrefour', 'pão de açúcar', 'extra', 'condor', 'muffato', 'big'] },
    { label: 'Farmácia', icon: 'medkit-outline', keywords: ['farmácia', 'farmacia', 'drogaria', 'droga'] },
    { label: 'Atacado', icon: 'cube-outline', keywords: ['atacad', 'assaí', 'makro', 'atacarejo', 'fort'] },
    { label: 'Padaria', icon: 'cafe-outline', keywords: ['padaria', 'panific', 'confeitaria'] },
    { label: 'Outros', icon: 'ellipsis-horizontal-outline', keywords: [] },
];

function matchesFilter(name: string, filter: FilterDef): boolean {
    if (filter.keywords === null) return true;
    const lower = name.toLowerCase();
    if (filter.label === 'Outros') {
        const named = FILTERS.filter(f => f.keywords !== null && f.label !== 'Outros');
        return !named.some(f => f.keywords!.some(kw => lower.includes(kw)));
    }
    return filter.keywords.some(kw => lower.includes(kw));
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

const fmtFull = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

// ─── Screen ───────────────────────────────────────────────────────────────────

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

    // ── Apply filter ─────────────────────────────────────────────────────────
    const filteredInvoices = useMemo(() => {
        const filter = FILTERS.find(f => f.label === activeFilter) ?? FILTERS[0];
        return invoices.filter(inv => matchesFilter(inv.establishmentName, filter));
    }, [invoices, activeFilter]);

    // ── Group by emission month (inv.date = data de emissão da nota) ─────────
    const groupedInvoices = useMemo(() => {
        const groups: { title: string; total: number; count: number; data: Invoice[] }[] = [];
        const sorted = [...filteredInvoices].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        sorted.forEach(inv => {
            const date = new Date(inv.date);
            const monthKey = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
            const title = monthKey.charAt(0).toUpperCase() + monthKey.slice(1);
            let group = groups.find(g => g.title === title);
            if (!group) {
                group = { title, total: 0, count: 0, data: [] };
                groups.push(group);
            }
            group.data.push(inv);
            group.total += Number(inv.totalValue);
            group.count += 1;
        });
        return groups;
    }, [filteredInvoices]);

    const totalFiltered = useMemo(
        () => filteredInvoices.reduce((acc, inv) => acc + Number(inv.totalValue), 0),
        [filteredInvoices]
    );

    // Label do mês atual para badge "Atual"
    const nowLabel = (() => {
        const raw = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        return raw.charAt(0).toUpperCase() + raw.slice(1);
    })();

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <View style={{ flex: 1, backgroundColor: COLORS.BG }}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.ACCENT} />

            {/* ── Header dark ───────────────────────────────────────────────── */}
            <View style={{ backgroundColor: COLORS.ACCENT }}>
                <View style={{ paddingTop: 56, paddingHorizontal: 24, paddingBottom: 20 }}>
                    <Text style={{
                        fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.45)',
                        textTransform: 'uppercase', letterSpacing: 1.2,
                    }}>
                        Histórico de Compras
                    </Text>
                    <Text style={{
                        fontSize: 36, fontWeight: '800', color: '#fff',
                        letterSpacing: -1, marginTop: 6, lineHeight: 40,
                    }}>
                        {fmtFull(totalFiltered)}
                    </Text>
                    <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 6 }}>
                        {filteredInvoices.length}{' '}
                        {filteredInvoices.length === 1 ? 'compra' : 'compras'}
                        {activeFilter !== 'Todos' ? ` em "${activeFilter}"` : ' no total'}
                    </Text>
                </View>

                {/* ── Filter chips ──────────────────────────────────────────── */}
                <FlatList
                    horizontal
                    data={FILTERS}
                    keyExtractor={item => item.label}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 16, gap: 8 }}
                    renderItem={({ item }) => {
                        const isActive = item.label === activeFilter;
                        return (
                            <TouchableOpacity
                                onPress={() => setActiveFilter(item.label)}
                                accessibilityRole="button"
                                accessibilityLabel={`Filtrar por ${item.label}`}
                                accessibilityState={{ selected: isActive }}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 6,
                                    paddingHorizontal: 14,
                                    paddingVertical: 8,
                                    borderRadius: 100,
                                    backgroundColor: isActive ? COLORS.PRIMARY : 'rgba(255,255,255,0.1)',
                                    borderWidth: 1,
                                    borderColor: isActive ? COLORS.PRIMARY : 'rgba(255,255,255,0.15)',
                                }}
                            >
                                <Ionicons
                                    name={item.icon as any}
                                    size={13}
                                    color={isActive ? '#fff' : 'rgba(255,255,255,0.55)'}
                                />
                                <Text style={{
                                    fontSize: 13, fontWeight: '700',
                                    color: isActive ? '#fff' : 'rgba(255,255,255,0.55)',
                                }}>
                                    {item.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    }}
                />
            </View>

            {/* ── Grouped invoice list ──────────────────────────────────────── */}
            <SectionList
                sections={groupedInvoices}
                keyExtractor={item => item.id!}
                contentContainerStyle={{ paddingBottom: 100 }}
                stickySectionHeadersEnabled={false}
                renderSectionHeader={({ section }) => {
                    const isThisMonth = section.title === nowLabel;
                    return (
                        <View style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            paddingHorizontal: 24,
                            paddingTop: 20,
                            paddingBottom: 10,
                        }}>
                            {/* Month label + "Atual" badge */}
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Text style={{
                                    fontSize: 14, fontWeight: '700', color: COLORS.TEXT,
                                    textTransform: 'capitalize',
                                }}>
                                    {section.title}
                                </Text>
                                {isThisMonth && (
                                    <View style={{
                                        backgroundColor: COLORS.PRIMARY_LIGHT,
                                        paddingHorizontal: 8, paddingVertical: 2,
                                        borderRadius: 100,
                                    }}>
                                        <Text style={{ fontSize: 10, fontWeight: '700', color: COLORS.PRIMARY }}>
                                            Atual
                                        </Text>
                                    </View>
                                )}
                            </View>

                            {/* Total + count */}
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={{ fontSize: 15, fontWeight: '800', color: COLORS.TEXT }}>
                                    {fmt(section.total)}
                                </Text>
                                <Text style={{ fontSize: 11, color: COLORS.TEXT_MUTED, marginTop: 1 }}>
                                    {section.count} {section.count === 1 ? 'compra' : 'compras'}
                                </Text>
                            </View>
                        </View>
                    );
                }}
                renderItem={({ item: invoice }) => (
                    <View style={{ paddingHorizontal: 16, paddingBottom: 2 }}>
                        <HistoryCard
                            invoice={invoice}
                            onPress={() => router.push(`/invoice/${invoice.id}`)}
                        />
                    </View>
                )}
                ListEmptyComponent={
                    loading ? (
                        <View style={{ alignItems: 'center', marginTop: 80 }}>
                            <ActivityIndicator size="large" color={COLORS.PRIMARY} />
                            <Text style={{ color: COLORS.TEXT_MUTED, marginTop: 12, fontSize: 14 }}>
                                Carregando compras...
                            </Text>
                        </View>
                    ) : (
                        <View style={{ alignItems: 'center', marginTop: 80, paddingHorizontal: 40 }}>
                            <View style={{
                                width: 72, height: 72, borderRadius: 36,
                                backgroundColor: COLORS.PRIMARY_LIGHT,
                                justifyContent: 'center', alignItems: 'center', marginBottom: 16,
                            }}>
                                <Ionicons name="receipt-outline" size={30} color={COLORS.PRIMARY} />
                            </View>
                            <Text style={{
                                color: COLORS.TEXT, fontSize: 17, fontWeight: '700',
                                marginBottom: 8, textAlign: 'center',
                            }}>
                                {activeFilter === 'Todos'
                                    ? 'Nenhuma compra registrada'
                                    : `Sem compras em "${activeFilter}"`}
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
