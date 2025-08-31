import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  ChangePass,
  Example,
  ForgotPass,
  Login,
  Otp,
  Signup,
  Startup,
} from '@/screens';
import { useTheme } from '@/theme';

import type { RootStackParamList } from '@/types/navigation';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Toasts } from '@backpackapp-io/react-native-toast';
import { useNetwork } from '@/hooks/network/NetworkProvider';
import NoConnection from '@/screens/NoConnection/NoConnection';
import { useStores } from '@/stores';
import TabNavigator from './TabNavigator';
import { SessionProvider } from '@/hooks/SessionContext/';

const Stack = createStackNavigator<RootStackParamList>();

function ApplicationNavigator() {
  const { variant, navigationTheme } = useTheme();
  const isConnected = useNetwork();
  const { auth } = useStores();
  const token = auth.token;
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView>
        {isConnected === false ? (
          <NoConnection />
        ) : (
          <NavigationContainer theme={navigationTheme}>
            <SessionProvider>
              <Stack.Navigator
                key={variant}
                screenOptions={{ headerShown: false }}
                // initialRouteName={token ? 'TabNavigator' : 'Login'}
                initialRouteName="Startup"
              >
                <Stack.Screen name="Login" component={Login} />
                <Stack.Screen name="ForgotPass" component={ForgotPass} />
                <Stack.Screen name="OTP" component={Otp} />
                <Stack.Screen name="ChangePass" component={ChangePass} />
                <Stack.Screen name="TabNavigator" component={TabNavigator} />
                <Stack.Screen name="Startup" component={Startup} />
                <Stack.Screen name="Example" component={Example} />
                <Stack.Screen name="Signup" component={Signup} />
              </Stack.Navigator>
            </SessionProvider>
          </NavigationContainer>
        )}
        <Toasts
          defaultStyle={{
            view: {
              backgroundColor: variant === 'dark' ? '#212331' : '#f7f7f7',
            },
            pressable: {
              backgroundColor: variant === 'dark' ? '#212331' : 'f7f7f7',
            },
            text: {
              color: variant === 'dark' ? 'white' : 'black',
            },
          }}
        />
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

export default ApplicationNavigator;
