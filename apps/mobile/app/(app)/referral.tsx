import { View, Text, TouchableOpacity, ScrollView, StatusBar, ActivityIndicator, Share, Alert } from 'react-native';
import { useState, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { referralService, ReferralStats } from '../../src/services/referral';
import { COLORS } from '../../src/constants/colors';

function ProgressDots({ total, filled }: { total: number; filled: number }) {
    return (
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            {Array.from({ length: total }).map((_, i) => (
                <View
                    key={i}
                    style={{
                        flex: 1,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: i < filled ? COLORS.PRIMARY : COLORS.BORDER,
                    }}
                />
            ))}
        </View>
    );
}

export default function Referral() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<ReferralStats | null>(null);
    const [copied, setCopied] = useState(false);

    useFocusEffect(
        useCallback(() => {
            let cancelled = false;
            (async () => {
                setLoading(true);
                try {
                    const data = await referralService.getStats();
                    if (!cancelled) setStats(data);
                } catch {
                    // Silently fail — offline or auth issue
                } finally {
                    if (!cancelled) setLoading(false);
                }
            })();
            return () => { cancelled = true; };
        }, [])
    );

    const referralCode = stats?.referralCode ?? '------';
    const deepLink = `comprei://r/${referralCode}`;

    const handleCopy = async () => {
        await Clipboard.setStringAsync(deepLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message: `🛒 Use o Comprei para controlar seus gastos de supermercado! Me indicou, te indico.\n\nBaixe agora e use meu código: ${referralCode}\n\nLink direto: ${deepLink}`,
                title: 'Chama o Trampo no Comprei!',
            });
        } catch {
            Alert.alert('Erro', 'Não foi possível compartilhar.');
        }
    };

    const filled = stats ? 3 - stats.neededForNextReward : 0;

    return (
        <View style={{ flex: 1, backgroundColor: COLORS.BG }}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.ACCENT} />

            {/* Header */}
            <View style={{
                backgroundColor: COLORS.ACCENT,
                paddingTop: 56,
                paddingBottom: 32,
                paddingHorizontal: 24,
                position: 'relative',
                overflow: 'hidden',
            }}>
                <View style={{
                    position: 'absolute',
                    top: -50, right: -50,
                    width: 180, height: 180, borderRadius: 90,
                    backgroundColor: 'rgba(76,175,125,0.12)',
                }} />

                <TouchableOpacity
                    onPress={() => router.back()}
                    style={{ marginBottom: 16 }}
                >
                    <Ionicons name="arrow-back" size={24} color="rgba(255,255,255,0.8)" />
                </TouchableOpacity>

                <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 }}>
                    Programa de Indicação
                </Text>
                <Text style={{ fontSize: 28, fontWeight: '800', color: '#FFFFFF', marginTop: 4, letterSpacing: -0.5 }}>
                    🤝 Chama o Trampo
                </Text>
                <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', marginTop: 8, lineHeight: 20 }}>
                    Indique 3 amigos e ganhe 1 mês Pro grátis!
                </Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                {loading ? (
                    <View style={{ alignItems: 'center', marginTop: 60 }}>
                        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
                    </View>
                ) : (
                    <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
                        {/* Referral Code Card */}
                        <View style={{
                            backgroundColor: COLORS.SURFACE,
                            borderRadius: 20,
                            padding: 24,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.08,
                            shadowRadius: 16,
                            elevation: 4,
                            marginBottom: 16,
                        }}>
                            <Text style={{
                                fontSize: 11, fontWeight: '700', color: COLORS.TEXT_MUTED,
                                textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12,
                            }}>
                                Seu código de indicação
                            </Text>

                            <View style={{
                                backgroundColor: COLORS.PRIMARY_LIGHT,
                                borderRadius: 14,
                                paddingVertical: 16,
                                paddingHorizontal: 20,
                                alignItems: 'center',
                                marginBottom: 16,
                            }}>
                                <Text style={{
                                    fontSize: 32, fontWeight: '800', color: COLORS.PRIMARY,
                                    letterSpacing: 8,
                                }}>
                                    {referralCode}
                                </Text>
                            </View>

                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                <TouchableOpacity
                                    onPress={handleCopy}
                                    style={{
                                        flex: 1,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 8,
                                        backgroundColor: copied ? COLORS.PRIMARY_LIGHT : COLORS.BG,
                                        borderRadius: 12,
                                        borderWidth: 1.5,
                                        borderColor: copied ? COLORS.PRIMARY : COLORS.BORDER,
                                        paddingVertical: 12,
                                    }}
                                >
                                    <Ionicons
                                        name={copied ? 'checkmark' : 'copy-outline'}
                                        size={16}
                                        color={copied ? COLORS.PRIMARY : COLORS.TEXT_MUTED}
                                    />
                                    <Text style={{
                                        fontSize: 13, fontWeight: '600',
                                        color: copied ? COLORS.PRIMARY : COLORS.TEXT_MUTED,
                                    }}>
                                        {copied ? 'Copiado!' : 'Copiar link'}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={handleShare}
                                    style={{
                                        flex: 1,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 8,
                                        backgroundColor: COLORS.PRIMARY,
                                        borderRadius: 12,
                                        paddingVertical: 12,
                                    }}
                                >
                                    <Ionicons name="share-outline" size={16} color="#FFFFFF" />
                                    <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFFFFF' }}>
                                        Compartilhar
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Progress Card */}
                        <View style={{
                            backgroundColor: COLORS.SURFACE,
                            borderRadius: 20,
                            padding: 20,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.08,
                            shadowRadius: 16,
                            elevation: 4,
                            marginBottom: 16,
                        }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <View>
                                    <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.TEXT_MUTED }}>
                                        Amigos indicados
                                    </Text>
                                    <Text style={{ fontSize: 32, fontWeight: '800', color: COLORS.TEXT, marginTop: 2 }}>
                                        {stats?.referralCount ?? 0}
                                    </Text>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    {(stats?.proMonthsEarned ?? 0) > 0 && (
                                        <View style={{
                                            backgroundColor: COLORS.SECONDARY_LIGHT,
                                            paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100,
                                        }}>
                                            <Text style={{ fontSize: 11, fontWeight: '700', color: COLORS.SECONDARY }}>
                                                ⭐ {stats?.proMonthsEarned} {stats?.proMonthsEarned === 1 ? 'mês' : 'meses'} Pro ganhos
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </View>

                            <ProgressDots total={3} filled={filled} />

                            <Text style={{ fontSize: 12, color: COLORS.TEXT_MUTED, marginTop: 10 }}>
                                {stats?.neededForNextReward === 0
                                    ? '🎉 Recompensa desbloqueada!'
                                    : `Faltam ${stats?.neededForNextReward} indicação(ões) para ganhar 1 mês Pro`}
                            </Text>
                        </View>

                        {/* How it works */}
                        <View style={{
                            backgroundColor: COLORS.SURFACE,
                            borderRadius: 20,
                            padding: 20,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.08,
                            shadowRadius: 16,
                            elevation: 4,
                            marginBottom: 16,
                        }}>
                            <Text style={{
                                fontSize: 13, fontWeight: '700', color: COLORS.TEXT,
                                marginBottom: 16,
                            }}>
                                Como funciona
                            </Text>

                            {[
                                { step: '1', icon: '📤', text: 'Compartilhe seu código com amigos' },
                                { step: '2', icon: '📱', text: 'Amigo baixa o app e cadastra com seu código' },
                                { step: '3', icon: '🎁', text: 'A cada 3 amigos, você ganha 1 mês Pro grátis!' },
                            ].map((item) => (
                                <View key={item.step} style={{
                                    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12,
                                }}>
                                    <View style={{
                                        width: 36, height: 36, borderRadius: 18,
                                        backgroundColor: COLORS.PRIMARY_LIGHT,
                                        justifyContent: 'center', alignItems: 'center',
                                    }}>
                                        <Text style={{ fontSize: 18 }}>{item.icon}</Text>
                                    </View>
                                    <Text style={{ flex: 1, fontSize: 13, color: COLORS.TEXT, lineHeight: 18 }}>
                                        {item.text}
                                    </Text>
                                </View>
                            ))}
                        </View>

                        {/* Recent referrals */}
                        {(stats?.referrals.length ?? 0) > 0 && (
                            <View style={{
                                backgroundColor: COLORS.SURFACE,
                                borderRadius: 20,
                                padding: 20,
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.08,
                                shadowRadius: 16,
                                elevation: 4,
                            }}>
                                <Text style={{
                                    fontSize: 13, fontWeight: '700', color: COLORS.TEXT_MUTED,
                                    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12,
                                }}>
                                    Amigos que entraram
                                </Text>

                                {stats?.referrals.map((r, i) => (
                                    <View key={i} style={{
                                        flexDirection: 'row', alignItems: 'center', gap: 12,
                                        paddingVertical: 10,
                                        borderBottomWidth: i < (stats.referrals.length - 1) ? 1 : 0,
                                        borderBottomColor: COLORS.BORDER,
                                    }}>
                                        <View style={{
                                            width: 36, height: 36, borderRadius: 18,
                                            backgroundColor: COLORS.PRIMARY_LIGHT,
                                            justifyContent: 'center', alignItems: 'center',
                                        }}>
                                            <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.PRIMARY }}>
                                                {r.name.charAt(0).toUpperCase()}
                                            </Text>
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.TEXT }}>
                                                {r.name}
                                            </Text>
                                            <Text style={{ fontSize: 11, color: COLORS.TEXT_MUTED }}>
                                                {new Date(r.joinedAt).toLocaleDateString('pt-BR')}
                                            </Text>
                                        </View>
                                        {r.rewarded && (
                                            <Text style={{ fontSize: 12 }}>⭐</Text>
                                        )}
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>
        </View>
    );
}
