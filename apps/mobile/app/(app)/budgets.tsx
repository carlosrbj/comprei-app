import {
    View, Text, ScrollView, TouchableOpacity,
    ActivityIndicator, Alert, StyleSheet,
} from 'react-native';
import { useState, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { budgetsService, Budget } from '../../src/services/budgets';
import { COLORS } from '../../src/constants/colors';

const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

function progressColor(pct: number): string {
    if (pct >= 100) return COLORS.DANGER;
    if (pct >= 80) return COLORS.SECONDARY;
    return COLORS.PRIMARY;
}

function BudgetCard({ budget, onDelete }: { budget: Budget; onDelete: () => void }) {
    const pct = Math.min(budget.percentage, 100);
    const color = progressColor(budget.percentage);

    const confirmDelete = () =>
        Alert.alert('Remover Meta', 'Deseja remover esta meta de orçamento?', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Remover', style: 'destructive', onPress: onDelete },
        ]);

    return (
        <View style={styles.card}>
            {/* Header */}
            <View style={styles.cardHeader}>
                <View style={styles.cardLeft}>
                    <View style={[styles.categoryIcon, { backgroundColor: `${color}18` }]}>
                        <Text style={styles.categoryEmoji}>
                            {budget.category?.emoji ?? '💰'}
                        </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.categoryName} numberOfLines={1}>
                            {budget.category?.name ?? 'Orçamento Geral'}
                        </Text>
                        <Text style={styles.budgetLimit}>
                            {formatCurrency(budget.amount)} / mês
                        </Text>
                    </View>
                </View>

                <View style={styles.cardRight}>
                    <View style={[styles.pctBadge, { backgroundColor: `${color}18` }]}>
                        <Text style={[styles.pctText, { color }]}>{budget.percentage}%</Text>
                    </View>
                    <TouchableOpacity onPress={confirmDelete} style={styles.deleteBtn}>
                        <Ionicons name="trash-outline" size={16} color={COLORS.TEXT_MUTED} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Progress bar */}
            <View style={styles.barBg}>
                <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: color }]} />
            </View>

            {/* Stats row */}
            <View style={styles.statsRow}>
                <View>
                    <Text style={styles.statLabel}>Gasto</Text>
                    <Text style={[styles.statValue, { color: COLORS.TEXT }]}>
                        {formatCurrency(budget.spent)}
                    </Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                    <Text style={styles.statLabel}>Dias restantes</Text>
                    <Text style={[styles.statValue, { color: COLORS.TEXT }]}>
                        {budget.daysLeftInPeriod}
                    </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.statLabel}>
                        {budget.isOver ? 'Excedido' : 'Restante'}
                    </Text>
                    <Text style={[styles.statValue, { color: budget.isOver ? COLORS.DANGER : COLORS.PRIMARY }]}>
                        {budget.isOver
                            ? formatCurrency(budget.spent - budget.amount)
                            : formatCurrency(budget.remaining)}
                    </Text>
                </View>
            </View>

            {/* Over budget warning */}
            {budget.isOver && (
                <View style={styles.warningRow}>
                    <Text style={{ fontSize: 14 }}>⚠️</Text>
                    <Text style={styles.warningText}>
                        Orçamento ultrapassado em {formatCurrency(budget.spent - budget.amount)}
                    </Text>
                </View>
            )}
        </View>
    );
}

