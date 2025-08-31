import { View, Text, Alert } from 'react-native';
import React, { useEffect } from 'react';
import { SafeScreen } from '@/components/templates';
import { useGetAllUsers } from '@/queries/superAdmin.queries';
import { Avatar } from 'react-native-paper';
import { AvatarUser } from '@/../images/avatar.png';
import { useTheme } from '@/theme';
import { FontAwesome5 } from '@/components/molecules';
import RNBounceable from '@freakycoder/react-native-bounceable';
import { FlashList } from '@shopify/flash-list';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/navigation/types';
import { Paths } from '@/navigation/paths';
import { useNavigation } from '@react-navigation/native';
import { useStores } from '@/stores';
import FontAwesome5Icon from 'react-native-vector-icons/FontAwesome5';

type SuperUserNavigationProp = StackNavigationProp<
  RootStackParamList,
  Paths.SuperUser
>;
export default function SuperUser() {
  const { data, isError, status, refetch } = useGetAllUsers();
  const { backgrounds, fonts, borders, layout, gutters, variant } = useTheme();
  const [avatarUri, setAvatarUri] = React.useState<string | null>(null);
  const { auth, superAdmin } = useStores();

  const navigation = useNavigation<SuperUserNavigationProp>();
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <RNBounceable
          onPress={handleLogout}
          style={[gutters.marginRight_24, layout.justifyCenter]}
        >
          <FontAwesome5Icon
            name="sign-out-alt"
            size={25}
            color={variant === 'dark' ? 'white' : 'black'}
          />
        </RNBounceable>
      ),
    });
  }, []);
  const handleLogout = async () => {
    try {
      auth.logout();
      superAdmin.clearSuperAdmin();

      Alert.alert('Logged Out', 'You have successfully logged out!');

      navigation.reset({
        index: 0,
        routes: [{ name: Paths.Login }],
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to log out. Please try again.');
      console.error('Logout Error:', error);
    }
  };
  if (status === 'pending') {
    return (
      <SafeScreen noPadding>
        <Text>Loading...</Text>
      </SafeScreen>
    );
  }

  const renderUserCard = (user: endUserType) => {
    const avatar = user?.avatar?.replace(/^http:\/\//i, 'https://') || null;
    return (
      <RNBounceable
        onPress={() => {
          navigation.navigate(Paths.SuperUserView, {
            id: user._id,
          });
        }}
        style={{
          flex: 1,
          borderWidth: 0,
          borderColor: 'red',
          paddingHorizontal: 10,
        }}
      >
        <View
          style={[
            backgrounds.gray100,
            layout.row,
            layout.fullWidth,
            gutters.marginTop_24,
            borders.rounded_16,
            {
              height: 75,
            },
          ]}
        >
          <View
            style={[
              layout.justifyCenter,
              layout.itemsCenter,
              {
                flex: 0.7,
              },
            ]}
          >
            <Avatar.Image
              size={55}
              source={avatar !== null ? { uri: avatar } : AvatarUser}
            />
          </View>
          <View
            style={[
              {
                flex: 2,
              },
              layout.justifyCenter,
              layout.itemsCenter,
            ]}
          >
            <Text style={[fonts.gray800, fonts.size_24]}>
              {user.firstName} {user.lastName}
            </Text>
            <Text style={[fonts.size_16, fonts.gray800]}>{user.email}</Text>
          </View>
          <View
            style={[
              layout.justifyCenter,
              layout.itemsCenter,
              {
                flex: 0.5,
              },
            ]}
          >
            <FontAwesome5 name="chevron-right" size={30} color="white" />
          </View>
        </View>
      </RNBounceable>
    );
  };
  return (
    <SafeScreen noPadding isError={isError} onResetError={refetch}>
      <FlashList
        data={data?.users}
        renderItem={({ item }: { item: endUserType }) => renderUserCard(item)}
        estimatedItemSize={200}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
      />
    </SafeScreen>
  );
}
