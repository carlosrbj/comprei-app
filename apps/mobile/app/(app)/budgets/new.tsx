import {
    View, Text, ScrollView, TouchableOpacity,
    TextInput, ActivityIndicator, Alert, StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { budgetsService } from '../../../src/services/budgets';
import { categoriesService, Category } from '../../../src/services/categories';
import { COLORS } from '../../../src/constants/colors';

const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

export default function NewBudgetScreen() {
    const router = useRouter();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loadingCats, setLoadingCats] = useState(true);
    const [saving, setSaving] = useState(false);

    // form state
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [amount, setAmount] = useState('');
    const [rawAmount, setRawAmount] = useState('');

    useEffect(() => {
        categoriesService.getCategories()
            .then(setCategories)
            .catch(() => Alert.alert('Erro', 'Não foi possível carregar as categorias'))
            .finally(() => setLoadingCats(false));
    }, []);

    function handleAmountChange(text: string) {
        // strip non-digits
        const digits = text.replace(/\D/g, '');
        setRawAmount(digits);
        const num = parseInt(digits || '0', 10) / 100;
        setAmount(digits === '' ? '' : formatCurrency(num));
    }

    async function handleSave() {
        const digits = rawAmount.replace(/\D/g, '');
        const num = parseInt(digits || '0', 10) / 100;

        if (num <= 0) {
            Alert.alert('Valor inválido', 'Informe um valor maior que R$ 0,00.');
            return;
        }

        setSaving(true);
        try {
            await budgetsService.setBudget(selectedCategoryId, num);
            router.back();
        } catch {
            Alert.alert('Erro', 'Não foi possível salvar a meta. Tente novamente.');
        } finally {
            setSaving(false);
        }
    }

    const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

    return (
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: COLORS.BG }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView contentContainerStyle={{ paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={22} color={COLORS.TEXT} />
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.title}>Nova Meta 🎯</Text>
                        <Text style={styles.subtitle}>Defina um limite de gastos mensal</Text>
                    </View>
                </View>

                <View style={{ paddingHorizontal: 16 }}>
                    {/* Amount Input */}
                    <View style={styles.card}>
                        <Text style={styles.sectionLabel}>Valor do limite</Text>
                        <TextInput
                            style={styles.amountInput}
                            value={amount}
                            onChangeText={handleAmountChange}
                            placeholder="R$ 0,00"
                            placeholderTextColor={COLORS.TEXT_MUTED}
                            keyboardType="numeric"
                            autoFocus
                        />
                        <Text style={styles.inputHint}>Este valor será seu limite mensal de gastos</Text>
                    </View>

                    {/* Category Selection */}
                    <View style={styles.card}>
                        <Text style={styles.sectionLabel}>Categoria (opcional)</Text>
                        <Text style={styles.inputHint} numberOfLines={2}>
                            Deixe sem categoria para criar uma meta geral de todos os gastos
                        </Text>

                        <View style={styles.categoryGrid}>
                            {/* General option */}
                            <TouchableOpacity
                                style={[
                                    styles.categoryChip,
                                    selectedCategoryId === null && styles.categoryChipActive,
                                ]}
                                onPress={() => setSelectedCategoryId(null)}
                            >
                                <Text style={styles.categoryEmoji}>💰</Text>
                                <Text
                                    style={[
                                        styles.categoryChipLabel,
                                        selectedCategoryId === null && styles.categoryChipLabelActive,
                                    ]}
                                    numberOfLines={1}
                                >
                                    Geral
                                </Text>
                            </TouchableOpacity>

                            {loadingCats ? (
                                <View style={{ padding: 16 }}>
                                    <ActivityIndicator size="small" color={COLORS.PRIMARY} />
                                </View>
                            ) : (
                                categories.map((cat) => (
                                    <TouchableOpacity
                                        key={cat.id}
                                        style={[
                                            styles.categoryChip,
                                            selectedCategoryId === cat.id && styles.categoryChipActive,
                                        ]}
                                        onPress={() => setSelectedCategoryId(cat.id)}
                                    >
                                        <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                                        <Text
                                            style={[
                                                styles.categoryChipLabel,
                                                selectedCategoryId === cat.id && styles.categoryChipLabelActive,
                                            ]}
                                            numberOfLines={1}
                                        >
                                            {cat.name.split(' ')[0]}
                                        </Text>
                                    </TouchableOpacity>
                                ))
                            )}
                        </View>
                    </View>

                    {/* Summary preview */}
                    {rawAmount.length > 0 && (
                        <View style={styles.previewCard}>
                            <Text style={styles.previewEmoji}>
                                {selectedCategory?.emoji ?? '💰'}
                            </Text>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.previewTitle}>
                                    {selectedCategory?.name ?? 'Meta Geral'}
                                </Text>
                                <Text style={styles.previewSubtitle}>
                                    Limite de {amount} por mês
                                </Text>
                            </View>
                            <View style={[styles.pctBadge, { backgroundColor: COLORS.PRIMARY_LIGHT }]}>
                                <Text style={[styles.pctText, { color: COLORS.PRIMARY }]}>0%</Text>
                            </View>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Save button */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.saveBtn, (saving || rawAmount === '') && styles.saveBtnDisabled]}
                    onPress={handleSave}
                    disabled={saving || rawAmount === ''}
                    activeOpacity={0.85}
                >
                    {saving ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Ionicons name="checkmark-circle" size={20} color="#fff" />
                            <Text style={styles.saveBtnText}>Salvar Meta</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
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

    card: {
        backgroundColor: COLORS.SURFACE,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.BORDER,
    },
    sectionLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: COLORS.TEXT_MUTED,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 10,
    },
    inputHint: {
        fontSize: 11,
        color: COLORS.TEXT_MUTED,
        marginTop: 4,
    },
    amountInput: {
        fontSize: 36,
        fontWeight: '800',
        color: COLORS.TEXT,
        letterSpacing: -1,
        paddingVertical: 8,
        borderBottomWidth: 2,
        borderBottomColor: COLORS.PRIMARY,
    },

    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 12,
    },
    categoryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 100,
        backgroundColor: COLORS.BG,
        borderWidth: 1,
        borderColor: COLORS.BORDER,
    },
    categoryChipActive: {
        backgroundColor: COLORS.PRIMARY_LIGHT,
        borderColor: COLORS.PRIMARY,
    },
    categoryEmoji: { fontSize: 14 },
    categoryChipLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.TEXT_MUTED,
        maxWidth: 80,
    },
    categoryChipLabelActive: {
        color: COLORS.PRIMARY,
    },

    previewCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: COLORS.PRIMARY_LIGHT,
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: `${COLORS.PRIMARY}30`,
        marginTop: 4,
    },
    previewEmoji: { fontSize: 28 },
    previewTitle: { fontSize: 14, fontWeight: '700', color: COLORS.TEXT },
    previewSubtitle: { fontSize: 12, color: COLORS.TEXT_MUTED, marginTop: 2 },
    pctBadge: { borderRadius: 100, paddingHorizontal: 8, paddingVertical: 3 },
    pctText: { fontSize: 11, fontWeight: '800' },

    footer: {
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        paddingHorizontal: 16,
        paddingBottom: Platform.OS === 'ios' ? 36 : 20,
        paddingTop: 12,
        backgroundColor: COLORS.BG,
        borderTopWidth: 1,
        borderTopColor: COLORS.BORDER,
    },
    saveBtn: {
        backgroundColor: COLORS.PRIMARY,
        borderRadius: 14,
        paddingVertical: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    saveBtnDisabled: {
        opacity: 0.4,
    },
    saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
