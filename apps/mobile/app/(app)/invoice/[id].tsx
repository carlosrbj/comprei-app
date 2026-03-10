import {
    View, Text, ActivityIndicator, TouchableOpacity,
    StatusBar, Alert, Platform, ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { invoiceService } from '../../../src/services/invoices';
import { Ionicons } from '@expo/vector-icons';
import { useInvoiceStore } from '../../../src/store/invoiceStore';
import { Invoice, InvoiceItem } from '../../../src/types';
import { COLORS } from '../../../src/constants/colors';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (v: number | null | undefined) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v ?? 0);

const fmtDateTime = (dateStr: string | null | undefined) => {
    if (!dateStr) return { date: '-', time: '-' };
    const d = new Date(dateStr);
    return {
        date: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        time: d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };
};

const PAY_ICON_MAP: Array<[string, string]> = [
    ['Cartão de Crédito', 'card-outline'],
    ['Cartão de Débito', 'card-outline'],
    ['Dinheiro', 'cash-outline'],
    ['PIX', 'flash-outline'],
    ['Vale Alimentação', 'restaurant-outline'],
    ['Vale Refeição', 'restaurant-outline'],
];

function payIcon(method: string | null | undefined): keyof typeof Ionicons.glyphMap {
    for (const [key, icon] of PAY_ICON_MAP) {
        if (method?.includes(key)) return icon as keyof typeof Ionicons.glyphMap;
    }
    return 'wallet-outline';
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
    return (
        <Text style={{
            fontSize: 11, fontWeight: '700', color: COLORS.TEXT_MUTED,
            textTransform: 'uppercase', letterSpacing: 1,
            marginBottom: 8, marginTop: 4, marginLeft: 2,
        }}>
            {label}
        </Text>
    );
}

function Card({ children, mb = 12 }: { children: React.ReactNode; mb?: number }) {
    return (
        <View style={{
            backgroundColor: COLORS.SURFACE,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: COLORS.BORDER,
            overflow: 'hidden',
            marginBottom: mb,
        }}>
            {children}
        </View>
    );
}

function Divider() {
    return <View style={{ height: 1, backgroundColor: COLORS.BORDER }} />;
}

function InfoRow({
    label, value, valueColor, large,
}: { label: string; value: string; valueColor?: string; large?: boolean }) {
    return (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 }}>
            <Text style={{ fontSize: 13, color: COLORS.TEXT_MUTED, flex: 1 }}>{label}</Text>
            <Text style={{
                fontSize: large ? 22 : 14,
                color: valueColor ?? COLORS.TEXT,
                fontWeight: large ? '800' : '600',
                flexShrink: 1, textAlign: 'right', marginLeft: 16,
            }}>
                {value}
            </Text>
        </View>
    );
}

