import { View, Text } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { COLORS } from '../../constants/colors';

interface DonutSegment {
    label: string;
    value: number;
    color: string;
    emoji: string;
}

interface DonutChartProps {
    data: DonutSegment[];
    size?: number;
    strokeWidth?: number;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);

export function DonutChart({ data, size = 130, strokeWidth = 22 }: DonutChartProps) {
    const radius = (size - strokeWidth) / 2;
    const center = size / 2;
    const total = data.reduce((sum, item) => sum + item.value, 0);

    if (total === 0) return null;

    let currentAngle = 0;
    const segments = data.map((item) => {
        const percentage = (item.value / total) * 100;
        const sweep = (percentage / 100) * 360;
        const gap = 2; // small gap between segments
        const segment = {
            ...item,
            percentage,
            startAngle: currentAngle + gap / 2,
            endAngle: currentAngle + sweep - gap / 2,
        };
        currentAngle += sweep;
        return segment;
    });

    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
            {/* Donut SVG */}
            <View style={{ width: size, height: size }}>
                <Svg width={size} height={size}>
                    {segments.map((seg, i) => {
                        if (seg.endAngle - seg.startAngle < 1) return null;
                        return (
                            <Path
                                key={i}
                                d={arcPath(center, center, radius, seg.startAngle, seg.endAngle)}
                                stroke={seg.color}
                                strokeWidth={strokeWidth}
                                fill="none"
                                strokeLinecap="round"
                            />
                        );
                    })}
                </Svg>
                {/* Center text */}
                <View style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    justifyContent: 'center', alignItems: 'center',
                }}>
                    <Text style={{ fontSize: 10, color: COLORS.TEXT_MUTED, fontWeight: '600' }}>Total</Text>
                    <Text style={{ fontSize: 15, fontWeight: '800', color: COLORS.TEXT, marginTop: 1 }}>
                        {formatCurrency(total)}
                    </Text>
                </View>
            </View>

            {/* Legend */}
            <View style={{ flex: 1 }}>
                {data.slice(0, 5).map((item, i) => (
                    <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: item.color }} />
                        <Text style={{ fontSize: 11, color: COLORS.TEXT, flex: 1, fontWeight: '500' }} numberOfLines={1}>
                            {item.emoji} {item.label}
                        </Text>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: COLORS.TEXT }}>
                            {Math.round(item.value / total * 100)}%
                        </Text>
                    </View>
                ))}
                {data.length > 5 && (
                    <Text style={{ fontSize: 10, color: COLORS.TEXT_MUTED, marginTop: 2 }}>
                        +{data.length - 5} categorias
                    </Text>
                )}
            </View>
        </View>
    );
}
