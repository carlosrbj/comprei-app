import { View, Text, TouchableOpacity, Modal, Alert, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useAuthStore } from '../store/authStore';
import Paywall from './Paywall';
import { COLORS } from '../constants/colors';
import { API_URL } from '../constants/api';

interface ExportModalProps {
    visible: boolean;
    onClose: () => void;
}

type ExportFormat = 'pdf' | 'excel' | 'csv';
type ExportPeriod = 'current_month' | 'last_month' | 'last_3_months' | 'year';

const FORMAT_OPTIONS = [
    { value: 'pdf' as ExportFormat, icon: '📄', label: 'PDF', desc: 'Com gráficos' },
    { value: 'excel' as ExportFormat, icon: '📊', label: 'Excel', desc: 'Planilha .xlsx' },
    { value: 'csv' as ExportFormat, icon: '📝', label: 'CSV', desc: 'Texto simples' },
];

const PERIOD_OPTIONS = [
    { value: 'current_month' as ExportPeriod, label: 'Mês Atual' },
    { value: 'last_month' as ExportPeriod, label: 'Mês Passado' },
    { value: 'last_3_months' as ExportPeriod, label: 'Últimos 3 Meses' },
    { value: 'year' as ExportPeriod, label: `Ano ${new Date().getFullYear()}` },
];

