import {
    View, Text, ScrollView, TouchableOpacity,
    ActivityIndicator, Alert, StyleSheet,
} from 'react-native';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { budgetsService, BudgetSuggestion } from '../../../src/services/budgets';
import { COLORS } from '../../../src/constants/colors';

const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

function SuggestionCard({
    suggestion,
    onAdopt,
    adopting,
}: {
    suggestion: BudgetSuggestion;
    onAdopt: () => void;
    adopting: boolean;
}) {
    return (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={[styles.iconBox, { backgroundColor: `${suggestion.color}18` }]}>
                    <Text style={styles.emoji}>{suggestion.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.categoryName}>{suggestion.categoryName}</Text>
                    <Text style={styles.avgText}>
                        Média: {formatCurrency(suggestion.averageSpent)}/mês
                    </Text>
                </View>
                <TouchableOpacity
                    style={[styles.adoptBtn, adopting && { opacity: 0.5 }]}
                    onPress={onAdopt}
                    disabled={adopting}
                    activeOpacity={0.8}
                >
                    {adopting ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <>
                            <Ionicons name="add" size={14} color="#fff" />
                            <Text style={styles.adoptBtnText}>Adotar</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            <View style={styles.statsRow}>
                <View style={styles.stat}>
                    <Text style={styles.statLabel}>Gasto médio</Text>
                    <Text style={[styles.statValue, { color: COLORS.SECONDARY }]}>
                        {formatCurrency(suggestion.averageSpent)}
                    </Text>
                </View>
                <Ionicons name="arrow-forward" size={14} color={COLORS.TEXT_MUTED} />
                <View style={[styles.stat, { alignItems: 'flex-end' }]}>
                    <Text style={styles.statLabel}>Meta sugerida (−10%)</Text>
                    <Text style={[styles.statValue, { color: COLORS.PRIMARY }]}>
                        {formatCurrency(suggestion.suggestedBudget)}
                    </Text>
                </View>
            </View>

            <View style={styles.tipRow}>
                <Ionicons name="information-circle-outline" size={14} color={COLORS.TEXT_MUTED} />
                <Text style={styles.tipText}>
                    Baseado na média dos últimos 3 meses com 10% de margem de economia
                </Text>
            </View>
        </View>
    );
}

export default function BudgetSuggestionsScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [suggestions, setSuggestions] = useState<BudgetSuggestion[]>([]);
    const [adoptingId, setAdoptingId] = useState<string | null>(null);

    useEffect(() => {
        budgetsService.getSuggestions()
            .then(setSuggestions)
            .catch(() => Alert.alert('Erro', 'Não foi possível carregar as sugestões'))
            .finally(() => setLoading(false));
    }, []);

    async function handleAdopt(suggestion: BudgetSuggestion) {
        setAdoptingId(suggestion.categoryId);
        try {
            await budgetsService.setBudget(suggestion.categoryId, suggestion.suggestedBudget);
            Alert.alert(
                'Meta criada! 🎯',
                `Meta de ${formatCurrency(suggestion.suggestedBudget)}/mês para ${suggestion.categoryName} foi salva.`,
                [
                    {
                        text: 'Ver Metas',
                        onPress: () => router.back(),
                    },
                    { text: 'Continuar', style: 'cancel' },
                ],
            );
        } catch {
            Alert.alert('Erro', 'Não foi possível criar a meta. Tente novamente.');
        } finally {
            setAdoptingId(null);
        }
    }

    return (
        <View style={{ flex: 1, backgroundColor: COLORS.BG }}>
            <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={22} color={COLORS.TEXT} />
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.title}>Sugestões 💡</Text>
                        <Text style={styles.subtitle}>Baseado no seu histórico de gastos</Text>
                    </View>
                </View>

                <View style={{ paddingHorizontal: 16 }}>
                    {/* Info banner */}
                    <View style={styles.infoBanner}>
                        <Text style={{ fontSize: 20 }}>🤖</Text>
                        <Text style={styles.infoText}>
                            Analisamos seus gastos dos últimos 3 meses e sugerimos metas realistas com 10% de margem para economia.
                        </Text>
                    </View>

                    {loading ? (
                        <View style={{ alignItems: 'center', paddingTop: 48 }}>
                            <ActivityIndicator size="large" color={COLORS.PRIMARY} />
                            <Text style={{ marginTop: 12, color: COLORS.TEXT_MUTED, fontSize: 13 }}>
                                Analisando seus gastos...
                            </Text>
                        </View>
                    ) : suggestions.length === 0 ? (
                        <View style={styles.emptyCard}>
                            <Text style={{ fontSize: 48, marginBottom: 16 }}>📊</Text>
                            <Text style={styles.emptyTitle}>Dados insuficientes</Text>
                            <Text style={styles.emptyBody}>
                                Escaneie mais notas fiscais para que o sistema possa analisar seus padrões de gasto e gerar sugestões personalizadas.
                            </Text>
                        </View>
                    ) : (
                        <>
                            {suggestions.map((s) => (
                                <SuggestionCard
                                    key={s.categoryId}
                                    suggestion={s}
                                    onAdopt={() => handleAdopt(s)}
                                    adopting={adoptingId === s.categoryId}
                                />
                            ))}

                            <TouchableOpacity
                                style={styles.manualBtn}
                                onPress={() => router.push('/(app)/budgets/new' as any)}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="add-circle-outline" size={20} color={COLORS.PRIMARY} />
                                <Text style={styles.manualBtnText}>Criar Meta Manualmente</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingTop: 56,
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    backBtn: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: COLORS.SURFACE,
        borderWidth: 1, borderColor: COLORS.BORDER,
        justifyContent: 'center', alignItems: 'center',
    },
    title: { fontSize: 26, fontWeight: '800', color: COLORS.TEXT, letterSpacing: -0.5 },
    subtitle: { fontSize: 13, color: COLORS.TEXT_MUTED, marginTop: 2 },

    infoBanner: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        backgroundColor: COLORS.ACCENT_LIGHT,
        borderRadius: 14,
        padding: 14,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: `${COLORS.ACCENT}20`,
    },
    infoText: {
        flex: 1,
        fontSize: 12,
        color: COLORS.ACCENT,
        lineHeight: 18,
        fontWeight: '500',
    },

    card: {
        backgroundColor: COLORS.SURFACE,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.BORDER,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 14,
    },
    iconBox: {
        width: 44, height: 44, borderRadius: 22,
        justifyContent: 'center', alignItems: 'center',
    },
    emoji: { fontSize: 22 },
    categoryName: { fontSize: 14, fontWeight: '700', color: COLORS.TEXT },
    avgText: { fontSize: 11, color: COLORS.TEXT_MUTED, marginTop: 2 },
    adoptBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: COLORS.PRIMARY,
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 7,
        minWidth: 72,
        justifyContent: 'center',
    },
    adoptBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },

    divider: {
        height: 1,
        backgroundColor: COLORS.BORDER,
        marginBottom: 14,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    stat: {},
    statLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: COLORS.TEXT_MUTED,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 3,
    },
    statValue: { fontSize: 16, fontWeight: '800' },

    tipRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 6,
    },
    tipText: {
        flex: 1,
        fontSize: 10,
        color: COLORS.TEXT_MUTED,
        lineHeight: 14,
    },

    emptyCard: {
        backgroundColor: COLORS.SURFACE,
        borderRadius: 20,
        padding: 32,
        borderWidth: 1,
        borderColor: COLORS.BORDER,
        alignItems: 'center',
        marginTop: 8,
    },
    emptyTitle: { fontSize: 18, fontWeight: '800', color: COLORS.TEXT, marginBottom: 8 },
    emptyBody: {
        fontSize: 13, color: COLORS.TEXT_MUTED,
        textAlign: 'center', lineHeight: 20,
    },

    manualBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: COLORS.SURFACE,
        borderRadius: 14,
        padding: 16,
        borderWidth: 1,
        borderColor: COLORS.BORDER,
        marginTop: 4,
    },
    manualBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.PRIMARY },
});
