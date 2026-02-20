import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { Invoice } from '../../types';

interface RecentPurchaseProps {
    invoice: Invoice;
    onPress: () => void;
}

// Map establishment names to emojis/colors heuristically
function getStoreStyle(name: string): { emoji: string; bgColor: string } {
    const lower = name.toLowerCase();
    if (lower.includes('atacad') || lower.includes('assaí') || lower.includes('makro'))
        return { emoji: '🏭', bgColor: COLORS.PRIMARY_LIGHT };
    if (lower.includes('farmácia') || lower.includes('farmacia') || lower.includes('drogaria') || lower.includes('droga'))
        return { emoji: '💊', bgColor: COLORS.DANGER_LIGHT };
    if (lower.includes('padaria') || lower.includes('panific'))
        return { emoji: '🥖', bgColor: COLORS.SECONDARY_LIGHT };
    if (lower.includes('hortifruti') || lower.includes('feira') || lower.includes('sacolão'))
        return { emoji: '🌿', bgColor: COLORS.PRIMARY_LIGHT };
    if (lower.includes('posto') || lower.includes('combustível'))
        return { emoji: '⛽', bgColor: COLORS.ACCENT_LIGHT };
    // Default: supermarket
    return { emoji: '🛒', bgColor: COLORS.SECONDARY_LIGHT };
}

export function RecentPurchase({ invoice, onPress }: RecentPurchaseProps) {
    const date = new Date(invoice.date);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const formattedDate = isToday
        ? `Hoje, ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
        : date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });

    const formattedValue = new Intl.NumberFormat('pt-BR', {
        style: 'currency', currency: 'BRL',
    }).format(invoice.totalValue);

    const { emoji, bgColor } = getStoreStyle(invoice.establishmentName);

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.7}
            style={{
                backgroundColor: COLORS.SURFACE,
                borderRadius: 12,
                padding: 14,
                marginBottom: 8,
                flexDirection: 'row',
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 1,
            }}
        >
            <View style={{
                width: 44, height: 44, borderRadius: 12,
                backgroundColor: bgColor,
                justifyContent: 'center', alignItems: 'center', marginRight: 12,
            }}>
                <Text style={{ fontSize: 20 }}>{emoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.TEXT }} numberOfLines={1}>
                    {invoice.establishmentName}
                </Text>
                <Text style={{ fontSize: 12, color: COLORS.TEXT_MUTED, marginTop: 2 }}>
                    {formattedDate}
                </Text>
            </View>
            <Text style={{ fontSize: 16, fontWeight: '800', color: COLORS.TEXT }}>
                {formattedValue}
            </Text>
        </TouchableOpacity>
    );
}
