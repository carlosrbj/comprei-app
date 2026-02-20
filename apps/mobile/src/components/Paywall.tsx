import { View, Text, TouchableOpacity, Modal, ActivityIndicator, Alert } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS } from '../constants/colors';

interface PaywallProps {
    visible: boolean;
    onClose: () => void;
    feature?: string;
}

const FEATURES = [
    { emoji: '♾️', text: 'Notas ilimitadas' },
    { emoji: '📊', text: 'Relatórios avançados' },
    { emoji: '🍺', text: 'Liberdade de Sexta' },
    { emoji: '💰', text: 'Comparador de preços' },
    { emoji: '🔔', text: 'Alertas de orçamento' },
    { emoji: '📤', text: 'Exportação PDF/CSV' },
];

export default function Paywall({ visible, onClose, feature }: PaywallProps) {
    const router = useRouter();

    const handleViewPlans = () => {
        onClose();
        router.push('/(app)/plans' as any);
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={onClose}
        >
            <View style={{
                flex: 1,
                backgroundColor: 'rgba(0,0,0,0.5)',
                justifyContent: 'flex-end',
            }}>
                <View style={{
                    backgroundColor: COLORS.SURFACE,
                    borderTopLeftRadius: 24,
                    borderTopRightRadius: 24,
                    paddingTop: 12,
                    paddingBottom: 40,
                    paddingHorizontal: 24,
                }}>
                    {/* Handle bar */}
                    <View style={{
                        width: 40,
                        height: 4,
                        borderRadius: 2,
                        backgroundColor: COLORS.BORDER,
                        alignSelf: 'center',
                        marginBottom: 20,
                    }} />

                    {/* Close button */}
                    <TouchableOpacity
                        onPress={onClose}
                        style={{
                            position: 'absolute',
                            top: 16,
                            right: 16,
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            backgroundColor: COLORS.BG,
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                    >
                        <Ionicons name="close" size={18} color={COLORS.TEXT_MUTED} />
                    </TouchableOpacity>

                    {/* Icon */}
                    <View style={{
                        width: 64,
                        height: 64,
                        borderRadius: 32,
                        backgroundColor: COLORS.SECONDARY_LIGHT,
                        justifyContent: 'center',
                        alignItems: 'center',
                        alignSelf: 'center',
                        marginBottom: 16,
                    }}>
                        <Text style={{ fontSize: 30 }}>⭐</Text>
                    </View>

                    {/* Title */}
                    <Text style={{
                        fontSize: 22,
                        fontWeight: '800',
                        color: COLORS.TEXT,
                        textAlign: 'center',
                        letterSpacing: -0.5,
                    }}>
                        Desbloqueie o Comprei Pro
                    </Text>

                    {/* Subtitle */}
                    <Text style={{
                        fontSize: 14,
                        color: COLORS.TEXT_MUTED,
                        textAlign: 'center',
                        marginTop: 8,
                        lineHeight: 20,
                    }}>
                        {feature
                            ? `"${feature}" é exclusivo para assinantes Pro.`
                            : 'Acesse todos os recursos e tenha controle total dos seus gastos.'}
                    </Text>

                    {/* Features list */}
                    <View style={{
                        marginTop: 24,
                        gap: 12,
                    }}>
                        {FEATURES.map((feat, idx) => (
                            <View key={idx} style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 12,
                            }}>
                                <View style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 10,
                                    backgroundColor: COLORS.PRIMARY_LIGHT,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                }}>
                                    <Text style={{ fontSize: 16 }}>{feat.emoji}</Text>
                                </View>
                                <Text style={{
                                    fontSize: 14,
                                    fontWeight: '500',
                                    color: COLORS.TEXT,
                                }}>
                                    {feat.text}
                                </Text>
                            </View>
                        ))}
                    </View>

                    {/* CTA buttons */}
                    <TouchableOpacity
                        onPress={handleViewPlans}
                        activeOpacity={0.8}
                        style={{
                            backgroundColor: COLORS.PRIMARY,
                            borderRadius: 14,
                            padding: 16,
                            marginTop: 28,
                            alignItems: 'center',
                        }}
                    >
                        <Text style={{
                            fontSize: 16,
                            fontWeight: '700',
                            color: '#FFFFFF',
                        }}>
                            Ver Planos — a partir de R$4,99/mês
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={onClose}
                        activeOpacity={0.7}
                        style={{
                            padding: 12,
                            marginTop: 8,
                            alignItems: 'center',
                        }}
                    >
                        <Text style={{
                            fontSize: 13,
                            color: COLORS.TEXT_MUTED,
                        }}>
                            Agora não
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}