function getPeriodDates(period: ExportPeriod): { startDate: string; endDate: string } {
    const now = new Date();
    let start: Date;
    let end = now;

    switch (period) {
        case 'current_month':
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
        case 'last_month':
            start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            end = new Date(now.getFullYear(), now.getMonth(), 0);
            break;
        case 'last_3_months':
            start = new Date(now.getFullYear(), now.getMonth() - 3, 1);
            break;
        case 'year':
            start = new Date(now.getFullYear(), 0, 1);
            break;
        default:
            start = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    return {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
    };
}

function getMimeType(format: ExportFormat): string {
    switch (format) {
        case 'pdf': return 'application/pdf';
        case 'excel': return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        case 'csv': return 'text/csv';
    }
}

function getExtension(format: ExportFormat): string {
    switch (format) {
        case 'pdf': return 'pdf';
        case 'excel': return 'xlsx';
        case 'csv': return 'csv';
    }
}

export default function ExportModal({ visible, onClose }: ExportModalProps) {
    const { user, token } = useAuthStore();
    const [format, setFormat] = useState<ExportFormat>('pdf');
    const [period, setPeriod] = useState<ExportPeriod>('current_month');
    const [loading, setLoading] = useState(false);
    const [showPaywall, setShowPaywall] = useState(false);

    const isPro = user?.plan === 'pro';

    async function handleExport() {
        if (!isPro) {
            setShowPaywall(true);
            return;
        }

        setLoading(true);
        try {
            const { startDate, endDate } = getPeriodDates(period);
            const endpoint = format === 'excel' ? 'excel' : format;
            const url = `${API_URL}/exports/${endpoint}?startDate=${startDate}&endDate=${endDate}`;
            const ext = getExtension(format);
            const fileUri = `${FileSystem.documentDirectory}comprei-${startDate}-${endDate}.${ext}`;

            const download = await FileSystem.downloadAsync(url, fileUri, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (download.status !== 200) {
                throw new Error('Erro ao gerar o arquivo. Verifique se você tem o plano Pro ativo.');
            }

            const canShare = await Sharing.isAvailableAsync();
            if (canShare) {
                await Sharing.shareAsync(download.uri, {
                    mimeType: getMimeType(format),
                    dialogTitle: 'Exportar Relatório Comprei',
                    UTI: format === 'pdf' ? 'com.adobe.pdf' : undefined,
                });
            } else {
                Alert.alert('✅ Arquivo Salvo', `Arquivo salvo em: ${download.uri}`);
            }

            onClose();
        } catch (err: any) {
            const msg = err?.message ?? 'Não foi possível exportar o relatório.';
            Alert.alert('Erro na Exportação', msg);
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' }}>
                    <View style={{
                        backgroundColor: COLORS.SURFACE,
                        borderTopLeftRadius: 24,
                        borderTopRightRadius: 24,
                        paddingTop: 12,
                        paddingBottom: 48,
                        paddingHorizontal: 24,
                    }}>
                        {/* Handle */}
                        <View style={{
                            width: 40, height: 4, borderRadius: 2,
                            backgroundColor: COLORS.BORDER,
                            alignSelf: 'center', marginBottom: 20,
                        }} />

                        {/* Header */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                            <Text style={{ fontSize: 20, fontWeight: '800', color: COLORS.TEXT }}>
                                📤 Exportar Dados
                            </Text>
                            <TouchableOpacity
                                onPress={onClose}
                                style={{
                                    width: 32, height: 32, borderRadius: 16,
                                    backgroundColor: COLORS.BG,
                                    justifyContent: 'center', alignItems: 'center',
                                }}
                            >
                                <Text style={{ fontSize: 18, color: COLORS.TEXT_MUTED }}>×</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Format */}
                        <Text style={{
                            fontSize: 11, fontWeight: '700', color: COLORS.TEXT_MUTED,
                            textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10,
                        }}>
                            Formato
                        </Text>

                        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 24 }}>
                            {FORMAT_OPTIONS.map((opt) => {
                                const active = format === opt.value;
                                return (
                                    <TouchableOpacity
                                        key={opt.value}
                                        onPress={() => setFormat(opt.value)}
                                        style={{
                                            flex: 1,
                                            borderWidth: 2,
                                            borderColor: active ? COLORS.PRIMARY : COLORS.BORDER,
                                            borderRadius: 14,
                                            padding: 12,
                                            alignItems: 'center',
                                            backgroundColor: active ? COLORS.PRIMARY_LIGHT : COLORS.SURFACE,
                                        }}
                                    >
                                        <Text style={{ fontSize: 22, marginBottom: 4 }}>{opt.icon}</Text>
                                        <Text style={{
                                            fontSize: 11, fontWeight: '700',
                                            color: active ? COLORS.PRIMARY : COLORS.TEXT,
                                        }}>
                                            {opt.label}
                                        </Text>
                                        <Text style={{ fontSize: 9, color: COLORS.TEXT_MUTED, marginTop: 2 }}>
                                            {opt.desc}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* Period */}
                        <Text style={{
                            fontSize: 11, fontWeight: '700', color: COLORS.TEXT_MUTED,
                            textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10,
                        }}>
                            Período
                        </Text>

                        <View style={{ gap: 8, marginBottom: 24 }}>
                            {PERIOD_OPTIONS.map((opt) => {
                                const active = period === opt.value;
                                return (
                                    <TouchableOpacity
                                        key={opt.value}
                                        onPress={() => setPeriod(opt.value)}
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            borderWidth: 1.5,
                                            borderColor: active ? COLORS.PRIMARY : COLORS.BORDER,
                                            borderRadius: 12,
                                            paddingVertical: 12,
                                            paddingHorizontal: 16,
                                            backgroundColor: active ? COLORS.PRIMARY_LIGHT : COLORS.SURFACE,
                                        }}
                                    >
                                        <Text style={{
                                            fontSize: 14,
                                            color: active ? COLORS.PRIMARY : COLORS.TEXT,
                                            fontWeight: active ? '700' : '400',
                                        }}>
                                            {opt.label}
                                        </Text>
                                        {active && (
                                            <Text style={{ fontSize: 14, color: COLORS.PRIMARY, fontWeight: '700' }}>✓</Text>
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* Pro notice for free users */}
                        {!isPro && (
                            <View style={{
                                flexDirection: 'row', alignItems: 'center', gap: 8,
                                backgroundColor: COLORS.SECONDARY_LIGHT,
                                borderRadius: 10, padding: 12, marginBottom: 16,
                            }}>
                                <Text style={{ fontSize: 16 }}>⭐</Text>
                                <Text style={{ fontSize: 12, fontWeight: '600', color: '#92400E', flex: 1 }}>
                                    Exportação é exclusiva do plano Pro
                                </Text>
                            </View>
                        )}

                        {/* Export button */}
                        <TouchableOpacity
                            onPress={handleExport}
                            disabled={loading}
                            style={{
                                backgroundColor: COLORS.PRIMARY,
                                borderRadius: 14,
                                paddingVertical: 16,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8,
                                opacity: loading ? 0.7 : 1,
                            }}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Text style={{ fontSize: 16 }}>📤</Text>
                                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
                                        {isPro ? 'Exportar' : 'Assinar Pro para Exportar'}
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Paywall
                visible={showPaywall}
                onClose={() => setShowPaywall(false)}
                feature="Exportação PDF/CSV"
            />
        </>
    );
}
