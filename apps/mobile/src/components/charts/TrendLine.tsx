import { View, Text, Dimensions } from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText } from 'react-native-svg';
import { COLORS } from '../../constants/colors';

interface TrendPoint {
    label: string;
    value: number;
}

interface TrendLineProps {
    data: TrendPoint[];
    height?: number;
}

export function TrendLine({ data, height = 140 }: TrendLineProps) {
    const screenWidth = Dimensions.get('window').width;
    const width = screenWidth - 72; // card padding
    const paddingLeft = 10;
    const paddingRight = 10;
    const paddingTop = 16;
    const paddingBottom = 30;
    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    if (data.length < 2) {
        return (
            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <Text style={{ fontSize: 13, color: COLORS.TEXT_MUTED }}>
                    Dados insuficientes para o gráfico
                </Text>
            </View>
        );
    }

    const values = data.map((d) => d.value);
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);
    const range = maxValue - minValue || 1;

    const points = data.map((item, i) => ({
        x: paddingLeft + (i / (data.length - 1)) * chartWidth,
        y: paddingTop + ((maxValue - item.value) / range) * chartHeight,
        value: item.value,
        label: item.label,
    }));

    // Smooth curve path (using quadratic bezier for smoothness)
    let pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        const cpx = (prev.x + curr.x) / 2;
        pathD += ` Q ${cpx} ${prev.y} ${(cpx + curr.x) / 2} ${(prev.y + curr.y) / 2}`;
    }
    // Finish with the last point
    const last = points[points.length - 1];
    pathD += ` L ${last.x} ${last.y}`;

    // Simpler version: just line segments
    const simplePathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

    // Filled area path
    const areaD = `${simplePathD} L ${last.x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`;

    return (
        <View style={{ height: height + 10 }}>
            <Svg width={width} height={height + 10}>
                {/* Horizontal grid lines */}
                {[0, 0.5, 1].map((pct, i) => {
                    const y = paddingTop + chartHeight * pct;
                    return (
                        <Line
                            key={i}
                            x1={paddingLeft}
                            y1={y}
                            x2={paddingLeft + chartWidth}
                            y2={y}
                            stroke={COLORS.BORDER}
                            strokeWidth={0.5}
                            strokeDasharray="4 4"
                        />
                    );
                })}

                {/* Filled area */}
                <Path
                    d={areaD}
                    fill={`${COLORS.PRIMARY}15`}
                />

                {/* Line */}
                <Path
                    d={simplePathD}
                    stroke={COLORS.PRIMARY}
                    strokeWidth={2.5}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* Points */}
                {points.map((p, i) => (
                    <Circle
                        key={i}
                        cx={p.x}
                        cy={p.y}
                        r={4}
                        fill={COLORS.PRIMARY}
                        stroke="#FFFFFF"
                        strokeWidth={2}
                    />
                ))}

                {/* X-axis labels */}
                {points.map((p, i) => (
                    <SvgText
                        key={`lbl-${i}`}
                        x={p.x}
                        y={height}
                        fontSize={10}
                        fill={COLORS.TEXT_MUTED}
                        textAnchor="middle"
                        fontWeight="600"
                    >
                        {p.label}
                    </SvgText>
                ))}
            </Svg>
        </View>
    );
}
