import 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MMKV } from 'react-native-mmkv';

import { ThemeProvider } from '@/theme';

import ApplicationNavigator from './navigators/Application';
import './translations';
import { NetworkProvider } from './hooks/network/NetworkProvider';
import { StoresProvider, useStores } from './stores';
import client from '../client/graphqlClient';
import { ApolloProvider } from '@apollo/client';
import messaging from '@react-native-firebase/messaging';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { StripeProvider } from '@stripe/stripe-react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import notifee, { AndroidImportance } from '@notifee/react-native';
import { logo } from '../assets/images';

export const queryClient = new QueryClient();

export const storage = new MMKV();

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
    console.log('Device Token:', token);
    auth.set('deviceToken', token);
  } catch (error) {
    console.error('Failed to get device token:', error);
  }
}

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
    <QueryClientProvider client={queryClient}>
      <ThemeProvider storage={storage}>
        <StoresProvider>
          <StripeProvider
            publishableKey={publishableKey}
            merchantIdentifier="merchant.identifier"
          >
            <ApolloProvider client={client}>
              <NetworkProvider>
                <GestureHandlerRootView style={{ flex: 1 }}>
                  <BottomSheetModalProvider>
                    <ApplicationNavigator />
                  </BottomSheetModalProvider>
                </GestureHandlerRootView>
              </NetworkProvider>
            </ApolloProvider>
          </StripeProvider>
        </StoresProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
