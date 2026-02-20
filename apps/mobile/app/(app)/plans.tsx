import { View, Text, TouchableOpacity, ScrollView, StatusBar, ActivityIndicator, Alert, Linking } from 'react-native';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { paymentsService, Plan, PlansResponse, SubscriptionStatus } from '../../src/services/payments';
import { COLORS } from '../../src/constants/colors';

const formatPrice = (price: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);

const FEATURE_COMPARISON: { label: string; free: string; pro: string }[] = [
    { label: 'Notas por mês', free: '20', pro: 'Ilimitado' },
    { label: 'Histórico', free: '30 dias', pro: 'Completo' },
    { label: 'Categorias', free: '5 fixas', pro: 'Todas (15+)' },
    { label: 'Dashboard básico', free: '✅', pro: '✅' },
    { label: 'Relatórios avançados', free: '❌', pro: '✅' },
    { label: 'Comparador de preços', free: '❌', pro: '✅' },
    { label: 'Alertas de orçamento', free: '❌', pro: '✅' },
    { label: 'Liberdade de Sexta 🍺', free: '❌', pro: '✅' },
    { label: 'Exportação PDF/CSV', free: '❌', pro: '✅' },
    { label: 'Modo Família', free: '❌', pro: 'Anual' },
];

function PlanCard({
    plan,
    isPopular,
    isCurrent,
    onSelect,
    loading,
}: {
    plan: Plan;
    isPopular: boolean;
    isCurrent: boolean;
    onSelect: () => void;
    loading: boolean;
}) {
    const isAnnual = plan.interval === 'year';
    const monthlyEquivalent = isAnnual ? plan.price / 12 : plan.price;

    return (
        <View style={{
            backgroundColor: COLORS.SURFACE,
            borderRadius: 20,
            borderWidth: 2,
            borderColor: isPopular ? COLORS.PRIMARY : COLORS.BORDER,
            overflow: 'hidden',
        }}>
            {/* Popular badge */}
            {isPopular && (
                <View style={{
                    backgroundColor: COLORS.PRIMARY,
                    paddingVertical: 6,
                    alignItems: 'center',
                }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.5 }}>
                        MAIS POPULAR
                    </Text>
                </View>
            )}

            <View style={{ padding: 20 }}>
                {/* Plan name */}
                <Text style={{
                    fontSize: 18,
                    fontWeight: '800',
                    color: COLORS.TEXT,
                    letterSpacing: -0.3,
                }}>
                    {plan.name}
                </Text>

                {/* Price */}
                <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 8 }}>
                    <Text style={{
                        fontSize: 36,
                        fontWeight: '800',
                        color: COLORS.TEXT,
                        letterSpacing: -1,
                    }}>
                        {formatPrice(plan.price)}
                    </Text>
                    <Text style={{
                        fontSize: 14,
                        color: COLORS.TEXT_MUTED,
                        marginLeft: 4,
                    }}>
                        /{isAnnual ? 'ano' : 'mês'}
                    </Text>
                </View>

                {/* Monthly equivalent for annual */}
                {isAnnual && (
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        marginTop: 4,
                    }}>
                        <Text style={{ fontSize: 12, color: COLORS.TEXT_MUTED }}>
                            = {formatPrice(monthlyEquivalent)}/mês
                        </Text>
                        <View style={{
                            backgroundColor: COLORS.DANGER_LIGHT,
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            borderRadius: 100,
                        }}>
                            <Text style={{ fontSize: 10, fontWeight: '700', color: COLORS.DANGER }}>
                                -{plan.discount}
                            </Text>
                        </View>
                    </View>
                )}

                {/* Features */}
                <View style={{ marginTop: 16, gap: 10 }}>
                    {plan.features.map((feature, idx) => (
                        <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Ionicons name="checkmark-circle" size={18} color={COLORS.PRIMARY} />
                            <Text style={{ fontSize: 13, color: COLORS.TEXT, flex: 1 }}>{feature}</Text>
                        </View>
                    ))}
                </View>

                {/* CTA */}
                <TouchableOpacity
                    onPress={onSelect}
                    disabled={isCurrent || loading}
                    activeOpacity={0.8}
                    style={{
                        backgroundColor: isCurrent ? COLORS.BG : isPopular ? COLORS.PRIMARY : COLORS.ACCENT,
                        borderRadius: 14,
                        padding: 16,
                        marginTop: 20,
                        alignItems: 'center',
                        opacity: loading ? 0.7 : 1,
                    }}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                        <Text style={{
                            fontSize: 15,
                            fontWeight: '700',
                            color: isCurrent ? COLORS.TEXT_MUTED : '#FFFFFF',
                        }}>
                            {isCurrent ? 'Plano Atual' : `Assinar ${plan.name}`}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

