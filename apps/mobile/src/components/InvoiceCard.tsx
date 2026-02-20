import { View, Text, TouchableOpacity } from 'react-native';
import { Invoice } from '../types';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';

interface InvoiceCardProps {
    invoice: Invoice;
    onPress: () => void;
}

export const InvoiceCard = ({ invoice, onPress }: InvoiceCardProps) => {
    const date = new Date(invoice.date);
    const formattedDate = date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
    const formattedTime = date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
    });

    const formattedValue = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(invoice.totalValue);

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.7}
            style={{
                backgroundColor: COLORS.SURFACE,
                padding: 16,
                borderRadius: 16,
                marginBottom: 10,
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: COLORS.BORDER,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 1,
            }}
        >
            <View style={{
                width: 44, height: 44, borderRadius: 12,
                backgroundColor: COLORS.PRIMARY_LIGHT,
                justifyContent: 'center', alignItems: 'center', marginRight: 14,
            }}>
                <Ionicons name="receipt-outline" size={22} color={COLORS.PRIMARY} />
            </View>

            <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '700', color: COLORS.TEXT, fontSize: 15 }} numberOfLines={1}>
                    {invoice.establishmentName}
                </Text>
                <Text style={{ color: COLORS.TEXT_MUTED, fontSize: 12, marginTop: 3 }}>
                    {formattedDate} • {formattedTime}
                </Text>
            </View>

            <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontWeight: '800', color: COLORS.PRIMARY, fontSize: 16 }}>
                    {formattedValue}
                </Text>
                <Ionicons name="chevron-forward" size={14} color={COLORS.TEXT_MUTED} style={{ marginTop: 2 }} />
            </View>
        </TouchableOpacity>
    );
};
