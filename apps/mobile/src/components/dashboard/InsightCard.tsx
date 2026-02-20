import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';

interface InsightCardProps {
    title?: string;
    text: string;
    highlightedParts?: string[];
}

export function InsightCard({ title = 'Insight da Semana', text }: InsightCardProps) {
    return (
        <View style={{
            backgroundColor: COLORS.ACCENT,
            borderRadius: 16,
            padding: 18,
            marginBottom: 16,
            flexDirection: 'row',
            gap: 14,
            alignItems: 'flex-start',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 4,
        }}>
            <View style={{
                width: 40,
                height: 40,
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderRadius: 12,
                justifyContent: 'center',
                alignItems: 'center',
            }}>
                <Ionicons name="bulb" size={20} color={COLORS.SECONDARY} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={{
                    fontSize: 11,
                    fontWeight: '700',
                    color: 'rgba(255,255,255,0.5)',
                    textTransform: 'uppercase',
                    letterSpacing: 0.8,
                }}>
                    {title}
                </Text>
                <Text style={{
                    fontSize: 13,
                    color: '#FFFFFF',
                    lineHeight: 20,
                    marginTop: 4,
                    fontWeight: '500',
                }}>
                    {text}
                </Text>
            </View>
        </View>
    );
}
