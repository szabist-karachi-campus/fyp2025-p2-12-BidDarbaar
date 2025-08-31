import { View, Text, Alert } from 'react-native';
import React, { useEffect } from 'react';
import { useTheme } from '@/theme';
import { FlashList } from '@shopify/flash-list';
import { ActivityIndicator } from 'react-native-paper';
import RNBounceable from '@freakycoder/react-native-bounceable';
import * as Icons from '@/components/molecules/Icons';
import { SafeScreen } from '@/components/templates';
import {
  useDeleteAuctionHouse,
  useGetAllAuctionHouses,
} from '@/queries/superAdmin.queries';
import { useStores } from '@/stores';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/navigation/types';
import { Paths } from '@/navigation/paths';
import { useNavigation } from '@react-navigation/native';
import LogoIcon from '@/../assets/chat.svg';

type SuperItemViewScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  Paths.SuperDashboard
>;
export default function SuperDashboard() {
  const { layout, variant, gutters, fonts } = useTheme();
  const { auth } = useStores();
  const { data, status, isError, refetch } = useGetAllAuctionHouses();
  const navigation = useNavigation<SuperItemViewScreenNavigationProp>();
  const {
    mutateAsync,
    status: deleteStatus,
    isError: deleteIsError,
  } = useDeleteAuctionHouse();
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <RNBounceable onPress={() => navigation.navigate(Paths.ChatList)}>
          <LogoIcon
            width={30}
            fill={'#1976D2'}
            height={30}
            style={[gutters.marginRight_16, layout.justifyCenter]}
          />
        </RNBounceable>
      ),
    });
  }, []);
  const deleteAuctionHouse = async (id: string) => {
    try {
      await mutateAsync({
        token: auth.token,
        auctionHouseId: id,
      });
      refetch();
    } catch (error) {
      console.error('Error deleting auction house:', error);
    }
  };
  const renderUsers = ({ item }: { item: AuctionHousesType }) => {
    return (
      <View
        style={[
          layout.fullWidth,
          gutters.marginBottom_12,
          gutters.padding_32,
          { borderRadius: 25 },
          {
            backgroundColor: variant === 'dark' ? '#1f1f1f' : '#ffffff',
            borderColor: variant === 'dark' ? '#333' : '#ddd',
            borderWidth: 1,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
          },
        ]}
      >
        <View style={[layout.row, layout.itemsCenter, layout.justifyBetween]}>
          <View style={[layout.row, layout.itemsCenter]}>
            <Text
              style={[
                fonts.size_32,
                fonts.bold,
                gutters.marginBottom_12,
                fonts.gray800,
              ]}
            >
              {item.name}
            </Text>
            <Text
              style={[
                fonts.size_12,
                fonts.bold,
                fonts.gray800,
                gutters.marginLeft_12,
              ]}
            >
              {item.verified ? '✅' : '❌'} verified
            </Text>
          </View>
          <RNBounceable
            onPress={() => {
              Alert.alert(
                'Delete Auction House',
                'Are you sure you want to delete this auction house?',
                [
                  {
                    text: 'Cancel',
                    style: 'cancel',
                  },
                  {
                    text: 'OK',
                    onPress: () => deleteAuctionHouse(item._id),
                  },
                ],
                { cancelable: false },
              );
            }}
            disabled={deleteStatus === 'pending'}
          >
            <Icons.FontAwesome5
              name="trash"
              size={20}
              color={deleteStatus === 'pending' ? 'gray' : 'red'}
            />
          </RNBounceable>
        </View>
        <Text style={[fonts.gray800, fonts.size_24, gutters.marginBottom_12]}>
          📧 {item.email}
        </Text>
        <Text style={[fonts.gray800, fonts.size_24, gutters.marginBottom_12]}>
          📱 {item.phoneNumber}
        </Text>
        <View style={[layout.row, layout.justifyBetween, layout.itemsCenter]}>
          <Text style={[fonts.gray800, fonts.size_24]}>🪪 {item.ntn}</Text>
          <Text
            style={[
              fonts.gray800,
              fonts.size_16,
              item.accountStatus === 'active'
                ? { color: 'green' }
                : { color: 'red' },
            ]}
          >
            {item.accountStatus.toUpperCase()}
          </Text>
        </View>
      </View>
    );
  };
  if (data) {
    console.log('data', data.auctionHouses);
  }
  return (
    <SafeScreen noPadding isError={isError} onResetError={refetch}>
      <View
        style={[
          layout.flex_1,
          layout.fullWidth,
          gutters.paddingHorizontal_12,
          gutters.paddingTop_12,
        ]}
      >
        <FlashList
          data={data?.auctionHouses}
          renderItem={renderUsers}
          estimatedItemSize={100}
          keyExtractor={(item) => item._id.toString()}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View
              style={[layout.flex_1, layout.itemsCenter, layout.justifyCenter]}
            >
              <Text style={[fonts.size_24, fonts.bold, fonts.gray800]}>
                No Auction Houses Found
              </Text>
            </View>
          }
          ListFooterComponent={
            status === 'pending' ? (
              <ActivityIndicator size="large" color="#0000ff" />
            ) : null
          }
        />
      </View>
    </SafeScreen>
  );
}
