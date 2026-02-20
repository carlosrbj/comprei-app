import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Share, StatusBar } from 'react-native';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { fridayService, FridayData } from '../../src/services/friday';
import { COLORS } from '../../src/constants/colors';

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const EMOJIS = ['🍺', '🎬', '🍕', '🏖️'];

export default function Liberdade() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<FridayData | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const result = await fridayService.getCurrentWeek();
            setData(result);
        } catch (error) {
            console.error('Error loading Friday data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleShare = async () => {
        if (!data) return;
        try {
            await Share.share({
                message: `🍺 Economizei ${formatCurrency(data.savedAmount)} essa semana! #LiberdadeDeSexta #CompreiApp`,
            });
        } catch {}
    };

    const randomEmoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];

    if (loading) {
        return (
            <View style={{ flex: 1, backgroundColor: COLORS.DARK_BG, justifyContent: 'center', alignItems: 'center' }}>
                <StatusBar barStyle="light-content" backgroundColor={COLORS.DARK_BG} />
                <ActivityIndicator size="large" color={COLORS.SECONDARY} />
            </View>
        );
    }

    const hasSavings = data && data.savedAmount > 0;
    const categories = data ? Object.entries(data.categoryBreakdown) : [];

    return (
        <View style={{ flex: 1, backgroundColor: COLORS.DARK_BG }}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.DARK_BG} />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                {/* Header */}
                <View style={{ paddingHorizontal: 24, paddingTop: 56 }}>
                    {/* Back button */}
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={{
                            width: 36, height: 36, borderRadius: 18,
                            backgroundColor: 'rgba(255,255,255,0.1)',
                            justifyContent: 'center', alignItems: 'center',
                            marginBottom: 32,
                        }}
                    >
                        <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
                    </TouchableOpacity>

                    {/* Big emoji */}
                    <Text style={{ fontSize: 72, textAlign: 'center', marginBottom: 16 }}>
                        {randomEmoji}
                    </Text>

                    {/* Label */}
                    <Text style={{
                        fontSize: 10, fontWeight: '700', color: 'rgba(245,166,35,0.7)',
                        textAlign: 'center', textTransform: 'uppercase',
                        letterSpacing: 2, marginBottom: 8,
                    }}>
                        Liberdade de Sexta
                    </Text>

                    {/* Amount */}
                    {hasSavings ? (
                        <Text style={{
                            fontSize: 48, fontWeight: '800', color: '#FFFFFF',
                            textAlign: 'center', letterSpacing: -2,
                        }}>
                            <Text style={{ color: COLORS.SECONDARY }}>
                                {formatCurrency(data.savedAmount)}
                            </Text>
                        </Text>
                    ) : (
                        <Text style={{
                            fontSize: 36, fontWeight: '800', color: '#FFFFFF',
                            textAlign: 'center', letterSpacing: -1,
                        }}>
                            R$ 0,00
                        </Text>
                    )}

                    {/* Message */}
                    <Text style={{
                        fontSize: 15, color: 'rgba(255,255,255,0.65)',
                        textAlign: 'center', lineHeight: 22,
                        marginTop: 12, paddingHorizontal: 16,
                    }}>
                        {hasSavings
                            ? 'Você economizou essa semana!\nIsso é suficiente para aproveitar bem o fim de semana. 🎉'
                            : 'Nenhuma economia em supérfluos essa semana.\nContinue escaneando suas notas para acompanhar!'}
                    </Text>
                </View>

                {/* Category Breakdown */}
                {categories.length > 0 && (
                    <View style={{
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
                        borderRadius: 20, marginHorizontal: 24,
                        marginTop: 32, padding: 20,
                    }}>
                        <Text style={{
                            fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.4)',
                            textTransform: 'uppercase', letterSpacing: 1.5,
                            marginBottom: 12,
                        }}>
                            📋 Economia por Categoria
                        </Text>

                        {categories.map(([category, amount]) => (
                            <View key={category} style={{
                                flexDirection: 'row', alignItems: 'center',
                                justifyContent: 'space-between',
                                paddingVertical: 10,
                                borderBottomWidth: 1,
                                borderBottomColor: 'rgba(255,255,255,0.05)',
                            }}>
                                <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', flex: 1 }}>
                                    {category}
                                </Text>
                                <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFFFFF' }}>
                                    {formatCurrency(amount)}
                                </Text>
                            </View>
                        ))}

                        {/* Comparison */}
                        {data && data.lastWeekSuperfluous > 0 && (
                            <View style={{
                                flexDirection: 'row', alignItems: 'center',
                                marginTop: 12, gap: 8,
                            }}>
                                <View style={{
                                    backgroundColor: 'rgba(76,175,125,0.2)',
                                    paddingHorizontal: 8, paddingVertical: 4,
                                    borderRadius: 100,
                                }}>
                                    <Text style={{ fontSize: 10, fontWeight: '700', color: COLORS.PRIMARY }}>
                                        ↓ {Math.round((1 - data.totalSuperfluous / data.lastWeekSuperfluous) * 100)}%
                                    </Text>
                                </View>
                                <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                                    vs semana passada
                                </Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Suggestions */}
                {data && data.suggestions.length > 0 && hasSavings && (
                    <View style={{ paddingHorizontal: 24, marginTop: 24 }}>
                        <Text style={{
                            fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.4)',
                            textTransform: 'uppercase', letterSpacing: 1.5,
                            marginBottom: 12,
                        }}>
                            🎯 Com {formatCurrency(data.savedAmount)} você pode...
                        </Text>

                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            {data.suggestions.map((suggestion, index) => (
                                <View key={index} style={{
                                    flex: 1,
                                    backgroundColor: 'rgba(255,255,255,0.06)',
                                    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
                                    borderRadius: 16, padding: 16,
                                }}>
                                    <Text style={{ fontSize: 28, marginBottom: 8 }}>
                                        {suggestion.emoji}
                                    </Text>
                                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#FFFFFF' }}>
                                        {suggestion.text}
                                    </Text>
                                    <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
                                        ~{formatCurrency(suggestion.value)}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Share Button */}
                {hasSavings && (
                    <View style={{ paddingHorizontal: 24, marginTop: 32 }}>
                        <TouchableOpacity
                            onPress={handleShare}
                            activeOpacity={0.8}
                            style={{
                                backgroundColor: COLORS.SECONDARY,
                                borderRadius: 16,
                                paddingVertical: 16,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8,
                                shadowColor: COLORS.SECONDARY,
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.4,
                                shadowRadius: 8,
                                elevation: 6,
                            }}
                        >
                            <Text style={{ fontSize: 18 }}>📤</Text>
                            <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF' }}>
                                Compartilhar no Stories
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Footer */}
                <Text style={{
                    fontSize: 11, color: 'rgba(255,255,255,0.2)',
                    textAlign: 'center', marginTop: 32,
                }}>
                    Exclusivo para assinantes Pro ⭐
                </Text>
            </ScrollView>
        </View>
    );
}
