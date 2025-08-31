import 'react-native-gesture-handler';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { MMKV } from 'react-native-mmkv';

import { ThemeProvider } from '@/theme';
import ApplicationNavigator from '@/navigation/Application';

import '@/translations';
import { NetworkProvider } from './hooks/network/NetworkProvider';
import { useEffect, useState } from 'react';
import { StoresProvider, useStores } from './stores';
import messaging from '@react-native-firebase/messaging';
import { Alert } from 'react-native';
import { StripeProvider } from '@stripe/stripe-react-native';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import notifee, { AndroidImportance } from '@notifee/react-native';
import { logo } from '../images';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

async function requestNotificationPermission() {
  const authStatus = await messaging().requestPermission();
  if (authStatus === messaging.AuthorizationStatus.AUTHORIZED) {
    console.log('Notification permission granted.');
  }
}
async function setupNotificationChannel() {
  await notifee.createChannel({
    id: 'default',
    name: 'Default Channel',
    importance: AndroidImportance.HIGH,
  });
}

async function getDeviceToken(auth: any) {
  try {
    const token = await messaging().getToken();
    auth.set('deviceToken', token);
  } catch (error) {
    console.error('Failed to get device token:', error);
  }
}
export const storage = new MMKV();

function App() {
  const { auth } = useStores();
  const [publishableKey, setPublishableKey] = useState('');

  const fetchPublishableKey = async () => {
    setPublishableKey(
      'pk_test_51RMb9D6aJZLW62K2zPAxGy0iGLD1Pu3JWk39BTGRzNPjChjPxGx3VwABq3amyI6HBQx8ElqZRKrdxDDbQLuHoAE800LmDGRhs6',
    );
  };

  useEffect(() => {
    fetchPublishableKey();
  }, []);

  useEffect(() => {
    setupNotificationChannel();
    requestNotificationPermission();
    getDeviceToken(auth);

    const unsubscribeForeground = messaging().onMessage(
      async (remoteMessage) => {
        console.log('Foreground Notification:', remoteMessage);

        await notifee.displayNotification({
          title: remoteMessage.notification?.title,
          body: remoteMessage.notification?.body,
          android: {
            channelId: 'default',
            smallIcon: logo,
            importance: AndroidImportance.HIGH,
            pressAction: {
              id: 'default',
            },
          },
          ios: {
            foregroundPresentationOptions: {
              alert: true,
              badge: true,
              sound: true,
            },
          },
        });
      },
    );

    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('Background Notification:', remoteMessage);
    });

    const unsubscribeOpened = messaging().onNotificationOpenedApp(
      (remoteMessage) => {
        console.log('Notification opened app:', remoteMessage);
      },
    );

    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log(
            'Notification opened app from quit state:',
            remoteMessage,
          );
        }
      });

    return () => {
      unsubscribeForeground();
      unsubscribeOpened();
    };
  }, []);
  
  return (
    <StoresProvider>
      <GestureHandlerRootView>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider storage={storage}>
            <NetworkProvider>
              <StripeProvider
                publishableKey={publishableKey}
                merchantIdentifier="merchant.bidDarbaarAdmin"
              >
                <BottomSheetModalProvider>
                  <ApplicationNavigator />
                </BottomSheetModalProvider>
              </StripeProvider>
            </NetworkProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </GestureHandlerRootView>
    </StoresProvider>
  );
}

export default App;
