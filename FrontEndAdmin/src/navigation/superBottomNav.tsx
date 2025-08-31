import {
  ChatList,
  ChatScreen,
  superAdminCreate,
  SuperCategory,
  SuperCategoryView,
  SuperDashBoard,
  SuperUser,
  SuperUserView,
  SuperWaitingList,
} from '@/screens';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { Paths } from './paths';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { createStackNavigator } from '@react-navigation/stack';
import SuperItemView from '@/screens/SuperAdmin/SuperItemView';
const Tab = createBottomTabNavigator();

export default function MySuperTabs() {
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

  function UsersStack() {
    return (
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName={Paths.SuperUser}
      >
        <Stack.Screen
          options={{
            headerShown: true,
            headerStyle: { borderWidth: 1 },
            title: 'Users',
          }}
          name={Paths.SuperUser}
          component={SuperUser}
        />
        <Stack.Screen
          options={{
            headerShown: true,
            title: ' ',
            headerStyle: { borderWidth: 1 },
          }}
          component={SuperUserView}
          name={Paths.SuperUserView}
        />
      </Stack.Navigator>
    );
  }

  function CategoryStack() {
    return (
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName={Paths.SuperCategory}
      >
        <Stack.Screen
          options={{
            headerShown: true,
            title: '',
            headerStyle: { borderWidth: 1 },
          }}
          name={Paths.SuperCategory}
          component={SuperCategory}
        />
        <Stack.Screen
          options={{
            headerShown: true,
            title: '',
            headerStyle: { borderWidth: 1 },
          }}
          name={Paths.SuperCategoryView}
          component={SuperCategoryView}
        />
        <Stack.Screen
          options={{
            headerShown: true,
            title: '',
            headerStyle: { borderWidth: 1 },
          }}
          name={Paths.SuperItem}
          component={SuperItemView}
        />
      </Stack.Navigator>
    );
  }

  function SuperDashBoardStack() {
    return (
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName={Paths.SuperDashboard}
      >
        <Stack.Screen
          options={{
            headerShown: true,
            title: '',
            headerStyle: { borderWidth: 1 },
          }}
          name={Paths.SuperDashboard}
          component={SuperDashBoard}
        />
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Chats',
            headerStyle: { borderWidth: 1 },
          }}
          name={Paths.ChatList}
          component={ChatList}
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
      </Stack.Navigator>
    );
  }
  return (
    <Tab.Navigator>
      <Tab.Screen
        name={Paths.SuperDashboardStack}
        component={SuperDashBoardStack}
        options={{
          headerShown: false,
          headerTitle: () => <HeaderTitle title={{ bold: true, text: ' ' }} />,
          tabBarLabel: ({ focused, color }) => (
            <Text
              adjustsFontSizeToFit
              numberOfLines={1}
              style={{ color, marginTop: 5 }}
            >
              Houses
            </Text>
          ),
          tabBarIcon: ({ focused, color, size }) => (
            <Icon name="landmark" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name={Paths.SuperWaitingList}
        component={SuperWaitingList}
        options={{
          headerShown: true,
          headerTitle: () => <HeaderTitle title={{ bold: true, text: ' ' }} />,
          tabBarLabel: ({ focused, color }) => (
            <Text style={{ color, marginTop: 5 }}>Waiting List</Text>
          ),
          tabBarIcon: ({ focused, color, size }) => (
            <Icon name="hourglass-end" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name={Paths.SuperCategoryStack}
        component={CategoryStack}
        options={{
          headerShown: false,
          headerTitle: () => <HeaderTitle title={{ bold: true, text: ' ' }} />,
          tabBarLabel: ({ focused, color }) => (
            <Text style={{ color, marginTop: 5 }}>Category</Text>
          ),
          tabBarIcon: ({ focused, color, size }) => (
            <Icon name="th-large" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name={Paths.SuperAdminCreate}
        component={superAdminCreate}
        options={{
          headerShown: true,
          headerTitle: () => <HeaderTitle title={{ bold: true, text: ' ' }} />,
          tabBarLabel: ({ focused, color }) => (
            <Text
              adjustsFontSizeToFit
              numberOfLines={1}
              style={{ color, marginTop: 5 }}
            >
              Admins
            </Text>
          ),
          tabBarIcon: ({ focused, color, size }) => (
            <Icon name="user-plus" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name={Paths.SuperUserStack}
        component={UsersStack}
        options={{
          headerShown: false,
          headerTitle: () => <HeaderTitle title={{ bold: true, text: ' ' }} />,
          tabBarLabel: ({ focused, color }) => (
            <Text style={{ color, marginTop: 5 }}>Users</Text>
          ),
          tabBarIcon: ({ focused, color, size }) => (
            <Icon name="user-alt" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
