import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import WelcomePage from '@/screens/UserPage';
import {
  Bidding,
  ChatList,
  ChatScreen,
  Checkout,
  Favorites,
  UserProfile,
  WonItems,
} from '@/screens';
import FontAwesome5Icon from 'react-native-vector-icons/FontAwesome5';
import useTheme from '@/theme/hooks/useTheme';
import { createStackNavigator } from '@react-navigation/stack';
import ItemView from '@/screens/ItemView';
import Delivery from '@/screens/Delivery.tsx';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function HomeStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: true }}
      initialRouteName="Home"
    >
      <Stack.Screen
        options={{ headerStyle: { borderWidth: 0 } }}
        name="Home"
        component={WelcomePage}
      />
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Product Details',
          headerStyle: { borderWidth: 1 },
        }}
        name="ItemView"
        component={ItemView}
      />

      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Bidding',
          headerStyle: { borderWidth: 1 },
        }}
        name="Bidding"
        component={Bidding}
      />
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Chats',
          headerStyle: { borderWidth: 1 },
        }}
        component={ChatList}
        name={'ChatList'}
      />
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Chat',
          headerStyle: { borderWidth: 1 },
        }}
        name="ChatScreen"
        component={ChatScreen}
      />
    </Stack.Navigator>
  );
}

function WonItemStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: true }}
      initialRouteName="WonItems"
    >
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Won Items',
          headerStyle: { borderWidth: 1 },
        }}
        name="WonItems"
        component={WonItems}
      />
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Checkout',
          headerStyle: { borderWidth: 1 },
        }}
        name="Checkout"
        component={Checkout}
      />
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Delivery',
          headerStyle: { borderWidth: 1 },
        }}
        name="Delivery"
        component={Delivery}
      />
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Chat',
          headerStyle: { borderWidth: 1 },
        }}
        name="ChatScreen"
        component={ChatScreen}
      />
    </Stack.Navigator>
  );
}
function TabNavigator() {
  const { variant } = useTheme();

  return (
    <Tab.Navigator
      initialRouteName="HomeStack"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => {
          const color = focused ? 'tomato' : 'gray';
          if (route.name === 'HomeStack') {
            return <FontAwesome5Icon name="home" size={20} color={color} />;
          } else if (route.name === 'Profile') {
            return <FontAwesome5Icon name="user-alt" size={20} color={color} />;
          } else if (route.name === 'FavoriteItems') {
            return (
              <FontAwesome5Icon name="heart" size={20} color={color} solid />
            );
          } else if (route.name === 'WonItemsStack') {
            return (
              <FontAwesome5Icon name="trophy" size={20} color={color} solid />
            );
          }
        },
        tabBarActiveTintColor: 'tomato',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen
        options={{
          title: 'Home',
        }}
        name="HomeStack"
        component={HomeStackNavigator}
      />
      <Tab.Screen
        options={{
          headerShown: true,
          title: 'Favorites',
          headerStyle: { borderWidth: 1 },
        }}
        name="FavoriteItems"
        component={Favorites}
      />
      <Tab.Screen
        options={{
          title: 'Won Items',
          headerShown: false,
          headerStyle: { borderWidth: 1 },
        }}
        name="WonItemsStack"
        component={WonItemStackNavigator}
      />
      <Tab.Screen
        options={{
          headerShown: true,
          title: 'Profile',
          headerStyle: { borderWidth: 1 },
        }}
        name="Profile"
        component={UserProfile}
      />
    </Tab.Navigator>
  );
}

export default TabNavigator;
