import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { createContext, useContext, useEffect, useRef } from 'react';
import { Alert } from 'react-native';

import { Paths } from '@/navigation/paths';
import { RootStackParamList } from '@/navigation/types';

import { useStores } from '@/stores';

interface SessionContextProps {}
const SessionContext = createContext<SessionContextProps | undefined>(
  undefined,
);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { auth } = useStores();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const monitorSession = () => {
      if (!auth.token || !auth.expiresAt) {
        return;
      }

      intervalRef.current = setInterval(() => {
        const isExpired = new Date(auth.expiresAt).getTime() <= Date.now();
        if (isExpired && auth.token) {
          Alert.alert('Session Expired', 'Please log in again.', [
            {
              text: 'OK',
              onPress: () => {
                auth.setMany({ token: '', expiresAt: '' });
                navigation.navigate(Paths.Login);
              },
            },
          ]);

          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      }, 1000);
    };

    monitorSession();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [auth.token, auth.expiresAt]);

  return (
    <SessionContext.Provider value={{}}>{children}</SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};
