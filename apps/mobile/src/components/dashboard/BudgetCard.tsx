import { View, Text } from 'react-native';
import { COLORS } from '../../constants/colors';

interface BudgetRow {
    emoji: string;
    name: string;
    spent: number;
    limit: number;
    color: string;
}

interface BudgetCardProps {
    rows: BudgetRow[];
}

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);

export function BudgetCard({ rows }: BudgetCardProps) {
    return (
        <View style={{
            backgroundColor: COLORS.SURFACE,
            borderRadius: 16,
            padding: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.08,
            shadowRadius: 16,
            elevation: 3,
            marginBottom: 16,
        }}>
            <Text style={{
                fontSize: 12,
                fontWeight: '700',
                color: COLORS.TEXT_MUTED,
                textTransform: 'uppercase',
                letterSpacing: 0.8,
                marginBottom: 16,
            }}>
                Orçamento por Categoria
            </Text>

            {rows.map((row, index) => {
                const pct = Math.min((row.spent / row.limit) * 100, 100);
                const isOver = row.spent > row.limit;

                return (
                    <View key={index} style={{ marginBottom: index < rows.length - 1 ? 14 : 0 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Text style={{ fontSize: 16 }}>{row.emoji}</Text>
                                <Text style={{ fontSize: 13, fontWeight: '500', color: COLORS.TEXT }}>{row.name}</Text>
                            </View>
                            <Text style={{ fontSize: 13, fontWeight: '700', color: isOver ? COLORS.DANGER : COLORS.TEXT }}>
                                {formatCurrency(row.spent)} / {formatCurrency(row.limit)}
                            </Text>
                        </View>
                        <View style={{
                            backgroundColor: '#F0F0ED',
                            borderRadius: 100,
                            height: 6,
                            overflow: 'hidden',
                        }}>
                            <View style={{
                                height: '100%',
                                borderRadius: 100,
                                width: `${pct}%`,
                                backgroundColor: isOver ? COLORS.DANGER : row.color,
                            }} />
                        </View>
                    </View>
                );
            })}
        </View>
    );
}
