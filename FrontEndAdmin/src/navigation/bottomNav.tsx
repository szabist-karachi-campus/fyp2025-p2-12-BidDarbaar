import {
  Advertisement,
  AnalyticsScreen,
  ChatList,
  ChatScreen,
  Dashboard,
  Delivery,
  DeliveryOverView,
  NewAuctionItemPage,
  WithdrawScreen,
} from '@/screens';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Alert, Text } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

import { BottomNavPaths, Paths } from './paths';
import { useTranslation } from 'react-i18next';
import auctionHouseUser from '@/screens/auctionUser';
import Profile from '@/screens/Profile';
import { useTheme } from '@/theme';
import { createStackNavigator } from '@react-navigation/stack';
import itemView from '@/screens/auctionItems/itemView';
import { useStores } from '@/stores';
import {
  FontAwesome5,
  MaterialCommunityIcons,
  MaterialIcons,
} from '@/components/molecules';
const Tab = createBottomTabNavigator();

export default function MyTabs() {
  const { t } = useTranslation();
  const { fonts } = useTheme();

  const Stack = createStackNavigator();

  const HeaderTitle = ({ title }: any) => {
    const bold = title?.bold || false;
    const text = title?.text || 'Default Title';

    return (
      <Text style={[{ fontWeight: bold ? 'bold' : 'normal' }, fonts.gray800]}>
        {text}
      </Text>
    );
  };

  function ItemsStackNavigator() {
    return (
      <Stack.Navigator
        screenOptions={{ headerShown: true }}
        initialRouteName={Paths.auctionItems}
      >
        <Stack.Screen
          options={{ headerStyle: { borderWidth: 1 }, title: 'Items' }}
          name={Paths.auctionItems}
          component={NewAuctionItemPage}
        />
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Product Details',
            headerStyle: { borderWidth: 1 },
          }}
          component={itemView}
          name={Paths.ItemView}
        />
        <Stack.Screen component={Advertisement} name={Paths.Advertisement} />
      </Stack.Navigator>
    );
  }

  function deliverableStack() {
    return (
      <Stack.Navigator
        screenOptions={{ headerShown: true }}
        initialRouteName={Paths.delivery}
      >
        <Stack.Screen
          options={{ headerStyle: { borderWidth: 1 }, title: 'Delivery' }}
          name={Paths.delivery}
          component={Delivery}
        />
        <Stack.Screen
          options={{ headerStyle: { borderWidth: 1 }, title: 'Delivery' }}
          name={Paths.deliveryOverView}
          component={DeliveryOverView}
        />
        <Stack.Screen
          options={{ headerStyle: { borderWidth: 1 }, title: 'Delivery' }}
          name={Paths.Chat}
          component={ChatScreen}
        />
      </Stack.Navigator>
    );
  }

  function DashBoardStackNavigator() {
    return (
      <Stack.Navigator
        screenOptions={{ headerShown: true }}
        initialRouteName={Paths.Dashboard}
      >
        <Stack.Screen
          options={{
            headerStyle: { borderWidth: 1 },
            title: t('bottomTab.Dashboard'),
          }}
          name={Paths.Dashboard}
          component={Dashboard}
        />
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Product Details',
            headerStyle: { borderWidth: 1 },
          }}
          component={itemView}
          name={Paths.ItemView}
        />
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Chats',
            headerStyle: { borderWidth: 1 },
          }}
          component={ChatList}
          name={Paths.ChatList}
        />
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Withdraw',
            headerStyle: { borderWidth: 1 },
          }}
          component={WithdrawScreen}
          name={Paths.WithdrawScreen}
        />
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Chat',
            headerStyle: { borderWidth: 1 },
          }}
          component={ChatScreen}
          name={Paths.Chat}
        />
        <Stack.Screen component={Advertisement} name={Paths.Advertisement} />
      </Stack.Navigator>
    );
  }
  const { user } = useStores();
  return (
    <Tab.Navigator>
      
      {(user.jobTitle === 'sales' ||
        user.jobTitle === 'admin' ||
        user.userType === 'auctionHouse') && (
        <Tab.Screen
          name={Paths.DashboardStack}
          component={DashBoardStackNavigator}
          options={{
            headerShown: false,
            headerTitle: () => (
              <HeaderTitle title={{ bold: true, text: 'Home' }} />
            ),
            tabBarLabel: ({ focused, color }) => (
              <Text style={{ color }}>{t('bottomTab.Dashboard')}</Text>
            ),
            tabBarIcon: ({ focused, color, size }) => (
              <MaterialCommunityIcons
                name="bullhorn"
                size={size + 5}
                color={color}
              />
            ),
          }}
        />
      )}
      {(user.jobTitle === 'admin' || user.userType === 'auctionHouse') && (
        <Tab.Screen
          name={Paths.auctionHouseUser}
          component={auctionHouseUser}
          options={{
            headerShown: true,
            headerTitle: () => (
              <HeaderTitle title={{ bold: true, text: 'User' }} />
            ),
            tabBarLabel: ({ focused, color }) => (
              <Text style={{ color }}>User</Text>
            ),
            tabBarIcon: ({ focused, color, size }) => (
              <Icon name="user-plus" size={size} color={color} />
            ),
          }}
        />
      )}
      {
        (user.jobTitle === 'sales' ||
        user.jobTitle === 'admin' ||
        user.userType === 'auctionHouse')
        &&

      <Tab.Screen
        name={Paths.AnalyticsScreen}
        component={AnalyticsScreen}
        options={{
          headerShown: true,
          title: 'Analytics',
          headerTitle: () => (
            <HeaderTitle title={{ bold: true, text: 'Analytics' }} />
          ),
          tabBarLabel: ({ focused, color }) => (
            <Text style={{ color }}>{('Analytics')}</Text>
          ),
          tabBarIcon: ({ focused, color, size }) => (
            <MaterialIcons name="analytics" size={30} color={color} />
          ),
        }}
      />
      }
      {(user.jobTitle === 'lister' ||
        user.jobTitle === 'admin' ||
        user.userType === 'auctionHouse') && (
        <Tab.Screen
          name={Paths.auctionItem}
          component={ItemsStackNavigator}
          options={{
            headerShown: false,
            headerTitle: () => (
              <HeaderTitle title={{ bold: true, text: 'Items' }} />
            ),
            tabBarLabel: ({ focused, color }) => (
              <Text style={{ color }}>Items</Text>
            ),
            tabBarIcon: ({ focused, color, size }) => (
              <Icon name="dropbox" size={size} color={color} />
            ),
          }}
        />
      )}
      {(user.jobTitle === 'admin' || user.userType === 'auctionHouse') && (
        <Tab.Screen
          name={Paths.deliveryStack}
          component={deliverableStack}
          options={{
            headerShown: false,
            headerTitle: () => (
              <HeaderTitle title={{ bold: true, text: 'delivery' }} />
            ),
            tabBarLabel: ({ focused, color }) => (
              <Text style={{ color }}>Delivery</Text>
            ),
            tabBarIcon: ({ focused, color, size }) => (
              <FontAwesome5 name="shipping-fast" size={size} color={color} />
            ),
          }}
        />
      )}

      {(user.jobTitle === 'lister' ||
        user.jobTitle === 'admin' ||
        user.jobTitle === 'sales' ||
        user.userType === 'auctionHouse') && (
        <Tab.Screen
          name={Paths.ProfilePage}
          component={Profile}
          options={{
            headerShown: true,
            headerTitle: () => (
              <HeaderTitle title={{ bold: true, text: 'Profile' }} />
            ),
            tabBarLabel: ({ focused, color }) => (
              <Text style={{ color }}>Profile</Text>
            ),
            tabBarIcon: ({ focused, color, size }) => (
              <Icon name="user" size={size} color={color} />
            ),
          }}
        />
      )}
    </Tab.Navigator>
  );
}
