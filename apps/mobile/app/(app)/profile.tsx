import { View, Text, TouchableOpacity, ScrollView, StatusBar, ActivityIndicator, Alert, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useState, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { useInvoiceStore } from '../../src/store/invoiceStore';
import { useOnboardingStore } from '../../src/store/onboardingStore';
import { usersService, UserProfile, UserStats, Badge } from '../../src/services/users';
import { COLORS } from '../../src/constants/colors';
import ExportModal from '../../src/components/ExportModal';

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);

function BadgeCard({ badge }: { badge: Badge }) {
    return (
        <View style={{
            backgroundColor: COLORS.SURFACE,
            borderRadius: 14,
            padding: 12,
            borderWidth: 1.5,
            borderColor: badge.unlocked ? COLORS.PRIMARY : COLORS.BORDER,
            opacity: badge.unlocked ? 1 : 0.5,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
        }}>
            <View style={{
                width: 40, height: 40, borderRadius: 12,
                backgroundColor: badge.unlocked ? COLORS.PRIMARY_LIGHT : `${COLORS.BORDER}80`,
                justifyContent: 'center', alignItems: 'center',
            }}>
                <Text style={{ fontSize: 18 }}>{badge.emoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.TEXT }}>
                    {badge.name}
                </Text>
                <Text style={{ fontSize: 10, color: COLORS.TEXT_MUTED, marginTop: 2, lineHeight: 14 }}>
                    {badge.description}
                </Text>
            </View>
            {!badge.unlocked && (
                <Text style={{ fontSize: 12 }}>🔒</Text>
            )}
        </View>
    );
}

function MenuItem({ emoji, label, onPress, badge, rightElement }: {
    emoji: string;
    label: string;
    onPress?: () => void;
    badge?: string;
    rightElement?: React.ReactNode;
}) {
    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.7}
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: COLORS.SURFACE,
                borderRadius: 14,
                padding: 14,
                marginBottom: 8,
                gap: 12,
            }}
        >
            <View style={{
                width: 36, height: 36, borderRadius: 10,
                backgroundColor: COLORS.BG,
                justifyContent: 'center', alignItems: 'center',
            }}>
                <Text style={{ fontSize: 16 }}>{emoji}</Text>
            </View>
            <Text style={{ flex: 1, fontSize: 14, fontWeight: '500', color: COLORS.TEXT }}>
                {label}
            </Text>
            {badge && (
                <View style={{
                    backgroundColor: COLORS.SECONDARY_LIGHT,
                    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100,
                }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: COLORS.SECONDARY }}>
                        {badge}
                    </Text>
                </View>
            )}
            {rightElement || (
                <Ionicons name="chevron-forward" size={16} color={COLORS.TEXT_MUTED} />
            )}
        </TouchableOpacity>
    );
}

