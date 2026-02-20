import { View, Text, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator, FlatList } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { COLORS } from '../../src/constants/colors';
import { useInvoiceStore } from '../../src/store/invoiceStore';
import { reportsService, ReportSummary, CategoryData, StoreData, TrendData, InflationData } from '../../src/services/reports';
import { DonutChart } from '../../src/components/charts/DonutChart';
import { BarChart } from '../../src/components/charts/BarChart';
import { TrendLine } from '../../src/components/charts/TrendLine';
import ExportModal from '../../src/components/ExportModal';

const PERIODS = [
    { label: 'Jan', value: '2026-01' },
    { label: 'Fev', value: '2026-02' },
    { label: 'Mar', value: '2026-03' },
    { label: '3m', value: '3m' },
    { label: '6m', value: '6m' },
    { label: '2026', value: 'year' },
];

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

function StatCard({ label, value, variation, variationLabel }: {
    label: string;
    value: string;
    variation?: number;
    variationLabel?: string;
}) {
    const isPositive = (variation ?? 0) > 0;
    const variationColor = isPositive ? COLORS.DANGER : COLORS.PRIMARY;
    const arrow = isPositive ? '↑' : '↓';

    return (
        <View style={{
            flex: 1,
            backgroundColor: COLORS.SURFACE,
            padding: 14,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: COLORS.BORDER,
        }}>
            <Text style={{
                fontSize: 10, fontWeight: '700', color: COLORS.TEXT_MUTED,
                textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6,
            }}>
                {label}
            </Text>
            <Text style={{ fontSize: 20, fontWeight: '800', color: COLORS.TEXT }} numberOfLines={1} adjustsFontSizeToFit>
                {value}
            </Text>
            {variation !== undefined && variation !== 0 ? (
                <Text style={{ fontSize: 10, fontWeight: '700', color: variationColor, marginTop: 4 }}>
                    {arrow} {Math.abs(variation).toFixed(1)}% {variationLabel || 'vs anterior'}
                </Text>
            ) : variationLabel ? (
                <Text style={{ fontSize: 10, color: COLORS.TEXT_MUTED, marginTop: 4 }}>
                    {variationLabel}
                </Text>
            ) : null}
        </View>
    );
}

function SectionCard({ title, icon, children }: {
    title: string;
    icon?: string;
    children: React.ReactNode;
}) {
    return (
        <View style={{
            backgroundColor: COLORS.SURFACE,
            borderRadius: 16,
            padding: 20,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: COLORS.BORDER,
        }}>
            <Text style={{
                fontSize: 11, fontWeight: '700', color: COLORS.TEXT_MUTED,
                textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 16,
            }}>
                {icon ? `${icon} ` : ''}{title}
            </Text>
            {children}
        </View>
    );
}

