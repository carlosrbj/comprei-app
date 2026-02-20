import { View, Text } from 'react-native';
import { COLORS } from '../../constants/colors';

interface BarItem {
    label: string;
    value: number;
}

interface BarChartProps {
    data: BarItem[];
    color?: string;
}

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);

export function BarChart({ data, color = COLORS.PRIMARY }: BarChartProps) {
    const maxValue = Math.max(...data.map((d) => d.value), 1);

    return (
        <View style={{ gap: 10 }}>
            {data.map((item, i) => (
                <View key={i} style={{ gap: 4 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ fontSize: 12, color: COLORS.TEXT, fontWeight: '500', flex: 1 }} numberOfLines={1}>
                            {item.label}
                        </Text>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.TEXT }}>
                            {formatCurrency(item.value)}
                        </Text>
                    </View>
                    <View style={{
                        height: 6,
                        backgroundColor: COLORS.BORDER,
                        borderRadius: 100,
                        overflow: 'hidden',
                    }}>
                        <View style={{
                            height: '100%',
                            borderRadius: 100,
                            width: `${Math.max((item.value / maxValue) * 100, 2)}%`,
                            backgroundColor: color,
                        }} />
                    </View>
                </View>
            ))}
        </View>
    );
}
