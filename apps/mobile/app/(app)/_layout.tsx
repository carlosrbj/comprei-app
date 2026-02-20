import { Tabs, useRouter } from 'expo-router';
import { TouchableOpacity, View, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../src/constants/colors';

function ScanFAB() {
    const router = useRouter();

    return (
        <TouchableOpacity
            style={styles.fab}
            onPress={() => router.push('/scanner')}
            activeOpacity={0.85}
        >
            <View style={styles.fabInner}>
                <Ionicons name="scan" size={28} color="#FFFFFF" />
            </View>
        </TouchableOpacity>
    );
}

export default function AppLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: COLORS.PRIMARY,
                tabBarInactiveTintColor: COLORS.TEXT_MUTED,
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '600',
                    letterSpacing: 0.2,
                },
                tabBarStyle: {
                    height: Platform.OS === 'ios' ? 88 : 70,
                    paddingBottom: Platform.OS === 'ios' ? 28 : 10,
                    paddingTop: 8,
                    backgroundColor: COLORS.SURFACE,
                    borderTopWidth: 1,
                    borderTopColor: COLORS.BORDER,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -4 },
                    shadowOpacity: 0.06,
                    shadowRadius: 20,
                    elevation: 8,
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Início',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="home-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="history"
                options={{
                    title: 'Histórico',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="receipt-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="scanner"
                options={{
                    title: '',
                    tabBarButton: () => <ScanFAB />,
                }}
            />
            <Tabs.Screen
                name="reports"
                options={{
                    title: 'Relatórios',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="bar-chart-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Perfil',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="person-outline" size={size} color={color} />
                    ),
                }}
            />

            {/* Hide routes from tab bar */}
            <Tabs.Screen
                name="invoice/preview"
                options={{ href: null }}
            />
            <Tabs.Screen
                name="invoice/[id]"
                options={{ href: null }}
            />
            <Tabs.Screen
                name="plans"
                options={{ href: null }}
            />
            <Tabs.Screen
                name="liberdade"
                options={{ href: null }}
            />
            <Tabs.Screen
                name="referral"
                options={{ href: null }}
            />
            <Tabs.Screen
                name="budgets"
                options={{ href: null }}
            />
            <Tabs.Screen
                name="budgets/new"
                options={{ href: null }}
            />
            <Tabs.Screen
                name="budgets/suggestions"
                options={{ href: null }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    fab: {
        top: -20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fabInner: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: COLORS.PRIMARY,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: COLORS.PRIMARY,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
});
