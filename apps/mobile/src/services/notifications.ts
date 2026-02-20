import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import axios from 'axios';
import { API_URL } from '../constants/api';
import { tokenStorage } from './storage';

// Configure default notification behavior (native only)
if (Platform.OS !== 'web') {
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
        }),
    });
}

const getAuthHeaders = async () => {
    const token = await tokenStorage.getItem('userToken');
    return { Authorization: `Bearer ${token}` };
};

export const notificationsService = {
    async registerForPushNotifications(): Promise<string | null> {
        if (Platform.OS === 'web' || !Device.isDevice) {
            return null;
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            return null;
        }

        const projectId = Constants.expoConfig?.extra?.eas?.projectId;
        const tokenData = await Notifications.getExpoPushTokenAsync({
            projectId,
        });

        // Register on backend
        try {
            const headers = await getAuthHeaders();
            await axios.post(
                `${API_URL}/notifications/register`,
                {
                    token: tokenData.data,
                    platform: Platform.OS,
                },
                { headers },
            );
        } catch (error) {
            // Silently fail — user might not be logged in yet
        }

        return tokenData.data;
    },

    setupNotificationListeners(onNotificationTap?: (data: any) => void) {
        if (Platform.OS === 'web') {
            return () => {};
        }

        const receivedListener = Notifications.addNotificationReceivedListener(() => {
            // Notification received while app is open
        });

        const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
            const data = response.notification.request.content.data;
            if (onNotificationTap) {
                onNotificationTap(data);
            }
        });

        return () => {
            Notifications.removeNotificationSubscription(receivedListener);
            Notifications.removeNotificationSubscription(responseListener);
        };
    },
};
