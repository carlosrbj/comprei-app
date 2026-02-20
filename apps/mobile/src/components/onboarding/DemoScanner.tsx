import { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { COLORS } from '../../constants/colors';

const { width } = Dimensions.get('window');
const VIEWFINDER_SIZE = 200;

// Deterministic QR-code-like pattern (same every render)
const QR_PATTERN = Array.from({ length: 64 }, (_, i) =>
    [0, 1, 6, 7, 8, 14, 15, 16, 48, 49, 55, 56, 57, 63, 2, 3, 4, 5, 11, 12, 13, 18, 21, 24, 27, 30, 33, 36, 39, 42, 45].includes(i) ? 1 : (i * 17 + 3) % 5 < 2 ? 1 : 0
);

interface DemoScannerProps {
    onScanComplete: () => void;
}

export function DemoScanner({ onScanComplete }: DemoScannerProps) {
    const [scanning, setScanning] = useState(false);
    const [done, setDone] = useState(false);
    const scanLineY = useRef(new Animated.Value(-VIEWFINDER_SIZE / 2)).current;
    const successOpacity = useRef(new Animated.Value(0)).current;
    const successScale = useRef(new Animated.Value(0.6)).current;

    // Reset state when component mounts (in case of re-entry)
    useEffect(() => {
        setScanning(false);
        setDone(false);
        scanLineY.setValue(-VIEWFINDER_SIZE / 2);
        successOpacity.setValue(0);
        successScale.setValue(0.6);
    }, []);

    function handleScan() {
        if (scanning || done) return;
        setScanning(true);

        Animated.sequence([
            Animated.timing(scanLineY, {
                toValue: VIEWFINDER_SIZE / 2,
                duration: 1200,
                useNativeDriver: true,
            }),
        ]).start(() => {
            // Show success overlay
            Animated.parallel([
                Animated.timing(successOpacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.spring(successScale, {
                    toValue: 1,
                    useNativeDriver: true,
                }),
            ]).start(() => {
                setDone(true);
                setTimeout(onScanComplete, 1200);
            });
        });
    }

    return (
        <View style={{ width, alignItems: 'center', paddingVertical: 32 }}>
            {/* Viewfinder */}
            <View style={{ position: 'relative', marginBottom: 28 }}>
                {/* QR mockup */}
                <View style={{
                    width: VIEWFINDER_SIZE,
                    height: VIEWFINDER_SIZE,
                    backgroundColor: '#FFFFFF',
                    borderRadius: 16,
                    padding: 16,
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    gap: 2,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 12,
                    elevation: 4,
                }}>
                    {QR_PATTERN.map((filled, i) => (
                        <View
                            key={i}
                            style={{
                                width: 18,
                                height: 18,
                                borderRadius: 2,
                                backgroundColor: filled ? '#1C1C1E' : 'transparent',
                            }}
                        />
                    ))}
                </View>

                {/* Scan line (animated) */}
                {scanning && !done && (
                    <Animated.View
                        style={{
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            height: 2,
                            backgroundColor: COLORS.PRIMARY,
                            shadowColor: COLORS.PRIMARY,
                            shadowOffset: { width: 0, height: 0 },
                            shadowOpacity: 0.8,
                            shadowRadius: 6,
                            elevation: 4,
                            top: VIEWFINDER_SIZE / 2,
                            transform: [{ translateY: scanLineY }],
                        }}
                    />
                )}

                {/* Success overlay */}
                <Animated.View
                    style={{
                        position: 'absolute',
                        inset: 0,
                        top: 0, left: 0, right: 0, bottom: 0,
                        width: VIEWFINDER_SIZE,
                        height: VIEWFINDER_SIZE,
                        borderRadius: 16,
                        backgroundColor: `${COLORS.PRIMARY}E8`,
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: successOpacity,
                        transform: [{ scale: successScale }],
                    }}
                >
                    <Text style={{ fontSize: 64 }}>✓</Text>
                </Animated.View>

                {/* Corner brackets */}
                {[
                    { top: -6, left: -6, borderTopWidth: 3, borderLeftWidth: 3, borderTopRightRadius: 0, borderBottomLeftRadius: 0 },
                    { top: -6, right: -6, borderTopWidth: 3, borderRightWidth: 3 },
                    { bottom: -6, left: -6, borderBottomWidth: 3, borderLeftWidth: 3 },
                    { bottom: -6, right: -6, borderBottomWidth: 3, borderRightWidth: 3 },
                ].map((style, i) => (
                    <View
                        key={i}
                        style={{
                            position: 'absolute',
                            width: 24, height: 24,
                            borderColor: COLORS.PRIMARY,
                            borderRadius: 4,
                            ...style,
                        }}
                    />
                ))}
            </View>

            {/* Instructions / status */}
            {!scanning && !done && (
                <>
                    <Text style={{
                        fontSize: 14, color: COLORS.TEXT_MUTED,
                        textAlign: 'center', marginBottom: 20, lineHeight: 20,
                    }}>
                        Posicione o QR code da nota fiscal dentro do quadro
                    </Text>
                    <TouchableOpacity
                        onPress={handleScan}
                        style={{
                            backgroundColor: COLORS.PRIMARY,
                            paddingHorizontal: 32, paddingVertical: 14,
                            borderRadius: 14,
                            shadowColor: COLORS.PRIMARY,
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.35,
                            shadowRadius: 10,
                            elevation: 5,
                        }}
                    >
                        <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15 }}>
                            📷 Simular Scan
                        </Text>
                    </TouchableOpacity>
                </>
            )}

            {scanning && !done && (
                <Text style={{ fontSize: 14, color: COLORS.PRIMARY, fontWeight: '600', marginTop: 4 }}>
                    Lendo nota fiscal...
                </Text>
            )}

            {done && (
                <Text style={{ fontSize: 14, color: COLORS.PRIMARY, fontWeight: '700' }}>
                    ✓ Nota escaneada com sucesso!
                </Text>
            )}
        </View>
    );
}
