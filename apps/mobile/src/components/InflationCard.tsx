import { View, Text } from 'react-native';
import { COLORS } from '../constants/colors';
import type { ProductVariation } from '../services/insights';

const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const fmtPct = (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(1)}%`;

interface Props {
    personalInflation: number;
    ipcaReference: number;
    period: string;
    productCount: number;
}

interface VariationListProps {
    items: ProductVariation[];
    type: 'riser' | 'faller';
}

function VariationRow({ item, type }: { item: ProductVariation; type: 'riser' | 'faller' }) {
    const isRiser = type === 'riser';
    const color = isRiser ? COLORS.DANGER : COLORS.PRIMARY;
    const bg = isRiser ? COLORS.DANGER_LIGHT : COLORS.PRIMARY_LIGHT;

    return (
        <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 8,
            borderBottomWidth: 1,
            borderBottomColor: COLORS.BORDER,
            gap: 10,
        }}>
            <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: COLORS.TEXT }} numberOfLines={1}>
                    {item.product}
                </Text>
                <Text style={{ fontSize: 11, color: COLORS.TEXT_MUTED, marginTop: 2 }}>
                    {fmt(item.oldAvgPrice)} → {fmt(item.newAvgPrice)}
                </Text>
            </View>
            <View style={{ backgroundColor: bg, borderRadius: 100, paddingHorizontal: 8, paddingVertical: 3 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color }}>
                    {fmtPct(item.variation)}
                </Text>
            </View>
        </View>
    );
}

export function VariationList({ items, type }: VariationListProps) {
    if (items.length === 0) return null;
    return (
        <View>
            {items.map((item, idx) => (
                <VariationRow key={idx} item={item} type={type} />
            ))}
        </View>
    );
}

export function InflationCard({ personalInflation, ipcaReference, period, productCount }: Props) {
    const diff = personalInflation - ipcaReference;
    const isAboveIpca = diff > 0;
    const inflationColor = personalInflation > 10
        ? COLORS.DANGER
        : personalInflation > 5
        ? COLORS.SECONDARY
        : COLORS.PRIMARY;

    return (
        <View style={{
            backgroundColor: COLORS.ACCENT,
            borderRadius: 20,
            padding: 20,
            marginBottom: 16,
            overflow: 'hidden',
            position: 'relative',
        }}>
            {/* Decorative circle */}
            <View style={{
                position: 'absolute', top: -30, right: -30,
                width: 120, height: 120, borderRadius: 60,
                backgroundColor: 'rgba(255,255,255,0.06)',
            }} />

            <Text style={{ fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                Inflação Pessoal — {period}
            </Text>

            <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginTop: 6, gap: 12 }}>
                <Text style={{ fontSize: 44, fontWeight: '800', color: '#FFFFFF', letterSpacing: -1 }}>
                    {personalInflation > 0 ? '+' : ''}{personalInflation.toFixed(1)}%
                </Text>
                <View style={{ paddingBottom: 6 }}>
                    <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>sua cesta</Text>
                </View>
            </View>

            {/* IPCA comparison */}
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: 12,
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderRadius: 12,
                padding: 12,
                gap: 10,
            }}>
                <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>IPCA oficial</Text>
                    <Text style={{ fontSize: 18, fontWeight: '800', color: '#FFFFFF', marginTop: 2 }}>
                        +{ipcaReference.toFixed(1)}%
                    </Text>
                </View>
                <View style={{ width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.15)' }} />
                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>Diferença</Text>
                    <Text style={{
                        fontSize: 18, fontWeight: '800', marginTop: 2,
                        color: isAboveIpca ? '#FF8A80' : '#69F0AE',
                    }}>
                        {diff > 0 ? '+' : ''}{diff.toFixed(1)}%
                    </Text>
                </View>
            </View>

            <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 10 }}>
                Baseado em {productCount} produtos recorrentes
            </Text>
        </View>
    );
}
