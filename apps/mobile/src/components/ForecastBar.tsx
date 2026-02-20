import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS } from '../constants/colors';

const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

interface Props {
    forecast: number;
    currentSpent: number;
    progressPercent: number;
    daysLeft: number;
    isOnTrack: boolean;
    currentMonth: string;
}

export function ForecastBar({ forecast, currentSpent, progressPercent, daysLeft, isOnTrack, currentMonth }: Props) {
    const router = useRouter();

    if (forecast === 0) return null;

    const barColor = progressPercent >= 100
        ? COLORS.DANGER
        : progressPercent >= 80
        ? COLORS.SECONDARY
        : COLORS.PRIMARY;

    const barWidth = Math.min(progressPercent, 100);

    return (
        <TouchableOpacity
            onPress={() => router.push('/(app)/inflation' as any)}
            activeOpacity={0.85}
            style={{
                backgroundColor: COLORS.SURFACE,
                borderRadius: 16,
                padding: 16,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: COLORS.BORDER,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 2,
            }}
        >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <View>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: COLORS.TEXT_MUTED, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                        Previsão — {currentMonth}
                    </Text>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.TEXT, marginTop: 2 }}>
                        {fmt(currentSpent)} <Text style={{ fontSize: 12, fontWeight: '400', color: COLORS.TEXT_MUTED }}>de {fmt(forecast)}</Text>
                    </Text>
                </View>
                <View style={{
                    backgroundColor: isOnTrack ? COLORS.PRIMARY_LIGHT : COLORS.DANGER_LIGHT,
                    borderRadius: 100,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: isOnTrack ? COLORS.PRIMARY : COLORS.DANGER }}>
                        {isOnTrack ? '✓ No ritmo' : '⚠ Acima'}
                    </Text>
                </View>
            </View>

            {/* Progress bar */}
            <View style={{ height: 8, backgroundColor: COLORS.BORDER, borderRadius: 100, overflow: 'hidden' }}>
                <View style={{
                    height: 8,
                    width: `${barWidth}%`,
                    backgroundColor: barColor,
                    borderRadius: 100,
                }} />
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
                <Text style={{ fontSize: 11, color: COLORS.TEXT_MUTED }}>
                    {Math.round(progressPercent)}% do mês
                </Text>
                <Text style={{ fontSize: 11, color: COLORS.TEXT_MUTED }}>
                    {daysLeft} dias restantes
                </Text>
            </View>
        </TouchableOpacity>
    );
}
