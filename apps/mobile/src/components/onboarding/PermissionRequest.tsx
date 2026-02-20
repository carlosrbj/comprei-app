import { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { Camera } from 'expo-camera';
import * as Notifications from 'expo-notifications';
import { COLORS } from '../../constants/colors';

const { width } = Dimensions.get('window');

interface PermissionRequestProps {
    type: 'camera' | 'notifications';
    onGranted: () => void;
    onSkip: () => void;
}

const CONFIG = {
    camera: {
        emoji: '📷',
        title: 'Acesso à Câmera',
        description: 'Para escanear QR codes das notas fiscais de forma rápida e automática.',
        benefit: '⚡ Scan em 2 segundos',
        skipLabel: 'Depois',
        required: true,
    },
    notifications: {
        emoji: '🔔',
        title: 'Notificações',
        description: 'Receba a Liberdade de Sexta e alertas quando ultrapassar orçamentos.',
        benefit: '🍺 Liberdade de Sexta toda semana',
        skipLabel: 'Agora não',
        required: false,
    },
};

export function PermissionRequest({ type, onGranted, onSkip }: PermissionRequestProps) {
    const [requesting, setRequesting] = useState(false);
    const config = CONFIG[type];

    async function handleRequest() {
        setRequesting(true);
        try {
            if (type === 'camera') {
                const { status } = await Camera.requestCameraPermissionsAsync();
                if (status === 'granted') {
                    onGranted();
                } else {
                    Alert.alert(
                        'Câmera Necessária',
                        'O scan de notas fiscais requer acesso à câmera. Você pode habilitar depois nas Configurações.',
                        [
                            { text: 'Agora não', style: 'cancel', onPress: onSkip },
                        ],
                    );
                }
            } else {
                const { status } = await Notifications.requestPermissionsAsync();
                if (status === 'granted') {
                    onGranted();
                } else {
                    onSkip();
                }
            }
        } finally {
            setRequesting(false);
        }
    }

    return (
        <View style={{
            width,
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 40,
        }}>
            {/* Icon */}
            <View style={{
                width: 112, height: 112, borderRadius: 56,
                backgroundColor: COLORS.PRIMARY_LIGHT,
                alignItems: 'center', justifyContent: 'center',
                marginBottom: 32,
                borderWidth: 2, borderColor: `${COLORS.PRIMARY}30`,
            }}>
                <Text style={{ fontSize: 52 }}>{config.emoji}</Text>
            </View>

            <Text style={{
                fontSize: 26, fontWeight: '800', color: COLORS.TEXT,
                textAlign: 'center', letterSpacing: -0.5, marginBottom: 12,
            }}>
                {config.title}
            </Text>

            <Text style={{
                fontSize: 15, color: COLORS.TEXT_MUTED,
                textAlign: 'center', lineHeight: 22, marginBottom: 24,
            }}>
                {config.description}
            </Text>

            {/* Benefit pill */}
            <View style={{
                backgroundColor: COLORS.SECONDARY_LIGHT,
                paddingHorizontal: 16, paddingVertical: 10,
                borderRadius: 100, marginBottom: 36,
            }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.SECONDARY }}>
                    {config.benefit}
                </Text>
            </View>

            {/* Allow button */}
            <TouchableOpacity
                onPress={handleRequest}
                disabled={requesting}
                style={{
                    width: '100%',
                    backgroundColor: COLORS.PRIMARY,
                    paddingVertical: 16,
                    borderRadius: 14,
                    alignItems: 'center',
                    marginBottom: 12,
                    opacity: requesting ? 0.7 : 1,
                    shadowColor: COLORS.PRIMARY,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 10,
                    elevation: 5,
                }}
            >
                <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 16 }}>
                    {requesting ? 'Aguarde...' : 'Permitir'}
                </Text>
            </TouchableOpacity>

            {/* Skip */}
            <TouchableOpacity onPress={onSkip} style={{ paddingVertical: 12 }}>
                <Text style={{ fontSize: 14, color: COLORS.TEXT_MUTED, fontWeight: '500' }}>
                    {config.skipLabel}
                </Text>
            </TouchableOpacity>
        </View>
    );
}
