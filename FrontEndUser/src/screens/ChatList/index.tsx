import { View, Text, Image, StyleSheet } from 'react-native';
import React, { useLayoutEffect } from 'react';
import RNBounceable from '@freakycoder/react-native-bounceable';
import Octicons from 'react-native-vector-icons/Octicons';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { FlashList } from '@shopify/flash-list';
import { useTheme } from '@/theme';
import { useStores } from '@/stores';
import { RootStackParamList } from '@/types/navigation';
import { useGetChats } from '@/queries/messages.queries';
import { logo, logoDark } from '@/../assets/images/index';

type ChatsListScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'ChatList'
>;

export default function ChatsList() {
  const { fonts } = useTheme();
  const { auth } = useStores();
  const navigation = useNavigation<ChatsListScreenNavigationProp>();
  const { data, isFetching, isError, isPending } = useGetChats(auth.token);
  const ChatCard = ({ item }: { item: any }) => {
    console.log('item', item);
    const isSuperAdmin =
      item.initiatorModel === 'SuperAdmin' ||
      item.receiverModel === 'SuperAdmin';
    const avatarUrl =
      item.initiatorModel === 'User'
        ? item.receiverModel === 'SuperAdmin'
          ? null
          : item.receiverId.avatar ??
            `https://ui-avatars.com/api/?name=${
              item.receiverId.name.split(' ')[0] +
              '+' +
              item.receiverId.name.split(' ')[1]
            }&background=cccccc&color=555555&rounded=true`
        : item.initiatorModel === 'SuperAdmin'
        ? null
        : item.initiatorId.avatar ??
          `https://ui-avatars.com/api/?name=${
            item.initiatorId.firstName + '+' + item.initiatorId.lastName
          }&background=cccccc&color=555555&rounded=true`;
    const name =
      item.initiatorModel === 'User'
        ? isSuperAdmin
          ? item.receiverId.firstName + ' ' + item.receiverId.lastName
          : item.receiverId.name
        : item.initiatorId.firstName + ' ' + item.initiatorId.lastName;
    const receiverId =
      item.initiatorModel === 'User'
        ? item.receiverId._id
        : item.initiatorId._id;
    const context = isSuperAdmin ? 'SuperAdmin' : 'AuctionHouse';
    let message = item.chats[item.chats.length - 1]?.message;

    return (
      <RNBounceable
        onPress={() => {
          navigation.navigate('ChatScreen', {
            name: isSuperAdmin ?"Bid Darbaar":name,
            id: item.itemId._id,
            image: avatarUrl,
            superAdmin: isSuperAdmin,
            receiverId,
            context,
          });
        }}
        style={styles.card}
      >
        <Image
          source={isSuperAdmin ? logo : { uri: avatarUrl }}
          style={[styles.avatar, { backgroundColor: 'white' }]}
        />
        <View style={styles.textContainer}>
          <Text style={[styles.name, fonts.gray800]}>
            {isSuperAdmin ? 'Bid Darbaar' : name}
          </Text>
          <Text style={[styles.message, fonts.gray800]}>{message}</Text>
        </View>
      </RNBounceable>
    );
  };
  if (isPending) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={[fonts.size_24, fonts.alignCenter, fonts.gray800]}>
          Loading...
        </Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={[fonts.size_24, fonts.red500]}>Error fetching data</Text>
      </View>
    );
  }

  return (
    <FlashList
      data={data.threads}
      keyExtractor={(item: any) => item._id}
      renderItem={({ item }) => <ChatCard item={item} />}
      contentContainerStyle={{
        paddingBottom: 100,
        paddingHorizontal: 10,
        paddingTop: 10,
      }}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  name: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  message: {
    color: '#555',
    fontSize: 14,
  },
});
