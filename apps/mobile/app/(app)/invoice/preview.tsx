import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StatusBar, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState, useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useInvoiceStore } from '../../../src/store/invoiceStore';
import { invoiceService } from '../../../src/services/invoices';
import { InvoiceItem } from '../../../src/types';
import { COLORS } from '../../../src/constants/colors';

export default function InvoicePreview() {
    const router = useRouter();
    const { previewData, setPreviewData, addInvoice } = useInvoiceStore();
    const [saving, setSaving] = useState(false);
    const [excludedMetrics, setExcludedMetrics] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (!previewData) {
            Alert.alert("Erro", "Nenhum dado de nota para pré-visualizar.");
            router.back();
        }
    }, [previewData]);

    const items = previewData?.items || [];

    const toggleItem = (index: number) => {
        const key = `${index}`;
        setExcludedMetrics(prev => {
            const next = new Set(prev);
            if (next.has(key)) {
                next.delete(key);
            } else {
                next.add(key);
            }
            return next;
        });
    };

    const activeItems = useMemo(() => {
        return items.filter((_, i) => !excludedMetrics.has(`${i}`));
    }, [items, excludedMetrics]);

    const totalValue = useMemo(() => {
        return activeItems.reduce((acc, item) => acc + Number(item.totalPrice), 0);
    }, [activeItems]);

    const handleSave = async () => {
        if (!previewData) return;
        if (activeItems.length === 0) {
            Alert.alert("Atenção", "A nota deve ter pelo menos um item.");
            return;
        }

        try {
            setSaving(true);
            const finalData = {
                ...previewData,
                items: activeItems,
                totalValue: totalValue,
            };

            const savedInvoice = await invoiceService.create(finalData);
            addInvoice(savedInvoice);
            setPreviewData(null);
            router.replace(`/invoice/${savedInvoice.id}`);
        } catch (error) {
            console.error('Save error:', error);
            Alert.alert("Erro", "Falha ao salvar a nota.");
            setSaving(false);
        }
    };

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    if (!previewData) return <View style={{ flex: 1, backgroundColor: COLORS.SURFACE }} />;

    return (
        <View style={{ flex: 1, backgroundColor: COLORS.BG }}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.ACCENT} />

            {/* Header */}
            <View style={{
                backgroundColor: COLORS.ACCENT,
                paddingTop: 48,
                paddingBottom: 20,
                paddingHorizontal: 16,
                flexDirection: 'row',
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
                elevation: 4,
            }}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={{
                        backgroundColor: 'rgba(255,255,255,0.15)',
                        padding: 8,
                        borderRadius: 20,
                        marginRight: 14,
                    }}
                >
                    <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700' }}>Revisar Nota</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 2 }}>{previewData.establishmentName}</Text>
                </View>
                <TouchableOpacity
                    onPress={handleSave}
                    disabled={saving}
                    style={{
                        backgroundColor: saving ? COLORS.TEXT_MUTED : COLORS.PRIMARY,
                        paddingHorizontal: 20,
                        paddingVertical: 10,
                        borderRadius: 100,
                    }}
                >
                    {saving ? (
                        <ActivityIndicator size="small" color="white" />
                    ) : (
                        <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 14 }}>Salvar</Text>
                    )}
                </TouchableOpacity>
            </View>

            {/* Summary */}
            <View style={{
                backgroundColor: COLORS.SURFACE,
                padding: 16,
                borderBottomWidth: 1,
                borderBottomColor: COLORS.BORDER,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
            }}>
                <Text style={{ color: COLORS.TEXT_MUTED, fontSize: 14 }}>Total a Salvar:</Text>
                <Text style={{ fontSize: 24, fontWeight: '800', color: COLORS.PRIMARY }}>
                    {formatCurrency(totalValue)}
                </Text>
            </View>

            {/* Hint */}
            <View style={{
                padding: 14,
                backgroundColor: COLORS.SECONDARY_LIGHT,
                borderBottomWidth: 1,
                borderBottomColor: 'rgba(245,166,35,0.2)',
            }}>
                <Text style={{ fontSize: 12, color: '#92600A' }}>
                    Desmarque os itens que você não quer importar (ex: itens divididos).
                </Text>
            </View>

            <FlatList
                data={items}
                keyExtractor={(_, index) => `${index}`}
                contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                renderItem={({ item, index }) => {
                    const isExcluded = excludedMetrics.has(`${index}`);
                    return (
                        <TouchableOpacity
                            onPress={() => toggleItem(index)}
                            style={{
                                padding: 16,
                                borderRadius: 16,
                                marginBottom: 10,
                                borderWidth: 1,
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: isExcluded ? '#F3F4F6' : COLORS.SURFACE,
                                borderColor: isExcluded ? '#E5E7EB' : COLORS.BORDER,
                                opacity: isExcluded ? 0.6 : 1,
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: isExcluded ? 0 : 0.05,
                                shadowRadius: 4,
                                elevation: isExcluded ? 0 : 1,
                            }}
                        >
                            <View style={{
                                width: 24,
                                height: 24,
                                borderRadius: 12,
                                borderWidth: 2,
                                marginRight: 12,
                                justifyContent: 'center',
                                alignItems: 'center',
                                borderColor: isExcluded ? COLORS.TEXT_MUTED : COLORS.PRIMARY,
                                backgroundColor: isExcluded ? 'transparent' : COLORS.PRIMARY,
                            }}>
                                {!isExcluded && <Ionicons name="checkmark" size={14} color="white" />}
                            </View>

                            <View style={{ flex: 1, marginRight: 12 }}>
                                <Text style={{
                                    fontWeight: '700',
                                    fontSize: 14,
                                    marginBottom: 4,
                                    color: isExcluded ? COLORS.TEXT_MUTED : COLORS.TEXT,
                                    textDecorationLine: isExcluded ? 'line-through' : 'none',
                                }}>
                                    {item.description || item.product?.description}
                                </Text>
                                <Text style={{ fontSize: 12, color: COLORS.TEXT_MUTED }}>
                                    {Number(item.quantity).toFixed(0)} {item.unit} x {formatCurrency(Number(item.unitPrice))}
                                </Text>
                            </View>
                            <Text style={{
                                fontWeight: '800',
                                fontSize: 15,
                                color: isExcluded ? COLORS.TEXT_MUTED : COLORS.TEXT,
                                textDecorationLine: isExcluded ? 'line-through' : 'none',
                            }}>
                                {formatCurrency(Number(item.totalPrice))}
                            </Text>
                        </TouchableOpacity>
                    );
                }}
            />
        </View>
    );
}
