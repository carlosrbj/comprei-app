import {
    View, Text, ScrollView, TouchableOpacity,
    StatusBar, ActivityIndicator,
} from 'react-native';
import { useState, useCallback } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../src/constants/colors';
import { insightsService } from '../../src/services/insights';
import { InflationCard, VariationList } from '../../src/components/InflationCard';
import { ForecastBar } from '../../src/components/ForecastBar';
import type { InflationData, ForecastData } from '../../src/services/insights';

const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

export default function InflationScreen() {
    const router = useRouter();
    const [inflation, setInflation] = useState<InflationData | null>(null);
    const [forecast, setForecast] = useState<ForecastData | null>(null);
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            let active = true;
            setLoading(true);

            Promise.all([
                insightsService.getInflation().catch(() => null),
                insightsService.getForecast().catch(() => null),
            ]).then(([inf, fc]) => {
                if (!active) return;
                setInflation(inf);
                setForecast(fc);
                setLoading(false);
            });

            return () => { active = false; };
        }, [])
    );

    return (
        <View style={{ flex: 1, backgroundColor: COLORS.BG }}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.ACCENT} />

            {/* Header */}
            <View style={{
                backgroundColor: COLORS.ACCENT,
                paddingTop: 56,
                paddingBottom: 24,
                paddingHorizontal: 20,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
            }}>
                <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 20, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5 }}>
                        Inflação & Previsão
                    </Text>
                    <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>
                        Sua inflação real vs IPCA oficial
                    </Text>
                </View>
                <TouchableOpacity
                    onPress={() => router.push('/(app)/wrapped' as any)}
                    style={{
                        backgroundColor: 'rgba(255,255,255,0.15)',
                        borderRadius: 10,
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                    }}
                >
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFFFFF' }}>🎁 Wrapped</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={COLORS.PRIMARY} />
                    <Text style={{ fontSize: 13, color: COLORS.TEXT_MUTED, marginTop: 12 }}>
                        Calculando sua inflação pessoal...
                    </Text>
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Forecast bar */}
                    {forecast && forecast.forecast > 0 && (
                        <ForecastBar
                            forecast={forecast.forecast}
                            currentSpent={forecast.currentSpent}
                            progressPercent={forecast.progressPercent}
                            daysLeft={forecast.daysLeft}
                            isOnTrack={forecast.isOnTrack}
                            currentMonth={forecast.currentMonth}
                        />
                    )}

                    {/* Months comparison */}
                    {forecast && forecast.lastMonths.length > 0 && (
                        <View style={{
                            backgroundColor: COLORS.SURFACE,
                            borderRadius: 16,
                            padding: 16,
                            marginBottom: 16,
                            borderWidth: 1,
                            borderColor: COLORS.BORDER,
                        }}>
                            <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.TEXT_MUTED, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>
                                Histórico Recente
                            </Text>
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                {forecast.lastMonths.map((m) => {
                                    const barPct = forecast.forecast > 0
                                        ? Math.min((m.total / forecast.forecast) * 100, 100)
                                        : 50;
                                    return (
                                        <View key={m.month} style={{ flex: 1, alignItems: 'center' }}>
                                            <View style={{
                                                height: 60,
                                                width: '100%',
                                                backgroundColor: COLORS.BG,
                                                borderRadius: 6,
                                                justifyContent: 'flex-end',
                                                overflow: 'hidden',
                                            }}>
                                                <View style={{
                                                    height: `${barPct}%`,
                                                    backgroundColor: COLORS.PRIMARY,
                                                    borderRadius: 6,
                                                    opacity: 0.7,
                                                }} />
                                            </View>
                                            <Text style={{ fontSize: 10, color: COLORS.TEXT_MUTED, marginTop: 4, fontWeight: '600' }}>
                                                {m.label}
                                            </Text>
                                            <Text style={{ fontSize: 10, color: COLORS.TEXT, fontWeight: '700' }}>
                                                {fmt(m.total)}
                                            </Text>
                                        </View>
                                    );
                                })}
                                <View style={{ flex: 1, alignItems: 'center' }}>
                                    <View style={{
                                        height: 60,
                                        width: '100%',
                                        backgroundColor: COLORS.PRIMARY_LIGHT,
                                        borderRadius: 6,
                                        borderWidth: 2,
                                        borderColor: COLORS.PRIMARY,
                                        borderStyle: 'dashed',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                    }}>
                                        <Text style={{ fontSize: 9, color: COLORS.PRIMARY, fontWeight: '700', textAlign: 'center' }}>
                                            Prev.
                                        </Text>
                                    </View>
                                    <Text style={{ fontSize: 10, color: COLORS.TEXT_MUTED, marginTop: 4, fontWeight: '600' }}>
                                        Próx.
                                    </Text>
                                    <Text style={{ fontSize: 10, color: COLORS.PRIMARY, fontWeight: '700' }}>
                                        {fmt(forecast.forecast)}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* Inflation card or no-data message */}
                    {inflation?.hasEnoughData ? (
                        <>
                            <InflationCard
                                personalInflation={inflation.personalInflation}
                                ipcaReference={inflation.ipcaReference}
                                period={inflation.period}
                                productCount={inflation.productCount}
                            />

                            {/* Top risers */}
                            {inflation.topRisers.length > 0 && (
                                <View style={{
                                    backgroundColor: COLORS.SURFACE,
                                    borderRadius: 16,
                                    padding: 16,
                                    marginBottom: 12,
                                    borderWidth: 1,
                                    borderColor: COLORS.BORDER,
                                }}>
                                    <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.DANGER, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>
                                        📈 Mais subiram
                                    </Text>
                                    <VariationList items={inflation.topRisers} type="riser" />
                                </View>
                            )}

                            {/* Top fallers */}
                            {inflation.topFallers.length > 0 && (
                                <View style={{
                                    backgroundColor: COLORS.SURFACE,
                                    borderRadius: 16,
                                    padding: 16,
                                    marginBottom: 12,
                                    borderWidth: 1,
                                    borderColor: COLORS.BORDER,
                                }}>
                                    <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.PRIMARY, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>
                                        📉 Ficaram mais baratos
                                    </Text>
                                    <VariationList items={inflation.topFallers} type="faller" />
                                </View>
                            )}
                        </>
                    ) : (
                        <View style={{
                            backgroundColor: COLORS.SURFACE,
                            borderRadius: 16,
                            padding: 24,
                            alignItems: 'center',
                            borderWidth: 1,
                            borderColor: COLORS.BORDER,
                        }}>
                            <Text style={{ fontSize: 32, marginBottom: 12 }}>📊</Text>
                            <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.TEXT, textAlign: 'center', marginBottom: 8 }}>
                                Dados insuficientes
                            </Text>
                            <Text style={{ fontSize: 13, color: COLORS.TEXT_MUTED, textAlign: 'center', lineHeight: 20 }}>
                                Escaneie notas de pelo menos 3 meses diferentes para calcular sua inflação pessoal.
                            </Text>
                            <Text style={{ fontSize: 12, color: COLORS.TEXT_MUTED, marginTop: 8 }}>
                                {inflation ? `${inflation.productCount} produto(s) rastreado(s)` : ''}
                            </Text>
                        </View>
                    )}
                </ScrollView>
            )}
        </View>
    );
}
