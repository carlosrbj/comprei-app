import "../global.css";
import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { useAuthStore } from '../src/store/authStore';
import { useOnboardingStore } from '../src/store/onboardingStore';
import { View, ActivityIndicator } from 'react-native';
import { Linking } from 'react-native';
import { notificationsService } from '../src/services/notifications';
import { initDatabase } from '../src/database/schema';
import { syncService } from '../src/services/sync';
import { useSyncStore } from '../src/store/syncStore';

export default function RootLayout() {
    console.log('RootLayout mounting...');
    const { token, isLoading, restoreToken } = useAuthStore();
    const { completed: onboardingCompleted } = useOnboardingStore();
    const segments = useSegments();
    const router = useRouter();

    // One-time initialization: DB + token restore + notification listeners + deep links
    useEffect(() => {
        const init = async () => {
            await restoreToken();
        };
        init();

        // Initialize SQLite database
        initDatabase().catch((err) => console.warn('DB init failed:', err));

        // Setup notification listeners
        const cleanupNotifications = notificationsService.setupNotificationListeners((data) => {
            if (data?.screen === 'liberdade') {
                router.push('/(app)/liberdade' as any);
            }
        });

        // Handle deep links: comprei://r/CODE -> open register with referral code
        const handleDeepLink = ({ url }: { url: string }) => {
            const match = url.match(/comprei:\/\/r\/([A-Z0-9]+)/i);
            if (match) {
                const code = match[1].toUpperCase();
                router.push(`/auth/register?ref=${code}` as any);
            }
        };

        // Check if app was opened from a deep link (cold start)
        Linking.getInitialURL().then((url) => {
            if (url) handleDeepLink({ url });
        });

        const linkingListener = Linking.addEventListener('url', handleDeepLink);

        return () => {
            cleanupNotifications();
            linkingListener.remove();
        };
    }, []);

    // Auth routing + push registration + sync setup
    useEffect(() => {
        if (isLoading) return;

        const inAuthGroup = segments[0] === 'auth';
        const inOnboardingGroup = (segments[0] as string) === 'onboarding';

        if (!token && !inAuthGroup) {
            router.replace('/auth/login');
        } else if (token && inAuthGroup) {
            // After login: show onboarding if not completed yet
            if (!onboardingCompleted) {
                router.replace('/onboarding' as any);
            } else {
                router.replace('/');
            }
        } else if (token && !inAuthGroup && !inOnboardingGroup && !onboardingCompleted) {
            // Authenticated but onboarding not done (e.g. direct deep link)
            router.replace('/onboarding' as any);
        }

        if (token) {
            notificationsService.registerForPushNotifications();

            // Initial data sync
            const userId = useAuthStore.getState().user?.id;
            if (userId) {
                syncService.performInitialSync(userId).catch(() => {});
            }

            // Auto-sync when connectivity is restored
            const unsubSync = syncService.setupAutoSync((status) => {
                useSyncStore.setState(status);
            });

            return unsubSync;
        }
    }, [token, isLoading, segments]);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return <Slot />;
}
