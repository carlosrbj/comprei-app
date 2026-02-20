import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useState, useCallback, useRef } from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ActivityIndicator,
    TextInput,
    Dimensions,
    Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { invoiceService } from '../../src/services/invoices';
import { useInvoiceStore } from '../../src/store/invoiceStore';
import { COLORS } from '../../src/constants/colors';

const { width } = Dimensions.get('window');
const VIEWFINDER_SIZE = width * 0.68;

type ScanState = 'idle' | 'scanning' | 'downloading' | 'processing' | 'success' | 'error';

const STATE_LABELS: Record<ScanState, string> = {
    idle: 'Aponte para o QR Code da nota fiscal',
    scanning: 'Validando QR code...',
    downloading: 'Baixando dados da SEFAZ...',
    processing: 'Categorizando produtos...',
    success: 'Nota processada com sucesso!',
    error: 'Não foi possível processar',
};

export default function Scanner() {
    const [facing] = useState<CameraType>('back');
    const [permission, requestPermission] = useCameraPermissions();
    const [scanState, setScanState] = useState<ScanState>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const [showManualInput, setShowManualInput] = useState(false);
    const [manualUrl, setManualUrl] = useState('');
    const router = useRouter();
    const isProcessing = useRef(false);

    const processUrl = useCallback(async (url: string) => {
        if (isProcessing.current) return;
        isProcessing.current = true;

        setScanState('scanning');
        setErrorMessage('');

        try {
            // Validação básica antes de chamar backend
            const isNfce =
                url.toLowerCase().includes('nfce') ||
                url.toLowerCase().includes('nfe') ||
                /\?p=[0-9]{44}/i.test(url) ||
                /\b[0-9]{44}\b/.test(url);

            if (!url.startsWith('http') && !isNfce) {
                throw new Error('QR code não reconhecido como nota fiscal eletrônica.');
            }

            setScanState('downloading');
            const result = await invoiceService.scanQrCode(url);

            if (result.status === 'duplicate') {
                isProcessing.current = false;
                Alert.alert(
                    '⚠️ Nota já escaneada',
                    'Esta nota fiscal já foi registrada anteriormente.',
                    [
                        {
                            text: 'Ver nota',
                            onPress: () =>
                                router.push({
                                    pathname: '/invoice/[id]',
                                    params: { id: result.invoice.id ?? '' },
                                }),
                        },
                        { text: 'OK', onPress: () => setScanState('idle') },
                    ],
                );
                return;
            }

            setScanState('processing');
            await new Promise((r) => setTimeout(r, 600));

            setScanState('success');

            // Atualizar store em background — não bloqueia a navegação
            invoiceService.findAll()
                .then((invoices) => useInvoiceStore.getState().setInvoices(invoices))
                .catch(() => {});

            const invoiceId = result.invoice?.id ?? '';
            setTimeout(() => {
                isProcessing.current = false;
                router.push({
                    pathname: '/invoice/[id]',
                    params: { id: invoiceId },
                });
            }, 900);
        } catch (err: any) {
            const msg =
                err?.response?.data?.message ||
                err?.message ||
                'Erro desconhecido ao processar a nota.';
            setErrorMessage(msg);
            setScanState('error');
            isProcessing.current = false;
        }
    }, [router]);

    const handleBarCodeScanned = useCallback(
        ({ data }: { type: string; data: string }) => {
            processUrl(data);
        },
        [processUrl],
    );

    const handleManualSubmit = () => {
        if (!manualUrl.trim()) return;
        const url = manualUrl.trim();
        setShowManualInput(false);
        // Small delay to let the camera view mount before starting processing
        setTimeout(() => processUrl(url), 50);
    };

    const handleRetry = () => {
        isProcessing.current = false;
        setScanState('idle');
        setErrorMessage('');
    };

    // --- Permissão ---
    if (!permission) {
        return <View style={{ flex: 1, backgroundColor: '#000' }} />;
    }

    if (!permission.granted) {
        return (
            <View style={styles.permissionContainer}>
                <View style={styles.permissionIcon}>
                    <Ionicons name="camera-outline" size={36} color={COLORS.PRIMARY} />
                </View>
                <Text style={styles.permissionTitle}>Acesso à Câmera</Text>
                <Text style={styles.permissionBody}>
                    Precisamos da câmera para ler QR codes de notas fiscais.
                </Text>
                <TouchableOpacity onPress={requestPermission} style={styles.permissionBtn}>
                    <Text style={styles.permissionBtnText}>Conceder Permissão</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // --- Input manual ---
    if (showManualInput) {
        return (
            <View style={styles.manualContainer}>
                <Text style={styles.manualTitle}>Digitar URL da Nota</Text>
                <Text style={styles.manualSubtitle}>
                    Cole a URL do QR code ou a chave de acesso (44 dígitos)
                </Text>
                <TextInput
                    style={styles.manualInput}
                    placeholder="https://www.fazenda.sp.gov.br/nfce/..."
                    placeholderTextColor={COLORS.TEXT_MUTED}
                    value={manualUrl}
                    onChangeText={setManualUrl}
                    autoCapitalize="none"
                    autoCorrect={false}
                    multiline
                />
                <TouchableOpacity
                    onPress={handleManualSubmit}
                    style={[styles.manualBtn, { backgroundColor: COLORS.PRIMARY }]}
                >
                    <Text style={styles.manualBtnText}>Processar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => setShowManualInput(false)}
                    style={[styles.manualBtn, { backgroundColor: 'rgba(255,255,255,0.1)' }]}
                >
                    <Text style={[styles.manualBtnText, { color: 'rgba(255,255,255,0.8)' }]}>
                        Voltar para Câmera
                    </Text>
                </TouchableOpacity>
            </View>
        );
    }

    // --- Tela principal da câmera ---
    const isWorking = scanState === 'scanning' || scanState === 'downloading' || scanState === 'processing';
    const cornerColor =
        scanState === 'success' ? COLORS.PRIMARY : scanState === 'error' ? COLORS.DANGER : COLORS.SECONDARY;

    return (
        <View style={{ flex: 1, backgroundColor: '#000' }}>
            <CameraView
                style={StyleSheet.absoluteFillObject}
                facing={facing}
                onBarcodeScanned={scanState === 'idle' ? handleBarCodeScanned : undefined}
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            />

            {/* Botão fechar */}
            <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
                <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>

            {/* Título */}
            <View style={styles.titleContainer}>
                <Text style={styles.titleText}>Escanear Nota Fiscal</Text>
                <Text style={styles.subtitleText}>Aponte para o QR Code da NF-e</Text>
            </View>

            {/* Viewfinder */}
            <View style={styles.viewfinderWrapper}>
                <View style={[styles.viewfinder, { width: VIEWFINDER_SIZE, height: VIEWFINDER_SIZE }]}>
                    {/* Cantos */}
                    <View style={[styles.corner, { top: -3, left: -3, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 12, borderColor: cornerColor }]} />
                    <View style={[styles.corner, { top: -3, right: -3, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 12, borderColor: cornerColor }]} />
                    <View style={[styles.corner, { bottom: -3, left: -3, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 12, borderColor: cornerColor }]} />
                    <View style={[styles.corner, { bottom: -3, right: -3, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 12, borderColor: cornerColor }]} />

                    {/* Overlay de sucesso */}
                    {scanState === 'success' && (
                        <View style={styles.successOverlay}>
                            <Text style={styles.successCheck}>✓</Text>
                        </View>
                    )}

                    {/* Overlay de erro */}
                    {scanState === 'error' && (
                        <View style={[styles.successOverlay, { backgroundColor: 'rgba(231,76,60,0.85)' }]}>
                            <Text style={styles.successCheck}>✕</Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Barra inferior */}
            <View style={styles.bottomBar}>
                {scanState === 'idle' && (
                    <>
                        <Text style={styles.bottomLabel}>{STATE_LABELS.idle}</Text>
                        <View style={styles.optRow}>
                            <TouchableOpacity style={styles.optBtn} onPress={() => setShowManualInput(true)}>
                                <Ionicons name="create-outline" size={22} color="rgba(255,255,255,0.75)" />
                                <Text style={styles.optLabel}>Manual</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                )}

                {isWorking && (
                    <View style={styles.stateRow}>
                        <ActivityIndicator size="small" color="#fff" />
                        <Text style={styles.stateText}>{STATE_LABELS[scanState]}</Text>
                    </View>
                )}

                {scanState === 'success' && (
                    <View style={styles.stateRow}>
                        <Text style={styles.successText}>{STATE_LABELS.success}</Text>
                    </View>
                )}

                {scanState === 'error' && (
                    <>
                        <Text style={styles.errorTitle}>{STATE_LABELS.error}</Text>
                        <Text style={styles.errorBody}>{errorMessage}</Text>
                        <TouchableOpacity onPress={handleRetry} style={styles.retryBtn}>
                            <Text style={styles.retryText}>Tentar Novamente</Text>
                        </TouchableOpacity>
                    </>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    // Permissão
    permissionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
        backgroundColor: COLORS.BG,
    },
    permissionIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.PRIMARY_LIGHT,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    permissionTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: COLORS.TEXT,
        textAlign: 'center',
        marginBottom: 10,
    },
    permissionBody: {
        fontSize: 14,
        color: COLORS.TEXT_MUTED,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 28,
    },
    permissionBtn: {
        backgroundColor: COLORS.PRIMARY,
        paddingHorizontal: 36,
        paddingVertical: 14,
        borderRadius: 14,
    },
    permissionBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 15,
    },

    // Input manual
    manualContainer: {
        flex: 1,
        backgroundColor: '#0F1117',
        justifyContent: 'center',
        padding: 24,
    },
    manualTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 8,
    },
    manualSubtitle: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.55)',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    manualInput: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
        borderRadius: 12,
        padding: 16,
        fontSize: 13,
        color: '#fff',
        marginBottom: 14,
        minHeight: 80,
        textAlignVertical: 'top',
    },
    manualBtn: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 10,
    },
    manualBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 15,
    },

    // Câmera
    closeBtn: {
        position: 'absolute',
        top: 56,
        left: 16,
        backgroundColor: 'rgba(0,0,0,0.45)',
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 50,
    },
    titleContainer: {
        position: 'absolute',
        top: 60,
        width: '100%',
        alignItems: 'center',
        zIndex: 10,
        paddingHorizontal: 40,
    },
    titleText: {
        fontSize: 22,
        fontWeight: '800',
        color: '#fff',
        textAlign: 'center',
    },
    subtitleText: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.55)',
        marginTop: 4,
        textAlign: 'center',
    },

    // Viewfinder
    viewfinderWrapper: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    viewfinder: {
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.25)',
        borderRadius: 16,
        position: 'relative',
    },
    corner: {
        position: 'absolute',
        width: 34,
        height: 34,
    },
    successOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(76,175,125,0.88)',
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    successCheck: {
        fontSize: 72,
        color: '#fff',
        fontWeight: '700',
    },

    // Barra inferior
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.82)',
        paddingTop: 20,
        paddingBottom: 40,
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    bottomLabel: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.75)',
        textAlign: 'center',
        marginBottom: 16,
    },
    optRow: {
        flexDirection: 'row',
        gap: 12,
    },
    optBtn: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
        borderRadius: 12,
        paddingHorizontal: 24,
        paddingVertical: 12,
        alignItems: 'center',
        gap: 6,
        flexDirection: 'row',
    },
    optLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.75)',
    },
    stateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    stateText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
    successText: {
        fontSize: 16,
        fontWeight: '800',
        color: COLORS.PRIMARY,
    },
    errorTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: COLORS.DANGER,
        marginBottom: 6,
    },
    errorBody: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.6)',
        textAlign: 'center',
        marginBottom: 16,
        lineHeight: 18,
    },
    retryBtn: {
        backgroundColor: COLORS.PRIMARY,
        paddingHorizontal: 28,
        paddingVertical: 12,
        borderRadius: 10,
    },
    retryText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },
});
