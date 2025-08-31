import type { RootStackParamList } from '@/navigation/types';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { Paths } from '@/navigation/paths';
import {
  ChangePass,
  Example,
  ForgotPassword,
  Login,
  Otp,
  Signup,
  Startup,
} from '@/screens';
import newItem from '@/screens/auctionItems/newItem';
import { Toasts } from '@backpackapp-io/react-native-toast';
import { useNetwork } from '@/hooks/network/NetworkProvider';
import NoConnection from '@/screens/NoConnection/NoConnection';
import MyTabs from './bottomNav';
import MySuperTabs from './superBottomNav';
import auctionHouseUser from '@/screens/auctionUser';
import Profile from '@/screens/Profile';
import { useStores } from '@/stores';
import { SessionProvider } from '@/hooks/SessionContext';

const Stack = createStackNavigator<RootStackParamList>();

function ApplicationNavigator() {
  const { variant, navigationTheme } = useTheme();
  const isConnected = useNetwork();
  const { auth } = useStores();
  return (
    <SafeAreaProvider>
      {isConnected === false ? (
        <NoConnection />
      ) : (
        <NavigationContainer theme={navigationTheme}>
          <SessionProvider>
            <Stack.Navigator
              key={variant}
              screenOptions={{ headerShown: false }}
              initialRouteName={Paths.Startup}
            >
              <Stack.Screen component={Startup} name={Paths.Startup} />
              <Stack.Screen component={Example} name={Paths.Example} />
              <Stack.Screen component={Login} name={Paths.Login} />
              <Stack.Screen component={Signup} name={Paths.Signup} />
              <Stack.Screen component={Otp} name={Paths.Otp} />
              <Stack.Screen
                component={ForgotPassword}
                name={Paths.forgotPassword}
              />
              <Stack.Screen component={ChangePass} name={Paths.ChangePass} />
              <Stack.Screen component={MyTabs} name={Paths.BottomTab} />
              <Stack.Screen
                component={MySuperTabs}
                name={Paths.SuperBottomTab}
              />
              <Stack.Screen component={newItem} name={Paths.newItem} />
              <Stack.Screen
                component={auctionHouseUser}
                name={Paths.auctionHouseUser}
              />
              <Stack.Screen component={Profile} name={Paths.Profile} />
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
    </SafeAreaProvider>
  );
}

export default ApplicationNavigator;
