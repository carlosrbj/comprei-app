import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, StatusBar, Alert, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { invoiceService } from '../../../src/services/invoices';
import { Ionicons } from '@expo/vector-icons';
import { useInvoiceStore } from '../../../src/store/invoiceStore';
import { Invoice } from '../../../src/types';
import { COLORS } from '../../../src/constants/colors';

export default function InvoiceDetails() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { invoices, deleteInvoice } = useInvoiceStore();

    const cachedInvoice = invoices.find(i => i.id === id);

    const [invoice, setInvoice] = useState<Invoice | null>(cachedInvoice || null);
    const [loading, setLoading] = useState(!cachedInvoice?.items);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        loadInvoice();
    }, [id]);

    const loadInvoice = async () => {
        try {
            const data = await invoiceService.findOne(id as string);
            setInvoice(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = () => {
        if (Platform.OS === 'web') {
            if (window.confirm("Tem certeza que deseja excluir esta nota fiscal? Esta ação não pode ser desfeita.")) {
                performDelete();
            }
        } else {
            Alert.alert(
                "Excluir Nota",
                "Tem certeza que deseja excluir esta nota fiscal? Esta ação não pode ser desfeita.",
                [
                    { text: "Cancelar", style: "cancel" },
                    { text: "Excluir", style: "destructive", onPress: performDelete }
                ]
            );
        }
    };

    const performDelete = async () => {
        try {
            setDeleting(true);
            await invoiceService.deleteInvoice(id as string);
            await deleteInvoice(id as string);
            router.back();
        } catch (error) {
            console.error("Erro ao excluir nota:", error);
            if (Platform.OS === 'web') {
                window.alert("Não foi possível excluir a nota.");
            } else {
                Alert.alert("Erro", "Não foi possível excluir a nota.");
            }
            setDeleting(false);
        }
    };

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    if (loading && !invoice) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.BG }}>
                <ActivityIndicator size="large" color={COLORS.PRIMARY} />
                <Text style={{ color: COLORS.TEXT_MUTED, marginTop: 16 }}>Carregando detalhes...</Text>
            </View>
        );
    }

    if (!invoice && !loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: COLORS.BG }}>
                <View style={{
                    width: 72, height: 72, borderRadius: 36,
                    backgroundColor: COLORS.DANGER_LIGHT,
                    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
                }}>
                    <Ionicons name="alert-circle-outline" size={32} color={COLORS.DANGER} />
                </View>
                <Text style={{ fontSize: 20, fontWeight: '700', color: COLORS.TEXT, marginBottom: 8 }}>Nota não encontrada</Text>
                <Text style={{ color: COLORS.TEXT_MUTED, textAlign: 'center', marginBottom: 24 }}>
                    Não conseguimos localizar os detalhes desta nota fiscal.
                </Text>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={{ backgroundColor: COLORS.PRIMARY, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 100 }}
                >
                    <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Voltar</Text>
                </TouchableOpacity>
            </View>
        );
    }

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
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: '700', flex: 1 }}>Detalhes da Nota</Text>

                <TouchableOpacity
                    onPress={handleDelete}
                    disabled={deleting}
                    style={{
                        backgroundColor: 'rgba(231,76,60,0.2)',
                        padding: 8,
                        borderRadius: 20,
                    }}
                >
                    {deleting ? (
                        <ActivityIndicator size="small" color={COLORS.DANGER} />
                    ) : (
                        <Ionicons name="trash-outline" size={20} color={COLORS.DANGER} />
                    )}
                </TouchableOpacity>
            </View>

            <FlatList
                data={invoice?.items || []}
                keyExtractor={(item) => item.id || Math.random().toString()}
                contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                ListHeaderComponent={
                    <View style={{
                        backgroundColor: COLORS.SURFACE,
                        padding: 20,
                        borderRadius: 16,
                        marginBottom: 20,
                        borderWidth: 1,
                        borderColor: COLORS.BORDER,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.07,
                        shadowRadius: 4,
                        elevation: 2,
                    }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                            <View style={{
                                width: 44, height: 44, borderRadius: 12,
                                backgroundColor: COLORS.PRIMARY_LIGHT,
                                justifyContent: 'center', alignItems: 'center', marginRight: 14,
                            }}>
                                <Ionicons name="storefront-outline" size={22} color={COLORS.PRIMARY} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 12, color: COLORS.TEXT_MUTED, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 }}>
                                    Estabelecimento
                                </Text>
                                <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.TEXT }}>
                                    {invoice?.establishmentName}
                                </Text>
                            </View>
                        </View>

                        <View style={{ height: 1, backgroundColor: COLORS.BORDER, marginVertical: 8 }} />

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                            <View>
                                <Text style={{ fontSize: 12, color: COLORS.TEXT_MUTED, marginBottom: 4 }}>Data da Compra</Text>
                                <Text style={{ color: COLORS.TEXT, fontWeight: '500' }}>
                                    {invoice?.date ? new Date(invoice.date).toLocaleDateString('pt-BR', {
                                        day: '2-digit', month: '2-digit', year: 'numeric',
                                        hour: '2-digit', minute: '2-digit'
                                    }) : '-'}
                                </Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={{ fontSize: 12, color: COLORS.TEXT_MUTED, marginBottom: 4 }}>Valor Total</Text>
                                <Text style={{ fontSize: 24, fontWeight: '800', color: COLORS.PRIMARY }}>
                                    {invoice?.totalValue ? formatCurrency(invoice.totalValue) : 'R$ 0,00'}
                                </Text>
                            </View>
                        </View>
                    </View>
                }
                renderItem={({ item }) => (
                    <View style={{
                        backgroundColor: COLORS.SURFACE,
                        padding: 16,
                        borderRadius: 16,
                        marginBottom: 10,
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: COLORS.BORDER,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.05,
                        shadowRadius: 4,
                        elevation: 1,
                    }}>
                        <View style={{ flex: 1, marginRight: 12 }}>
                            <Text style={{ fontWeight: '700', color: COLORS.TEXT, fontSize: 14, marginBottom: 4 }}>
                                {item.product?.description || 'Produto sem descrição'}
                            </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <View style={{ backgroundColor: COLORS.BG, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginRight: 8 }}>
                                    <Text style={{ fontSize: 12, color: COLORS.TEXT_MUTED, fontWeight: '600' }}>
                                        {Number(item.quantity).toFixed(0)} {item.unit}
                                    </Text>
                                </View>
                                <Text style={{ fontSize: 12, color: COLORS.TEXT_MUTED }}>
                                    x {formatCurrency(item.unitPrice)}
                                </Text>
                            </View>
                        </View>
                        <Text style={{ fontWeight: '800', color: COLORS.TEXT, fontSize: 15 }}>
                            {formatCurrency(item.totalPrice)}
                        </Text>
                    </View>
                )}
                ListEmptyComponent={
                    loading ? (
                        <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                            <ActivityIndicator size="small" color={COLORS.PRIMARY} />
                            <Text style={{ color: COLORS.TEXT_MUTED, marginTop: 8 }}>Carregando itens...</Text>
                        </View>
                    ) : (
                        <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                            <Text style={{ color: COLORS.TEXT_MUTED }}>Nenhum item encontrado nesta nota.</Text>
                        </View>
                    )
                }
            />
        </View>
    );
}