export default function Profile() {
    const { user, signOut } = useAuthStore();
    const { invoices } = useInvoiceStore();
    const { reset: resetOnboarding } = useOnboardingStore();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [stats, setStats] = useState<UserStats | null>(null);
    const [showExportModal, setShowExportModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editName, setEditName] = useState('');
    const [savingProfile, setSavingProfile] = useState(false);

    useFocusEffect(
        useCallback(() => {
            let cancelled = false;
            (async () => {
                setLoading(true);
                try {
                    const [profileData, statsData] = await Promise.all([
                        usersService.getProfile(),
                        usersService.getStats(),
                    ]);
                    if (!cancelled) {
                        setProfile(profileData);
                        setStats(statsData);
                    }
                } catch (error) {
                    console.error('Error loading profile:', error);
                } finally {
                    if (!cancelled) setLoading(false);
                }
            })();
            return () => { cancelled = true; };
        }, [])
    );

    const handleLogout = () => {
        Alert.alert(
            'Sair',
            'Tem certeza que deseja sair da sua conta?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Sair',
                    style: 'destructive',
                    onPress: () => {
                        signOut();
                        router.replace('/auth/login');
                    },
                },
            ],
        );
    };

    const handleUpgrade = () => {
        router.push('/(app)/plans' as any);
    };

    const handleOpenEdit = () => {
        setEditName(displayName === 'Usuário' ? '' : displayName);
        setShowEditModal(true);
    };

    const handleSaveProfile = async () => {
        const trimmed = editName.trim();
        if (!trimmed || trimmed.length < 2) {
            Alert.alert('Nome inválido', 'O nome deve ter no mínimo 2 caracteres.');
            return;
        }
        setSavingProfile(true);
        try {
            const updated = await usersService.updateProfile({ name: trimmed });
            setProfile(updated);
            setShowEditModal(false);
        } catch (error: any) {
            Alert.alert('Erro', error?.response?.data?.message || 'Não foi possível salvar o perfil.');
        } finally {
            setSavingProfile(false);
        }
    };

    const handleResetOnboarding = () => {
        Alert.alert(
            'Refazer Tutorial',
            'Deseja ver o tutorial inicial novamente?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Sim',
                    onPress: () => {
                        resetOnboarding();
                        router.push('/onboarding' as any);
                    },
                },
            ],
        );
    };

    const isPro = profile?.plan === 'pro';
    const unlockedCount = stats?.badges.filter((b) => b.unlocked).length ?? 0;
    const totalBadges = stats?.badges.length ?? 0;

    // Fallback stats from local store while loading
    const displayInvoiceCount = stats?.invoiceCount ?? invoices.length;
    const displayName = profile?.name || user?.name || 'Usuário';
    const displayEmail = profile?.email || user?.email || '';

    return (
        <View style={{ flex: 1, backgroundColor: COLORS.BG }}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.PRIMARY} />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
                {/* Header with gradient */}
                <View style={{
                    backgroundColor: COLORS.PRIMARY,
                    paddingTop: 56,
                    paddingBottom: 40,
                    paddingHorizontal: 24,
                    position: 'relative',
                    overflow: 'hidden',
                }}>
                    {/* Decorative circle */}
                    <View style={{
                        position: 'absolute', top: -40, right: -40,
                        width: 160, height: 160, borderRadius: 80,
                        backgroundColor: 'rgba(255,255,255,0.08)',
                    }} />

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                        {/* Avatar */}
                        <View style={{
                            width: 64, height: 64, borderRadius: 32,
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            justifyContent: 'center', alignItems: 'center',
                            borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)',
                        }}>
                            <Text style={{ fontSize: 28 }}>
                                {displayName.charAt(0).toUpperCase()}
                            </Text>
                        </View>

                        <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Text style={{ fontSize: 22, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5 }}>
                                    {displayName}
                                </Text>
                                <TouchableOpacity onPress={handleOpenEdit} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                    <Ionicons name="pencil" size={14} color="rgba(255,255,255,0.7)" />
                                </TouchableOpacity>
                            </View>
                            <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>
                                {displayEmail}
                            </Text>

                            {/* Plan badge */}
                            <View style={{
                                flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
                                marginTop: 8,
                                backgroundColor: isPro ? 'rgba(245,166,35,0.3)' : 'rgba(255,255,255,0.2)',
                                borderWidth: 1,
                                borderColor: isPro ? 'rgba(245,166,35,0.5)' : 'rgba(255,255,255,0.3)',
                                paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100,
                            }}>
                                <Text style={{ fontSize: 11, fontWeight: '700', color: '#FFFFFF' }}>
                                    {isPro ? '⭐ Pro' : '🆓 Gratuito'}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Stats Cards */}
                <View style={{
                    flexDirection: 'row',
                    backgroundColor: COLORS.SURFACE,
                    borderRadius: 16,
                    marginHorizontal: 16,
                    marginTop: -20,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 16,
                    elevation: 4,
                    overflow: 'hidden',
                }}>
                    <View style={{ flex: 1, padding: 16, alignItems: 'center', borderRightWidth: 1, borderRightColor: COLORS.BORDER }}>
                        {loading ? (
                            <ActivityIndicator size="small" color={COLORS.PRIMARY} />
                        ) : (
                            <>
                                <Text style={{ fontSize: 24, fontWeight: '800', color: COLORS.TEXT }}>
                                    {displayInvoiceCount}
                                </Text>
                                <Text style={{ fontSize: 10, color: COLORS.TEXT_MUTED, marginTop: 2, fontWeight: '600' }}>
                                    Notas
                                </Text>
                            </>
                        )}
                    </View>
                    <View style={{ flex: 1, padding: 16, alignItems: 'center', borderRightWidth: 1, borderRightColor: COLORS.BORDER }}>
                        {loading ? (
                            <ActivityIndicator size="small" color={COLORS.PRIMARY} />
                        ) : (
                            <>
                                <Text style={{ fontSize: 24, fontWeight: '800', color: COLORS.TEXT }}>
                                    🔥 {stats?.streak ?? 0}
                                </Text>
                                <Text style={{ fontSize: 10, color: COLORS.TEXT_MUTED, marginTop: 2, fontWeight: '600' }}>
                                    Streak
                                </Text>
                            </>
                        )}
                    </View>
                    <View style={{ flex: 1, padding: 16, alignItems: 'center' }}>
                        {loading ? (
                            <ActivityIndicator size="small" color={COLORS.PRIMARY} />
                        ) : (
                            <>
                                <Text style={{ fontSize: 18, fontWeight: '800', color: COLORS.TEXT }}>
                                    {formatCurrency(stats?.savings ?? 0)}
                                </Text>
                                <Text style={{ fontSize: 10, color: COLORS.TEXT_MUTED, marginTop: 2, fontWeight: '600' }}>
                                    Economizado
                                </Text>
                            </>
                        )}
                    </View>
                </View>

                <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
                    {/* Pro Banner (only for free users) */}
                    {!isPro && (
                        <TouchableOpacity
                            onPress={handleUpgrade}
                            activeOpacity={0.8}
                            style={{
                                backgroundColor: COLORS.ACCENT,
                                borderRadius: 16,
                                padding: 16,
                                marginBottom: 20,
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 14,
                                overflow: 'hidden',
                                position: 'relative',
                            }}
                        >
                            {/* Decorative */}
                            <View style={{
                                position: 'absolute', right: -20, top: -20,
                                width: 100, height: 100, borderRadius: 50,
                                backgroundColor: 'rgba(255,255,255,0.06)',
                            }} />

                            <View style={{
                                width: 48, height: 48, borderRadius: 24,
                                backgroundColor: 'rgba(255,255,255,0.15)',
                                justifyContent: 'center', alignItems: 'center',
                            }}>
                                <Text style={{ fontSize: 22 }}>⭐</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}>
                                    Upgrade para Pro
                                </Text>
                                <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
                                    Liberdade de Sexta + Relatórios ilimitados
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.5)" />
                        </TouchableOpacity>
                    )}

                    {/* Badges Section */}
                    <Text style={{
                        fontSize: 11, fontWeight: '700', color: COLORS.TEXT_MUTED,
                        textTransform: 'uppercase', letterSpacing: 0.8,
                        marginBottom: 12, marginLeft: 4,
                    }}>
                        🏆 Conquistas ({unlockedCount}/{totalBadges})
                    </Text>

                    {loading ? (
                        <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                            <ActivityIndicator size="small" color={COLORS.PRIMARY} />
                        </View>
                    ) : (
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                            {stats?.badges.map((badge) => (
                                <View key={badge.id} style={{ width: '47%' }}>
                                    <BadgeCard badge={badge} />
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Settings Section */}
                    <Text style={{
                        fontSize: 11, fontWeight: '700', color: COLORS.TEXT_MUTED,
                        textTransform: 'uppercase', letterSpacing: 0.8,
                        marginBottom: 12, marginLeft: 4,
                    }}>
                        Configurações
                    </Text>

                    <MenuItem
                        emoji="🤝"
                        label="Chama o Trampo"
                        badge="Ganhe Pro"
                        onPress={() => router.push('/(app)/referral' as any)}
                    />
                    <MenuItem
                        emoji="🎯"
                        label="Metas Mensais"
                        onPress={() => router.push('/(app)/budgets' as any)}
                    />
                    <MenuItem
                        emoji="🏪"
                        label="Comparador de Preços"
                        badge="Pro"
                        onPress={() => isPro ? router.push('/(app)/compare' as any) : router.push('/(app)/plans' as any)}
                    />
                    <MenuItem
                        emoji="📈"
                        label="Inflação Pessoal"
                        badge="Pro"
                        onPress={() => isPro ? router.push('/(app)/inflation' as any) : router.push('/(app)/plans' as any)}
                    />
                    <MenuItem
                        emoji="🎁"
                        label={`Wrapped ${new Date().getFullYear()}`}
                        badge="Pro"
                        onPress={() => isPro ? router.push('/(app)/wrapped' as any) : router.push('/(app)/plans' as any)}
                    />
                    <MenuItem
                        emoji="🔔"
                        label="Notificações"
                        onPress={() => Alert.alert('Em breve', 'Configuração de notificações em desenvolvimento')}
                    />
                    <MenuItem
                        emoji="👨‍👩‍👧"
                        label="Modo Família"
                        badge="Anual"
                        onPress={() => isPro ? Alert.alert('Em breve', 'Modo Família em desenvolvimento') : router.push('/(app)/plans' as any)}
                    />
                    <MenuItem
                        emoji="📤"
                        label="Exportar Dados (PDF/CSV)"
                        badge="Pro"
                        onPress={() => setShowExportModal(true)}
                    />

                    <MenuItem
                        emoji="🎓"
                        label="Refazer Tutorial"
                        onPress={handleResetOnboarding}
                    />

                    {/* Dark Mode Toggle */}
                    <MenuItem
                        emoji="🌙"
                        label="Tema Escuro"
                        onPress={() => Alert.alert('Em breve', 'O tema escuro está em desenvolvimento e será liberado em breve.')}
                        rightElement={
                            <View style={{
                                backgroundColor: COLORS.BORDER,
                                paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100,
                            }}>
                                <Text style={{ fontSize: 10, fontWeight: '700', color: COLORS.TEXT_MUTED }}>
                                    Em breve
                                </Text>
                            </View>
                        }
                    />

                    {/* Logout */}
                    <TouchableOpacity
                        onPress={handleLogout}
                        activeOpacity={0.7}
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: COLORS.DANGER_LIGHT,
                            borderRadius: 14,
                            padding: 16,
                            marginTop: 12,
                            gap: 8,
                        }}
                    >
                        <Ionicons name="log-out-outline" size={20} color={COLORS.DANGER} />
                        <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.DANGER }}>
                            Sair da Conta
                        </Text>
                    </TouchableOpacity>

                    {/* App version */}
                    <Text style={{
                        fontSize: 11, color: COLORS.TEXT_MUTED, textAlign: 'center',
                        marginTop: 24,
                    }}>
                        Comprei v1.0.0
                    </Text>
                </View>
            </ScrollView>

            <ExportModal visible={showExportModal} onClose={() => setShowExportModal(false)} />

            {/* Edit Profile Modal */}
            <Modal visible={showEditModal} transparent animationType="fade" onRequestClose={() => setShowEditModal(false)}>
                <KeyboardAvoidingView
                    style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <View style={{
                        backgroundColor: COLORS.SURFACE,
                        borderRadius: 20,
                        padding: 24,
                        width: '88%',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 8 },
                        shadowOpacity: 0.15,
                        shadowRadius: 24,
                        elevation: 10,
                    }}>
                        <Text style={{ fontSize: 18, fontWeight: '800', color: COLORS.TEXT, marginBottom: 6 }}>
                            Editar Perfil
                        </Text>
                        <Text style={{ fontSize: 13, color: COLORS.TEXT_MUTED, marginBottom: 20 }}>
                            Como você quer ser chamado no Comprei?
                        </Text>

                        <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.TEXT_MUTED, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            Nome
                        </Text>
                        <TextInput
                            value={editName}
                            onChangeText={setEditName}
                            placeholder="Seu nome"
                            placeholderTextColor={COLORS.TEXT_MUTED}
                            autoFocus
                            style={{
                                borderWidth: 1.5,
                                borderColor: COLORS.BORDER,
                                borderRadius: 12,
                                padding: 14,
                                fontSize: 15,
                                color: COLORS.TEXT,
                                marginBottom: 20,
                            }}
                        />

                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            <TouchableOpacity
                                onPress={() => setShowEditModal(false)}
                                style={{
                                    flex: 1, padding: 14, borderRadius: 12,
                                    backgroundColor: COLORS.BG, alignItems: 'center',
                                }}
                            >
                                <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.TEXT_MUTED }}>
                                    Cancelar
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleSaveProfile}
                                disabled={savingProfile}
                                style={{
                                    flex: 1, padding: 14, borderRadius: 12,
                                    backgroundColor: COLORS.PRIMARY, alignItems: 'center',
                                    opacity: savingProfile ? 0.6 : 1,
                                }}
                            >
                                {savingProfile
                                    ? <ActivityIndicator size="small" color="#fff" />
                                    : <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>Salvar</Text>
                                }
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}
