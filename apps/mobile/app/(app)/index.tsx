import { View, Text, FlatList, RefreshControl, ActivityIndicator, StatusBar, TouchableOpacity } from 'react-native';
import { useAuthStore } from '../../src/store/authStore';
import { useRouter, useFocusEffect } from 'expo-router';
import { useState, useCallback, useMemo } from 'react';
import { invoiceService } from '../../src/services/invoices';
import { Ionicons } from '@expo/vector-icons';
import { useInvoiceStore } from '../../src/store/invoiceStore';
import { COLORS } from '../../src/constants/colors';
import { BudgetCard } from '../../src/components/dashboard/BudgetCard';
import { InsightCard } from '../../src/components/dashboard/InsightCard';
import { RecentPurchase } from '../../src/components/dashboard/RecentPurchase';
import { SyncIndicator } from '../../src/components/SyncIndicator';
import { OfflineBanner } from '../../src/components/OfflineBanner';
import { productsService } from '../../src/services/products';
import { insightsService } from '../../src/services/insights';
import { ForecastBar } from '../../src/components/ForecastBar';
import type { DashboardInsights } from '../../src/services/insights';

// Mock budget data — will be replaced by real data from budgetStore/backend
const MOCK_BUDGETS = [
    { emoji: '🥩', name: 'Alimentação', spent: 0, limit: 1500, color: COLORS.PRIMARY },
    { emoji: '🧴', name: 'Higiene & Beleza', spent: 0, limit: 300, color: COLORS.SECONDARY },
    { emoji: '🧹', name: 'Limpeza', spent: 0, limit: 400, color: COLORS.CHART_BLUE },
    { emoji: '🍺', name: 'Bebidas', spent: 0, limit: 250, color: COLORS.CHART_PURPLE },
];

