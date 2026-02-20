import { View, Text } from 'react-native';
import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { COLORS } from '../constants/colors';

export function OfflineBanner() {
    const [isOffline, setIsOffline] = useState(false);

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener((state) => {
            setIsOffline(!(state.isConnected && state.isInternetReachable));
        });
        return unsubscribe;
    }, []);

    if (!isOffline) return null;

    return (
        <View style={{
            backgroundColor: COLORS.SECONDARY,
            paddingHorizontal: 16,
            paddingVertical: 10,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
        }}>
            <Text style={{ fontSize: 16 }}>📡</Text>
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#FFFFFF', flex: 1 }}>
                Modo Offline — Dados sincronizados quando houver conexão
            </Text>
        </View>
    );
}