function ItemRow({ item, last }: { item: InvoiceItem; last: boolean }) {
    const emoji = item.product?.category?.emoji ?? '📦';
    const name = item.product?.description ?? item.description ?? 'Produto';
    const qty = Number(item.quantity);
    const unit = item.unit ?? 'UN';
    const unitPrice = Number(item.unitPrice);
    const total = Number(item.totalPrice);
    const catName = item.product?.category?.name;

    return (
        <View style={{
            flexDirection: 'row', alignItems: 'center',
            paddingHorizontal: 16, paddingVertical: 12,
            borderBottomWidth: last ? 0 : 1, borderBottomColor: COLORS.BORDER,
        }}>
            <View style={{
                width: 38, height: 38, borderRadius: 10,
                backgroundColor: COLORS.BG,
                justifyContent: 'center', alignItems: 'center',
                marginRight: 12, flexShrink: 0,
            }}>
                <Text style={{ fontSize: 18 }}>{emoji}</Text>
            </View>

            <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.TEXT, lineHeight: 18 }} numberOfLines={2}>
                    {name}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3, flexWrap: 'wrap', gap: 6 }}>
                    <Text style={{ fontSize: 11, color: COLORS.TEXT_MUTED }}>
                        {qty % 1 === 0 ? qty.toFixed(0) : qty.toFixed(3)} {unit} × {fmt(unitPrice)}
                    </Text>
                    {catName && (
                        <View style={{
                            backgroundColor: COLORS.BG, borderRadius: 6,
                            paddingHorizontal: 5, paddingVertical: 1,
                        }}>
                            <Text style={{ fontSize: 10, color: COLORS.TEXT_MUTED, fontWeight: '600' }}>{catName}</Text>
                        </View>
                    )}
                </View>
            </View>

            <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.TEXT }}>
                {fmt(total)}
            </Text>
        </View>
    );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function InvoiceDetails() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { invoices, deleteInvoice } = useInvoiceStore();

    const cachedInvoice = invoices.find(i => i.id === id);
    const [invoice, setInvoice] = useState<Invoice | null>(cachedInvoice || null);
    const [loading, setLoading] = useState(!cachedInvoice);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => { loadInvoice(); }, [id]);

    const loadInvoice = async () => {
        try {
            const data = await invoiceService.findOne(id as string);
            setInvoice(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = () => {
        if (Platform.OS === 'web') {
            if (window.confirm('Tem certeza que deseja excluir esta nota fiscal?')) performDelete();
        } else {
            Alert.alert(
                'Excluir Nota',
                'Tem certeza que deseja excluir esta nota fiscal? Esta ação não pode ser desfeita.',
                [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Excluir', style: 'destructive', onPress: performDelete },
                ],
            );
        }
    };

    const performDelete = async () => {
        try {
            setDeleting(true);
            await invoiceService.deleteInvoice(id as string);
            await deleteInvoice(id as string);
            router.back();
        } catch {
            Alert.alert('Erro', 'Não foi possível excluir a nota.');
            setDeleting(false);
        }
    };

    // ── Loading / not found ───────────────────────────────────────────────────
    if (loading && !invoice) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.BG }}>
                <ActivityIndicator size="large" color={COLORS.PRIMARY} />
                <Text style={{ color: COLORS.TEXT_MUTED, marginTop: 16, fontSize: 14 }}>Carregando nota...</Text>
            </View>
        );
    }

    if (!invoice) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: COLORS.BG }}>
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
                    accessibilityRole="button"
                    style={{ backgroundColor: COLORS.PRIMARY, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 100 }}
                >
                    <Text style={{ color: '#fff', fontWeight: '700' }}>Voltar</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // ── Derived values ────────────────────────────────────────────────────────
    const { date, time } = fmtDateTime(invoice.date);
    const items = invoice.items ?? [];
    const subtotal = items.reduce((acc, it) => acc + Number(it.totalPrice), 0);
    const discount = Number(invoice.discount ?? 0);
    const totalValue = Number(invoice.totalValue);
    const amountToPay = Number(invoice.amountToPay ?? totalValue);
    const amountPaid = Number(invoice.amountPaid ?? 0);
    const hasPaymentInfo = !!(invoice.paymentMethod || amountPaid > 0);
    const hasFinancialDetails = subtotal > 0 || discount > 0;

    const accessKeyFormatted = invoice.accessKey
        ? invoice.accessKey.replace(/(\d{4})/g, '$1 ').trim()
        : '';

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <View style={{ flex: 1, backgroundColor: COLORS.BG }}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.ACCENT} />

            {/* ── Top bar + hero ──────────────────────────────────────────── */}
            <View style={{ backgroundColor: COLORS.ACCENT }}>
                {/* Nav row */}
                <View style={{
                    flexDirection: 'row', alignItems: 'center',
                    paddingTop: 52, paddingHorizontal: 16, paddingBottom: 16,
                }}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        accessibilityRole="button"
                        accessibilityLabel="Voltar"
                        style={{
                            backgroundColor: 'rgba(255,255,255,0.15)',
                            width: 40, height: 40, borderRadius: 20,
                            justifyContent: 'center', alignItems: 'center', marginRight: 12,
                        }}
                    >
                        <Ionicons name="arrow-back" size={22} color="#fff" />
                    </TouchableOpacity>
                    <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', flex: 1 }}>
                        Detalhes da Nota
                    </Text>
                    <TouchableOpacity
                        onPress={handleDelete}
                        disabled={deleting}
                        accessibilityRole="button"
                        accessibilityLabel="Excluir nota"
                        style={{
                            backgroundColor: 'rgba(231,76,60,0.2)',
                            width: 40, height: 40, borderRadius: 20,
                            justifyContent: 'center', alignItems: 'center',
                        }}
                    >
                        {deleting
                            ? <ActivityIndicator size="small" color={COLORS.DANGER} />
                            : <Ionicons name="trash-outline" size={20} color={COLORS.DANGER} />
                        }
                    </TouchableOpacity>
                </View>

                {/* Hero: store info */}
                <View style={{
                    backgroundColor: 'rgba(255,255,255,0.07)',
                    borderTopLeftRadius: 20, borderTopRightRadius: 20,
                    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 28,
                }}>
                    {/* Store icon + name */}
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14 }}>
                        <View style={{
                            width: 50, height: 50, borderRadius: 14,
                            backgroundColor: 'rgba(76,175,125,0.2)',
                            justifyContent: 'center', alignItems: 'center', flexShrink: 0,
                        }}>
                            <Ionicons name="storefront-outline" size={24} color={COLORS.PRIMARY} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 20, fontWeight: '800', color: '#fff', lineHeight: 26 }}>
                                {invoice.establishmentName}
                            </Text>
                            {invoice.storeCnpj ? (
                                <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 4 }}>
                                    CNPJ: {invoice.storeCnpj}
                                </Text>
                            ) : null}
                            {invoice.storeAddress ? (
                                <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }} numberOfLines={2}>
                                    {invoice.storeAddress}
                                </Text>
                            ) : null}
                        </View>
                    </View>

                    {/* Date + total */}
                    <View style={{
                        flexDirection: 'row', justifyContent: 'space-between',
                        alignItems: 'flex-end', marginTop: 22,
                    }}>
                        <View>
                            <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                                Emissão
                            </Text>
                            <Text style={{ fontSize: 15, fontWeight: '700', color: 'rgba(255,255,255,0.9)', marginTop: 3 }}>
                                {date}
                            </Text>
                            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
                                {time}
                            </Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                                Total
                            </Text>
                            <Text style={{ fontSize: 32, fontWeight: '800', color: COLORS.PRIMARY, letterSpacing: -0.5, marginTop: 3 }}>
                                {fmt(totalValue)}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* ── Scrollable body ──────────────────────────────────────────── */}
            <ScrollView
                contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
            >
                {/* ── Products ─────────────────────────────────────────────── */}
                <SectionLabel label={`Produtos · ${items.length} ${items.length === 1 ? 'item' : 'itens'}`} />
                <Card>
                    {items.length === 0 ? (
                        <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                            {loading
                                ? <ActivityIndicator size="small" color={COLORS.PRIMARY} />
                                : <Text style={{ color: COLORS.TEXT_MUTED, fontSize: 13 }}>Nenhum item encontrado.</Text>
                            }
                        </View>
                    ) : (
                        items.map((item, i) => (
                            <ItemRow key={item.id ?? i} item={item} last={i === items.length - 1} />
                        ))
                    )}
                </Card>

                {/* ── Financial summary ─────────────────────────────────────── */}
                <SectionLabel label="Resumo Financeiro" />
                <Card>
                    {hasFinancialDetails && subtotal > 0 && (
                        <>
                            <InfoRow label="Subtotal dos produtos" value={fmt(subtotal)} />
                            <Divider />
                        </>
                    )}
                    {discount > 0 && (
                        <>
                            <InfoRow label="Descontos" value={`- ${fmt(discount)}`} valueColor={COLORS.PRIMARY} />
                            <Divider />
                        </>
                    )}
                    <View style={{
                        flexDirection: 'row', justifyContent: 'space-between',
                        alignItems: 'center', padding: 16,
                    }}>
                        <Text style={{ fontSize: 15, fontWeight: '800', color: COLORS.TEXT }}>Valor Total</Text>
                        <Text style={{ fontSize: 24, fontWeight: '800', color: COLORS.PRIMARY }}>{fmt(totalValue)}</Text>
                    </View>
                    {amountToPay > 0 && amountToPay !== totalValue && (
                        <>
                            <Divider />
                            <InfoRow label="Valor a Pagar" value={fmt(amountToPay)} />
                        </>
                    )}
                </Card>

                {/* ── Payment ───────────────────────────────────────────────── */}
                {hasPaymentInfo && (
                    <>
                        <SectionLabel label="Pagamento" />
                        <Card>
                            {invoice.paymentMethod ? (
                                <>
                                    <View style={{
                                        flexDirection: 'row', alignItems: 'center',
                                        gap: 12, padding: 16,
                                    }}>
                                        <View style={{
                                            width: 40, height: 40, borderRadius: 11,
                                            backgroundColor: COLORS.ACCENT_LIGHT,
                                            justifyContent: 'center', alignItems: 'center',
                                        }}>
                                            <Ionicons name={payIcon(invoice.paymentMethod)} size={18} color={COLORS.ACCENT} />
                                        </View>
                                        <View>
                                            <Text style={{ fontSize: 11, color: COLORS.TEXT_MUTED }}>Forma de Pagamento</Text>
                                            <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.TEXT, marginTop: 2 }}>
                                                {invoice.paymentMethod}
                                            </Text>
                                        </View>
                                    </View>
                                    {amountPaid > 0 && <Divider />}
                                </>
                            ) : null}
                            {amountPaid > 0 && (
                                <InfoRow label="Valor Pago" value={fmt(amountPaid)} />
                            )}
                        </Card>
                    </>
                )}

                {/* ── Access key ────────────────────────────────────────────── */}
                {accessKeyFormatted ? (
                    <>
                        <SectionLabel label="Chave de Acesso" />
                        <Card mb={0}>
                            <View style={{ padding: 16 }}>
                                <Text style={{
                                    fontSize: 11, color: COLORS.TEXT_MUTED,
                                    letterSpacing: 0.5, lineHeight: 19,
                                }}>
                                    {accessKeyFormatted}
                                </Text>
                            </View>
                        </Card>
                    </>
                ) : null}
            </ScrollView>
        </View>
    );
}
