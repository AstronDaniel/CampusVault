import React, { createContext, useContext, useEffect, useRef } from 'react';
import { Realtime } from 'ably';
import Toast from 'react-native-toast-message';
import { useAuth } from './AuthContext';
import { authService } from '../services/authService';

interface NotificationContextType {
    showLocalNotification: (title: string, body: string, data?: any) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const ably = useRef<Realtime | null>(null);

    useEffect(() => {
        if (!user?.id) return;

        const connect = async () => {
            try {
                const realtime = new Realtime({
                    authCallback: async (tokenParams, callback) => {
                        try {
                            const tokenRequest = await authService.getAblyToken();
                            callback(null, tokenRequest);
                        } catch (err) {
                            callback(err as any, null);
                        }
                    }
                });

                ably.current = realtime;

                const channel = realtime.channels.get(`user-${user.id}-notifications`);
                channel.subscribe('notification', (message) => {
                    const { title, body, data } = message.data;
                    showLocalNotification(title, body, data);
                });

                // Also subscribe to global announcements
                const globalChannel = realtime.channels.get('global-notifications');
                globalChannel.subscribe('announcement', (message) => {
                    const { title, body } = message.data;
                    showLocalNotification(title, body, { type: 'announcement' });
                });

            } catch (error) {
                console.error('[NotificationProvider] Ably error:', error);
            }
        };

        connect();

        return () => {
            if (ably.current) {
                ably.current.close();
            }
        };
    }, [user?.id]);

    const showLocalNotification = (title: string, body: string, data?: any) => {
        Toast.show({
            type: 'info',
            text1: title,
            text2: body,
            onPress: () => {
                // handle navigation if possible
                console.log('Notification pressed:', data);
                Toast.hide();
            },
            visibilityTime: 5000,
            autoHide: true,
            topOffset: 50,
        });
    };

    return (
        <NotificationContext.Provider value={{ showLocalNotification }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