export default function Dashboard() {
    const { user } = useAuthStore();
    const router = useRouter();
    const { invoices, setInvoices } = useInvoiceStore();
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [savingsPotential, setSavingsPotential] = useState(0);
    const [dashInsights, setDashInsights] = useState<DashboardInsights | null>(null);

    const fetchInvoices = async () => {
        try {
            const data = await invoiceService.findAll();
            setInvoices(data);
        } catch (error) {
            console.error('Failed to fetch invoices', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const fetchSavings = async () => {
        try {
            const { totalPotential } = await productsService.getSavingsSummary();
            setSavingsPotential(totalPotential);
        } catch {
            // Pro feature — silent fail for free users
        }
    };

    const fetchDashInsights = async () => {
        try {
            const insights = await insightsService.getDashboard();
            setDashInsights(insights);
        } catch {
            // Silent fail
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchInvoices();
            fetchSavings();
            fetchDashInsights();
        }, [])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchInvoices();
    }, []);

    const totalGasto = useMemo(
        () => invoices.reduce((acc, curr) => acc + Number(curr.totalValue), 0),
        [invoices]
    );

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    const recentInvoices = useMemo(
        () => [...invoices]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5),
        [invoices]
    );

    // Budget rows with mock allocation based on total
    const budgetRows = useMemo(() => {
        // Simple heuristic: spread total across categories proportionally
        const total = totalGasto;
        return MOCK_BUDGETS.map((b, i) => ({
            ...b,
            spent: i === 0 ? total * 0.43
                 : i === 1 ? total * 0.13
                 : i === 2 ? total * 0.07
                 : total * 0.07,
        }));
    }, [totalGasto]);

    // Greeting based on time of day
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

    // Current month
    const currentMonth = new Date().toLocaleDateString('pt-BR', { month: 'long' });
    const capitalizedMonth = currentMonth.charAt(0).toUpperCase() + currentMonth.slice(1);

    // Dynamic insight text
    const insightText = invoices.length > 0
        ? `Você tem ${invoices.length} compras registradas. Escaneie mais notas para receber insights personalizados sobre seus gastos por categoria.`
        : 'Escaneie suas notas fiscais para acompanhar seus gastos por categoria automaticamente.';

    return (
        <View style={{ flex: 1, backgroundColor: COLORS.BG }}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.ACCENT} />
            <OfflineBanner />

            <FlatList
                data={recentInvoices}
                keyExtractor={(item) => item.id!}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[COLORS.PRIMARY]}
                        tintColor={COLORS.PRIMARY}
                    />
                }
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={
                    <>
                        {/* === HEADER DARK === */}
                        <View style={{
                            backgroundColor: COLORS.ACCENT,
                            paddingTop: 56,
                            paddingBottom: 32,
                            paddingHorizontal: 24,
                            position: 'relative',
                            overflow: 'hidden',
                        }}>
                            {/* Decorative gradient circle */}
                            <View style={{
                                position: 'absolute',
                                top: -60, right: -60,
                                width: 200, height: 200,
                                borderRadius: 100,
                                backgroundColor: 'rgba(76,175,125,0.15)',
                            }} />

                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', fontWeight: '500' }}>
                                    {greeting}, {user?.name?.split(' ')[0] || 'Usuário'} 👋
                                </Text>
                                <SyncIndicator />
                            </View>
                            <Text style={{
                                fontSize: 24, fontWeight: '800', color: '#FFFFFF',
                                marginTop: 2, letterSpacing: -0.5,
                            }}>
                                Controle de Gastos
                            </Text>

                            {/* Total do mes */}
                            <View style={{ marginTop: 20 }}>
                                <Text style={{
                                    fontSize: 12, color: 'rgba(255,255,255,0.55)',
                                    fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1,
                                }}>
                                    Gasto em {capitalizedMonth}
                                </Text>
                                <Text style={{
                                    fontSize: 40, fontWeight: '800', color: '#FFFFFF',
                                    letterSpacing: -1, marginTop: 4, lineHeight: 44,
                                }}>
                                    {formatCurrency(totalGasto)}
                                </Text>

                                {/* Badge */}
                                <View style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    marginTop: 10,
                                    backgroundColor: 'rgba(76,175,125,0.2)',
                                    borderWidth: 1,
                                    borderColor: 'rgba(76,175,125,0.3)',
                                    paddingHorizontal: 12,
                                    paddingVertical: 5,
                                    borderRadius: 100,
                                    alignSelf: 'flex-start',
                                }}>
                                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#7DFFB3' }}>
                                        {invoices.length} {invoices.length === 1 ? 'nota' : 'notas'} este mês
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* === BODY === */}
                        <View style={{ paddingHorizontal: 16, marginTop: -16 }}>

                            {/* Budget Card */}
                            {totalGasto > 0 && <BudgetCard rows={budgetRows} />}

                            {/* Insight Card */}
                            <InsightCard
                                title={invoices.length > 0 ? 'Insight da Semana' : 'Dica rápida'}
                                text={insightText}
                            />

                            {/* Forecast Widget */}
                            {dashInsights && dashInsights.forecast.forecast > 0 && (
                                <ForecastBar
                                    forecast={dashInsights.forecast.forecast}
                                    currentSpent={dashInsights.forecast.currentSpent}
                                    progressPercent={dashInsights.forecast.progressPercent}
                                    daysLeft={dashInsights.forecast.daysLeft}
                                    isOnTrack={dashInsights.forecast.isOnTrack}
                                    currentMonth={capitalizedMonth}
                                />
                            )}

                            {/* Savings Widget */}
                            {savingsPotential > 0.5 && (
                                <TouchableOpacity
                                    onPress={() => router.push('/compare' as any)}
                                    activeOpacity={0.8}
                                    style={{
                                        backgroundColor: COLORS.SECONDARY_LIGHT,
                                        borderRadius: 14,
                                        padding: 14,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        gap: 12,
                                        borderWidth: 1,
                                        borderColor: '#FAD99A',
                                        marginBottom: 4,
                                    }}
                                >
                                    <View style={{
                                        width: 40, height: 40, borderRadius: 20,
                                        backgroundColor: '#FEE8B0',
                                        alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <Ionicons name="trending-down" size={20} color={COLORS.SECONDARY} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 13, fontWeight: '800', color: '#92540A' }}>
                                            Economize {formatCurrency(savingsPotential)} por compra
                                        </Text>
                                        <Text style={{ fontSize: 12, color: '#B87333', marginTop: 1 }}>
                                            Compre os mesmos produtos na loja mais barata →
                                        </Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={16} color="#B87333" />
                                </TouchableOpacity>
                            )}

                            {/* Section label */}
                            <Text style={{
                                fontSize: 13, fontWeight: '700',
                                color: COLORS.TEXT_MUTED,
                                textTransform: 'uppercase',
                                letterSpacing: 0.8,
                                marginBottom: 12, marginLeft: 4,
                            }}>
                                Compras Recentes
                            </Text>
                        </View>
                    </>
                }
                renderItem={({ item }) => (
                    <View style={{ paddingHorizontal: 16 }}>
                        <RecentPurchase
                            invoice={item}
                            onPress={() => router.push(`/invoice/${item.id}`)}
                        />
                    </View>
                )}
                ListEmptyComponent={
                    loading ? (
                        <View style={{ alignItems: 'center', marginTop: 40 }}>
                            <ActivityIndicator size="large" color={COLORS.PRIMARY} />
                        </View>
                    ) : (
                        <View style={{ alignItems: 'center', marginTop: 40, paddingHorizontal: 40 }}>
                            <View style={{
                                width: 72, height: 72, borderRadius: 36,
                                backgroundColor: COLORS.PRIMARY_LIGHT,
                                justifyContent: 'center', alignItems: 'center', marginBottom: 16,
                            }}>
                                <Ionicons name="scan-outline" size={32} color={COLORS.PRIMARY} />
                            </View>
                            <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.TEXT, marginBottom: 8 }}>
                                Nenhuma nota ainda
                            </Text>
                            <Text style={{
                                fontSize: 14, color: COLORS.TEXT_MUTED,
                                textAlign: 'center', lineHeight: 22,
                            }}>
                                Toque no botão de scan para escanear sua primeira nota fiscal
                            </Text>
                        </View>
                    )
                }
            />
        </View>
    );
}
