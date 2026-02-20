import {
    View, Text, ScrollView, TouchableOpacity,
    StatusBar, ActivityIndicator,
} from 'react-native';
import { useState, useCallback } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../src/constants/colors';
import { insightsService } from '../../src/services/insights';
import type { WrappedData } from '../../src/services/insights';

const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

function StatCard({ emoji, label, value, sub, accent }: {
    emoji: string;
    label: string;
    value: string;
    sub?: string;
    accent?: boolean;
}) {
    return (
        <View style={{
            flex: 1,
            backgroundColor: accent ? COLORS.PRIMARY : COLORS.SURFACE,
            borderRadius: 16,
            padding: 14,
            borderWidth: 1,
            borderColor: accent ? COLORS.PRIMARY : COLORS.BORDER,
            minWidth: '47%',
        }}>
            <Text style={{ fontSize: 22, marginBottom: 4 }}>{emoji}</Text>
            <Text style={{ fontSize: 11, fontWeight: '600', color: accent ? 'rgba(255,255,255,0.7)' : COLORS.TEXT_MUTED, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 }}>
                {label}
            </Text>
            <Text style={{ fontSize: 16, fontWeight: '800', color: accent ? '#FFFFFF' : COLORS.TEXT, lineHeight: 22 }} numberOfLines={2}>
                {value}
            </Text>
            {sub && (
                <Text style={{ fontSize: 11, color: accent ? 'rgba(255,255,255,0.55)' : COLORS.TEXT_MUTED, marginTop: 2 }}>
                    {sub}
                </Text>
            )}
        </View>
    );
}

const CURRENT_YEAR = new Date().getFullYear();

export default function WrappedScreen() {
    const router = useRouter();
    const [data, setData] = useState<WrappedData | null>(null);
    const [loading, setLoading] = useState(true);
    const [year, setYear] = useState(CURRENT_YEAR);

    const loadWrapped = useCallback((y: number) => {
        setLoading(true);
        insightsService.getWrapped(y)
            .then(setData)
            .catch(() => setData(null))
            .finally(() => setLoading(false));
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadWrapped(year);
        }, [year])
    );

    return (
        <View style={{ flex: 1, backgroundColor: COLORS.BG }}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.PRIMARY} />

            {/* Header */}
            <View style={{
                backgroundColor: COLORS.PRIMARY,
                paddingTop: 56,
                paddingBottom: 24,
                paddingHorizontal: 20,
                overflow: 'hidden',
                position: 'relative',
            }}>
                <View style={{
                    position: 'absolute', top: -40, right: -40,
                    width: 160, height: 160, borderRadius: 80,
                    backgroundColor: 'rgba(255,255,255,0.08)',
                }} />
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={{ marginBottom: 12 }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={{ fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.65)' }}>
                    Resumo Anual
                </Text>
                <Text style={{ fontSize: 34, fontWeight: '800', color: '#FFFFFF', letterSpacing: -1, marginTop: 2 }}>
                    🎁 Wrapped {year}
                </Text>

                {/* Year selector */}
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
                    {[CURRENT_YEAR - 1, CURRENT_YEAR].map((y) => (
                        <TouchableOpacity
                            key={y}
                            onPress={() => setYear(y)}
                            style={{
                                paddingHorizontal: 14,
                                paddingVertical: 6,
                                borderRadius: 100,
                                backgroundColor: y === year ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)',
                                borderWidth: 1,
                                borderColor: y === year ? 'rgba(255,255,255,0.5)' : 'transparent',
                            }}
                        >
                            <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFFFFF' }}>{y}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={COLORS.PRIMARY} />
                </View>
            ) : !data || data.invoiceCount === 0 ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
                    <Text style={{ fontSize: 48, marginBottom: 16 }}>📭</Text>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.TEXT, textAlign: 'center', marginBottom: 8 }}>
                        Sem dados para {year}
                    </Text>
                    <Text style={{ fontSize: 13, color: COLORS.TEXT_MUTED, textAlign: 'center', lineHeight: 20 }}>
                        Nenhuma nota fiscal registrada neste ano.
                    </Text>
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Total hero */}
                    <View style={{
                        backgroundColor: COLORS.ACCENT,
                        borderRadius: 20,
                        padding: 20,
                        marginBottom: 12,
                        overflow: 'hidden',
                        position: 'relative',
                    }}>
                        <View style={{
                            position: 'absolute', bottom: -30, right: -30,
                            width: 120, height: 120, borderRadius: 60,
                            backgroundColor: 'rgba(255,255,255,0.06)',
                        }} />
                        <Text style={{ fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1 }}>
                            Total gasto em {year}
                        </Text>
                        <Text style={{ fontSize: 44, fontWeight: '800', color: '#FFFFFF', letterSpacing: -1, marginTop: 4 }}>
                            {fmt(data.totalSpent)}
                        </Text>
                        <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>
                            {data.invoiceCount} notas · {fmt(data.avgMonthlySpend)}/mês em média
                        </Text>
                    </View>

                    {/* Stats grid */}
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
                        <StatCard
                            emoji="🏪"
                            label="Loja favorita"
                            value={data.favoriteStore}
                            sub={`${data.favoriteStoreVisits} visitas`}
                            accent
                        />
                        <StatCard
                            emoji="🛒"
                            label="Produto mais comprado"
                            value={data.topProduct}
                            sub={`${data.topProductCount}× comprado`}
                        />
                        <StatCard
                            emoji="📅"
                            label="Mês mais caro"
                            value={data.mostExpensiveMonth}
                            sub={fmt(data.mostExpensiveMonthTotal)}
                        />
                        <StatCard
                            emoji="📈"
                            label="Inflação pessoal"
                            value={data.personalInflation !== 0
                                ? `${data.personalInflation > 0 ? '+' : ''}${data.personalInflation.toFixed(1)}%`
                                : 'Dados insuf.'}
                            sub={data.personalInflation !== 0 ? 'vs sua cesta' : 'mín. 3 meses'}
                        />
                    </View>

                    {/* Category breakdown */}
                    {data.categoryBreakdown.length > 0 && (
                        <View style={{
                            backgroundColor: COLORS.SURFACE,
                            borderRadius: 16,
                            padding: 16,
                            borderWidth: 1,
                            borderColor: COLORS.BORDER,
                        }}>
                            <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.TEXT_MUTED, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 14 }}>
                                Por Categoria
                            </Text>
                            {data.categoryBreakdown.map((cat, idx) => (
                                <View key={idx} style={{ marginBottom: idx < data.categoryBreakdown.length - 1 ? 12 : 0 }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                                        <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.TEXT }}>
                                            {cat.emoji} {cat.name}
                                        </Text>
                                        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                                            <Text style={{ fontSize: 12, color: COLORS.TEXT_MUTED }}>{cat.percentage}%</Text>
                                            <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.TEXT }}>
                                                {fmt(cat.total)}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={{ height: 6, backgroundColor: COLORS.BORDER, borderRadius: 100 }}>
                                        <View style={{
                                            height: 6,
                                            width: `${cat.percentage}%`,
                                            backgroundColor: COLORS.PRIMARY,
                                            borderRadius: 100,
                                            opacity: 0.8 - idx * 0.1,
                                        }} />
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}
                </ScrollView>
            )}
        </View>
    );
}
