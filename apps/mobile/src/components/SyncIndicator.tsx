import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSyncStore } from '../store/syncStore';
import { COLORS } from '../constants/colors';

export function SyncIndicator() {
    const { isSyncing, lastSyncAt, unsyncedCount, error, sync } = useSyncStore();

    if (isSyncing) {
        return (
            <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 6,
                backgroundColor: COLORS.PRIMARY_LIGHT,
                paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100,
            }}>
                <ActivityIndicator size="small" color={COLORS.PRIMARY} />
                <Text style={{ fontSize: 11, fontWeight: '600', color: COLORS.PRIMARY }}>
                    Sincronizando...
                </Text>
            </View>
        );
    }

    if (error) {
        return (
            <TouchableOpacity
                onPress={sync}
                style={{
                    flexDirection: 'row', alignItems: 'center', gap: 6,
                    backgroundColor: COLORS.DANGER_LIGHT,
                    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100,
                }}
            >
                <Text style={{ fontSize: 13 }}>⚠️</Text>
                <Text style={{ fontSize: 11, fontWeight: '600', color: COLORS.DANGER }}>
                    Erro — Tentar novamente
                </Text>
            </TouchableOpacity>
        );
    }

    if (unsyncedCount > 0) {
        return (
            <TouchableOpacity
                onPress={sync}
                style={{
                    flexDirection: 'row', alignItems: 'center', gap: 6,
                    backgroundColor: COLORS.SECONDARY_LIGHT,
                    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100,
                }}
            >
                <Text style={{ fontSize: 13 }}>📤</Text>
                <Text style={{ fontSize: 11, fontWeight: '600', color: COLORS.SECONDARY }}>
                    {unsyncedCount} pendente{unsyncedCount > 1 ? 's' : ''}
                </Text>
            </TouchableOpacity>
        );
    }

    if (lastSyncAt) {
        return (
            <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 4,
                backgroundColor: 'rgba(255,255,255,0.15)',
                paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100,
            }}>
                <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '600' }}>
                    ✓ Sincronizado
                </Text>
            </View>
        );
    }

    return null;
}