export default function Plans() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
    const [plansData, setPlansData] = useState<PlansResponse | null>(null);
    const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [plans, sub] = await Promise.all([
                paymentsService.getPlans(),
                paymentsService.getSubscription(),
            ]);
            setPlansData(plans);
            setSubscription(sub);
        } catch (error) {
            console.error('Error loading plans:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectPlan = async (plan: Plan) => {
        setCheckoutLoading(plan.id);
        try {
            const result = await paymentsService.createCheckout(
                plan.id as 'pro_monthly' | 'pro_annual',
            );

            if (result.url) {
                // Open Stripe checkout in browser
                await Linking.openURL(result.url);
            } else if (result.simulated) {
                // Dev mode: instant upgrade
                Alert.alert(
                    '✅ Upgrade Simulado!',
                    `Você agora é Pro (${plan.name})! Em produção, isso redirecionaria para o Stripe.`,
                    [{ text: 'OK', onPress: () => router.back() }],
                );
            }
        } catch (error: any) {
            Alert.alert(
                'Erro',
                error.response?.data?.message || 'Não foi possível iniciar o pagamento.',
            );
        } finally {
            setCheckoutLoading(null);
        }
    };

    const isPro = subscription?.plan === 'pro';

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
                {/* Decorative circles */}
                <View style={{
                    position: 'absolute', top: -30, right: -30,
                    width: 120, height: 120, borderRadius: 60,
                    backgroundColor: 'rgba(255,255,255,0.05)',
                }} />
                <View style={{
                    position: 'absolute', bottom: -40, left: -20,
                    width: 100, height: 100, borderRadius: 50,
                    backgroundColor: 'rgba(255,255,255,0.03)',
                }} />

                {/* Back button */}
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: 'rgba(255,255,255,0.15)',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginBottom: 16,
                    }}
                >
                    <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
                </TouchableOpacity>

                <Text style={{
                    fontSize: 28,
                    fontWeight: '800',
                    color: '#FFFFFF',
                    letterSpacing: -0.5,
                }}>
                    Comprei Pro
                </Text>
                <Text style={{
                    fontSize: 14,
                    color: 'rgba(255,255,255,0.65)',
                    marginTop: 6,
                    lineHeight: 20,
                }}>
                    Controle total dos seus gastos.{'\n'}Sem limites, sem surpresas.
                </Text>

                {/* Current plan indicator */}
                {isPro && (
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: 'rgba(76,175,125,0.3)',
                        borderWidth: 1,
                        borderColor: 'rgba(76,175,125,0.5)',
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 100,
                        alignSelf: 'flex-start',
                        marginTop: 12,
                    }}>
                        <Ionicons name="checkmark-circle" size={14} color={COLORS.PRIMARY} />
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFFFFF', marginLeft: 6 }}>
                            Você já é Pro!
                        </Text>
                    </View>
                )}
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
            >
                {loading ? (
                    <View style={{ alignItems: 'center', paddingVertical: 60 }}>
                        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
                        <Text style={{ fontSize: 14, color: COLORS.TEXT_MUTED, marginTop: 12 }}>
                            Carregando planos...
                        </Text>
                    </View>
                ) : (
                    <>
                        {/* Plan Cards */}
                        <View style={{ gap: 16 }}>
                            {plansData?.plans.map((plan) => (
                                <PlanCard
                                    key={plan.id}
                                    plan={plan}
                                    isPopular={plan.id === 'pro_monthly'}
                                    isCurrent={
                                        isPro &&
                                        subscription?.subscription?.plan === plan.id
                                    }
                                    onSelect={() => handleSelectPlan(plan)}
                                    loading={checkoutLoading === plan.id}
                                />
                            ))}
                        </View>

                        {/* Feature Comparison Table */}
                        <Text style={{
                            fontSize: 11,
                            fontWeight: '700',
                            color: COLORS.TEXT_MUTED,
                            textTransform: 'uppercase',
                            letterSpacing: 0.8,
                            marginTop: 32,
                            marginBottom: 12,
                            marginLeft: 4,
                        }}>
                            Comparativo de recursos
                        </Text>

                        <View style={{
                            backgroundColor: COLORS.SURFACE,
                            borderRadius: 16,
                            overflow: 'hidden',
                        }}>
                            {/* Table Header */}
                            <View style={{
                                flexDirection: 'row',
                                borderBottomWidth: 1,
                                borderBottomColor: COLORS.BORDER,
                                paddingHorizontal: 16,
                                paddingVertical: 12,
                            }}>
                                <Text style={{ flex: 2, fontSize: 12, fontWeight: '700', color: COLORS.TEXT_MUTED }}>
                                    Recurso
                                </Text>
                                <Text style={{ flex: 1, fontSize: 12, fontWeight: '700', color: COLORS.TEXT_MUTED, textAlign: 'center' }}>
                                    Grátis
                                </Text>
                                <Text style={{ flex: 1, fontSize: 12, fontWeight: '700', color: COLORS.PRIMARY, textAlign: 'center' }}>
                                    Pro
                                </Text>
                            </View>

                            {/* Table Rows */}
                            {FEATURE_COMPARISON.map((row, idx) => (
                                <View
                                    key={idx}
                                    style={{
                                        flexDirection: 'row',
                                        paddingHorizontal: 16,
                                        paddingVertical: 12,
                                        borderBottomWidth: idx < FEATURE_COMPARISON.length - 1 ? 1 : 0,
                                        borderBottomColor: COLORS.BORDER,
                                        backgroundColor: idx % 2 === 1 ? COLORS.BG : 'transparent',
                                    }}
                                >
                                    <Text style={{
                                        flex: 2,
                                        fontSize: 12,
                                        color: COLORS.TEXT,
                                        fontWeight: '500',
                                    }}>
                                        {row.label}
                                    </Text>
                                    <Text style={{
                                        flex: 1,
                                        fontSize: 12,
                                        color: COLORS.TEXT_MUTED,
                                        textAlign: 'center',
                                    }}>
                                        {row.free}
                                    </Text>
                                    <Text style={{
                                        flex: 1,
                                        fontSize: 12,
                                        color: COLORS.PRIMARY,
                                        fontWeight: '600',
                                        textAlign: 'center',
                                    }}>
                                        {row.pro}
                                    </Text>
                                </View>
                            ))}
                        </View>

                        {/* FAQ / Trust badges */}
                        <View style={{
                            marginTop: 24,
                            gap: 12,
                        }}>
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 10,
                            }}>
                                <Ionicons name="shield-checkmark" size={18} color={COLORS.PRIMARY} />
                                <Text style={{ fontSize: 12, color: COLORS.TEXT_MUTED, flex: 1 }}>
                                    Pagamento seguro via Stripe. Cancele a qualquer momento.
                                </Text>
                            </View>
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 10,
                            }}>
                                <Ionicons name="refresh" size={18} color={COLORS.PRIMARY} />
                                <Text style={{ fontSize: 12, color: COLORS.TEXT_MUTED, flex: 1 }}>
                                    Renovação automática. Sem surpresas ou taxas escondidas.
                                </Text>
                            </View>
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 10,
                            }}>
                                <Ionicons name="heart" size={18} color={COLORS.PRIMARY} />
                                <Text style={{ fontSize: 12, color: COLORS.TEXT_MUTED, flex: 1 }}>
                                    Sua assinatura apoia o desenvolvimento indie do app.
                                </Text>
                            </View>
                        </View>

                        {/* Version */}
                        <Text style={{
                            fontSize: 11,
                            color: COLORS.TEXT_MUTED,
                            textAlign: 'center',
                            marginTop: 24,
                        }}>
                            Comprei v1.0.0
                        </Text>
                    </>
                )}
            </ScrollView>
        </View>
    );
}