export default function BudgetsScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [budgets, setBudgets] = useState<Budget[]>([]);

    const loadBudgets = useCallback(async () => {
        setLoading(true);
        try {
            const data = await budgetsService.getBudgets();
            setBudgets(data);
        } catch {
            Alert.alert('Erro', 'Não foi possível carregar as metas');
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(useCallback(() => { loadBudgets(); }, [loadBudgets]));

    async function handleDelete(budgetId: string) {
        try {
            await budgetsService.deleteBudget(budgetId);
            setBudgets((prev) => prev.filter((b) => b.id !== budgetId));
        } catch {
            Alert.alert('Erro', 'Não foi possível remover a meta');
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
                        <Text style={styles.title}>Metas 🎯</Text>
                        <Text style={styles.subtitle}>Defina limites e controle seus gastos</Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => router.push('/(app)/budgets/new' as any)}
                        style={styles.addBtn}
                    >
                        <Ionicons name="add" size={20} color="#fff" />
                        <Text style={styles.addBtnText}>Nova</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ paddingHorizontal: 16 }}>
                    {loading ? (
                        <View style={{ alignItems: 'center', paddingTop: 48 }}>
                            <ActivityIndicator size="large" color={COLORS.PRIMARY} />
                        </View>
                    ) : budgets.length === 0 ? (
                        /* Empty state */
                        <View style={styles.emptyCard}>
                            <Text style={{ fontSize: 48, marginBottom: 16 }}>🎯</Text>
                            <Text style={styles.emptyTitle}>Nenhuma Meta Definida</Text>
                            <Text style={styles.emptyBody}>
                                Defina metas mensais para manter seus gastos sob controle e receber alertas automáticos.
                            </Text>
                            <TouchableOpacity
                                onPress={() => router.push('/(app)/budgets/new' as any)}
                                style={styles.emptyBtn}
                            >
                                <Text style={styles.emptyBtnText}>Criar Primeira Meta</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <>
                            {budgets.map((b) => (
                                <BudgetCard
                                    key={b.id}
                                    budget={b}
                                    onDelete={() => handleDelete(b.id)}
                                />
                            ))}

                            {/* Sugestões */}
                            <TouchableOpacity
                                onPress={() => router.push('/(app)/budgets/suggestions' as any)}
                                style={styles.suggestionsRow}
                            >
                                <Text style={{ fontSize: 20 }}>💡</Text>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.suggestionsTitle}>Ver Sugestões de Meta</Text>
                                    <Text style={styles.suggestionsBody}>Baseado no seu histórico de gastos</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={18} color={COLORS.TEXT_MUTED} />
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
        flexDirection: 'row', alignItems: 'center', gap: 10,
        paddingTop: 56, paddingHorizontal: 16, paddingBottom: 16,
    },
    backBtn: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: COLORS.SURFACE, borderWidth: 1, borderColor: COLORS.BORDER,
        justifyContent: 'center', alignItems: 'center',
    },
    title: { fontSize: 26, fontWeight: '800', color: COLORS.TEXT, letterSpacing: -0.5 },
    subtitle: { fontSize: 13, color: COLORS.TEXT_MUTED, marginTop: 2 },
    addBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: COLORS.PRIMARY, borderRadius: 10,
        paddingHorizontal: 12, paddingVertical: 8,
    },
    addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

    card: {
        backgroundColor: COLORS.SURFACE, borderRadius: 16,
        padding: 16, marginBottom: 12,
        borderWidth: 1, borderColor: COLORS.BORDER,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
    cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
    cardRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    categoryIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    categoryEmoji: { fontSize: 22 },
    categoryName: { fontSize: 14, fontWeight: '700', color: COLORS.TEXT },
    budgetLimit: { fontSize: 11, color: COLORS.TEXT_MUTED, marginTop: 2 },
    pctBadge: { borderRadius: 100, paddingHorizontal: 8, paddingVertical: 3 },
    pctText: { fontSize: 11, fontWeight: '800' },
    deleteBtn: { padding: 4 },

    barBg: { height: 8, backgroundColor: COLORS.BORDER, borderRadius: 4, overflow: 'hidden', marginBottom: 14 },
    barFill: { height: '100%', borderRadius: 4 },

    statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
    statLabel: { fontSize: 10, fontWeight: '600', color: COLORS.TEXT_MUTED, marginBottom: 3, textTransform: 'uppercase' },
    statValue: { fontSize: 15, fontWeight: '800' },

    warningRow: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: COLORS.DANGER_LIGHT, borderRadius: 10,
        padding: 10, marginTop: 12,
    },
    warningText: { fontSize: 12, fontWeight: '600', color: COLORS.DANGER, flex: 1 },

    emptyCard: {
        backgroundColor: COLORS.SURFACE, borderRadius: 20,
        padding: 32, borderWidth: 1, borderColor: COLORS.BORDER,
        alignItems: 'center', marginTop: 8,
    },
    emptyTitle: { fontSize: 18, fontWeight: '800', color: COLORS.TEXT, marginBottom: 8 },
    emptyBody: { fontSize: 13, color: COLORS.TEXT_MUTED, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
    emptyBtn: { backgroundColor: COLORS.PRIMARY, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
    emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

    suggestionsRow: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: COLORS.SURFACE, borderRadius: 14,
        padding: 14, borderWidth: 1, borderColor: COLORS.BORDER,
        marginTop: 4,
    },
    suggestionsTitle: { fontSize: 13, fontWeight: '700', color: COLORS.TEXT },
    suggestionsBody: { fontSize: 11, color: COLORS.TEXT_MUTED, marginTop: 2 },
});