export default function Reports() {
    const { invoices } = useInvoiceStore();
    const [activePeriod, setActivePeriod] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState<ReportSummary | null>(null);
    const [categories, setCategories] = useState<CategoryData[]>([]);
    const [stores, setStores] = useState<StoreData[]>([]);
    const [trend, setTrend] = useState<TrendData[]>([]);
    const [inflation, setInflation] = useState<InflationData[]>([]);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [summaryData, categoriesData, storesData, trendData, inflationData] = await Promise.all([
                reportsService.getSummary(activePeriod),
                reportsService.getByCategory(activePeriod),
                reportsService.getByStore(activePeriod),
                reportsService.getTrend(6),
                reportsService.getInflation(8),
            ]);

            setSummary(summaryData);
            setCategories(categoriesData);
            setStores(storesData);
            setTrend(trendData);
            setInflation(inflationData);
        } catch (error) {
            console.error('Error loading reports:', error);
        } finally {
            setLoading(false);
        }
    }, [activePeriod]);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    const hasData = invoices.length > 0;
    const [showExportModal, setShowExportModal] = useState(false);

    return (
        <View style={{ flex: 1, backgroundColor: COLORS.BG }}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.BG} />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                {/* Header */}
                <View style={{ paddingTop: 56, paddingHorizontal: 24, paddingBottom: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <View>
                            <Text style={{ fontSize: 28, fontWeight: '800', color: COLORS.TEXT, letterSpacing: -0.5 }}>
                                Relatórios
                            </Text>
                            <Text style={{ fontSize: 14, color: COLORS.TEXT_MUTED, marginTop: 4 }}>
                                Análise inteligente dos seus gastos
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => setShowExportModal(true)}
                            style={{
                                flexDirection: 'row', alignItems: 'center', gap: 6,
                                backgroundColor: COLORS.PRIMARY,
                                borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
                                marginTop: 4,
                            }}
                        >
                            <Text style={{ fontSize: 14 }}>📤</Text>
                            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Exportar</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Period Selector */}
                <FlatList
                    horizontal
                    data={PERIODS}
                    keyExtractor={(item) => item.value}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 12, gap: 8 }}
                    renderItem={({ item }) => {
                        const isActive = item.value === activePeriod;
                        return (
                            <TouchableOpacity
                                onPress={() => setActivePeriod(item.value)}
                                style={{
                                    paddingHorizontal: 16,
                                    paddingVertical: 8,
                                    borderRadius: 100,
                                    backgroundColor: isActive ? COLORS.ACCENT : COLORS.SURFACE,
                                    borderWidth: 1,
                                    borderColor: isActive ? COLORS.ACCENT : COLORS.BORDER,
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

                {loading ? (
                    <View style={{ alignItems: 'center', marginTop: 60 }}>
                        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
                    </View>
                ) : !hasData ? (
                    <View style={{ alignItems: 'center', marginTop: 60, paddingHorizontal: 40 }}>
                        <View style={{
                            width: 72, height: 72, borderRadius: 36,
                            backgroundColor: COLORS.PRIMARY_LIGHT,
                            justifyContent: 'center', alignItems: 'center', marginBottom: 16,
                        }}>
                            <Ionicons name="bar-chart-outline" size={32} color={COLORS.PRIMARY} />
                        </View>
                        <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.TEXT, marginBottom: 8 }}>
                            Sem dados ainda
                        </Text>
                        <Text style={{
                            fontSize: 14, color: COLORS.TEXT_MUTED,
                            textAlign: 'center', lineHeight: 22,
                        }}>
                            Escaneie suas notas fiscais para ver relatórios detalhados aqui
                        </Text>
                    </View>
                ) : (
                    <View style={{ paddingHorizontal: 16 }}>
                        {/* Stats Row 1 */}
                        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
                            <StatCard
                                label="Total Gasto"
                                value={formatCurrency(summary?.totalSpent ?? 0)}
                                variation={summary?.totalVariation}
                            />
                            <StatCard
                                label="Ticket Médio"
                                value={formatCurrency(summary?.avgTicket ?? 0)}
                                variation={summary?.ticketVariation}
                            />
                        </View>

                        {/* Stats Row 2 */}
                        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                            <StatCard
                                label="Compras"
                                value={String(summary?.invoiceCount ?? 0)}
                                variationLabel="este período"
                            />
                            <StatCard
                                label="Economia"
                                value={formatCurrency(summary?.estimatedSavings ?? 0)}
                                variationLabel="em breve"
                            />
                        </View>

                        {/* Donut Chart - By Category */}
                        {categories.length > 0 && (
                            <SectionCard title="Gastos por Categoria">
                                <DonutChart
                                    data={categories.map((cat) => ({
                                        label: cat.name,
                                        value: cat.total,
                                        color: cat.color,
                                        emoji: cat.emoji,
                                    }))}
                                />
                            </SectionCard>
                        )}

                        {/* Bar Chart - By Store */}
                        {stores.length > 0 && (
                            <SectionCard title="Por Estabelecimento" icon="🏬">
                                <BarChart
                                    data={stores.map((s) => ({
                                        label: s.name,
                                        value: s.total,
                                    }))}
                                    color={COLORS.ACCENT}
                                />
                            </SectionCard>
                        )}

                        {/* Trend Line */}
                        {trend.length >= 2 && (
                            <SectionCard title="Evolução Mensal" icon="📈">
                                <TrendLine
                                    data={trend.map((t) => ({
                                        label: t.monthLabel,
                                        value: t.total,
                                    }))}
                                />
                            </SectionCard>
                        )}

                        {/* Inflation Table */}
                        {inflation.length > 0 && (
                            <SectionCard title="Inflação Pessoal" icon="📊">
                                <View>
                                    {/* Table header */}
                                    <View style={{
                                        flexDirection: 'row', paddingBottom: 8, marginBottom: 4,
                                        borderBottomWidth: 1, borderBottomColor: COLORS.BORDER,
                                    }}>
                                        <Text style={{ flex: 1, fontSize: 10, fontWeight: '700', color: COLORS.TEXT_MUTED }}>
                                            Produto
                                        </Text>
                                        <Text style={{ width: 70, fontSize: 10, fontWeight: '700', color: COLORS.TEXT_MUTED, textAlign: 'right' }}>
                                            Preço Atual
                                        </Text>
                                        <Text style={{ width: 60, fontSize: 10, fontWeight: '700', color: COLORS.TEXT_MUTED, textAlign: 'right' }}>
                                            Variação
                                        </Text>
                                    </View>

                                    {inflation.map((item, i) => (
                                        <View
                                            key={i}
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                paddingVertical: 8,
                                                borderBottomWidth: i < inflation.length - 1 ? 1 : 0,
                                                borderBottomColor: `${COLORS.BORDER}80`,
                                            }}
                                        >
                                            <Text style={{ flex: 1, fontSize: 12, color: COLORS.TEXT, fontWeight: '500' }} numberOfLines={1}>
                                                {item.name}
                                            </Text>
                                            <Text style={{ width: 70, fontSize: 12, color: COLORS.TEXT_MUTED, textAlign: 'right' }}>
                                                {formatCurrency(item.currentPrice)}
                                            </Text>
                                            <Text style={{
                                                width: 60, fontSize: 12, fontWeight: '700', textAlign: 'right',
                                                color: item.variation > 0 ? COLORS.DANGER : COLORS.PRIMARY,
                                            }}>
                                                {item.variation > 0 ? '↑' : '↓'} {Math.abs(item.variation).toFixed(1)}%
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            </SectionCard>
                        )}

                        {/* Empty sections fallback */}
                        {categories.length === 0 && stores.length === 0 && (
                            <SectionCard title="Dados do Período">
                                <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                                    <Ionicons name="analytics-outline" size={28} color={COLORS.TEXT_MUTED} />
                                    <Text style={{ fontSize: 13, color: COLORS.TEXT_MUTED, marginTop: 8, textAlign: 'center' }}>
                                        Sem dados detalhados para este período.{'\n'}Escaneie mais notas para gerar relatórios.
                                    </Text>
                                </View>
                            </SectionCard>
                        )}
                    </View>
                )}
            </ScrollView>

            <ExportModal visible={showExportModal} onClose={() => setShowExportModal(false)} />
        </View>
    );
}
