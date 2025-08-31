import { View, Text, Image, StyleSheet } from 'react-native';
import React, { useLayoutEffect } from 'react';
import RNBounceable from '@freakycoder/react-native-bounceable';

import { useNavigation } from '@react-navigation/native';
import { Paths } from '@/navigation/paths';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/navigation/types';
import { FlashList } from '@shopify/flash-list';
import { useTheme } from '@/theme';
import { useGetChats } from '@/queries/message.queries';
import { useStores } from '@/stores';
import { logo } from '../../../images';

type ChatsListScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  Paths.ChatList
>;

export default function ChatsList() {
  const { fonts } = useTheme();
  const { auth } = useStores();
  const navigation = useNavigation<ChatsListScreenNavigationProp>();
  const { data, isPending, isError } = useGetChats(auth.token);
  const ChatCard = ({ item }: { item: any }) => {
    let context: 'User' | 'AuctionHouse' | 'SuperAdmin' = 'User';
    let isItemSuperAdmin = false;
    let recieverId = '';
    let name = '';
    let avatarUrl = '';
    function ensureHttpsUrl(url: string): string {
      if (!url) return '';
      return url.startsWith('http://')
        ? url.replace('http://', 'https://')
        : url;
    }
    console.log('Item', item);
    if (auth.superAdmin) {
      if (item.initiatorModel === 'SuperAdmin') {
        context = item.receiverModel;
        recieverId = item.receiverId._id;
        if (item.receiverModel === 'AuctionHouse') {
          name = item.receiverId.name;
          avatarUrl = item.receiverId.avatar
            ? item.receiverId.avatar
            : `http://ui-avatars.com/api/?name=${item.receiverId.name.split(' ')[0] + '+' + item.receiverId.name.split(' ')[1]}&background=cccccc&color=555555&rounded=true`;
        } else {
          name = item.receiverId.firstName + ' ' + item.receiverId.lastName;

          avatarUrl = item.receiverId.avatar
            ? item.receiverId.avatar
            : `http://ui-avatars.com/api/?name=${item.receiverId.firstName + '+' + item.receiverId.lastName}&background=cccccc&color=555555&rounded=true`;
        }
      } else {
        context = item.initiatorModel;
        recieverId = item.initiatorId._id;
        if (item.initiatorModel === 'AuctionHouse') {
          name = item.initiatorId.name;
          avatarUrl = item.initiatorId.avatar
            ? item.initiatorId.avatar
            : `http://ui-avatars.com/api/?name=${item.initiatorId.name.split(' ')[0] + '+' + item.initiatorId.name.split(' ')[1]}&background=cccccc&color=555555&rounded=true`;
        } else {
          name = item.initiatorId.firstName + ' ' + item.initiatorId.lastName;
          avatarUrl = item.initiatorId.avatar
            ? item.initiatorId.avatar
            : `http://ui-avatars.com/api/?name=${item.initiatorId.firstName + '+' + item.initiatorId.lastName}&background=cccccc&color=555555&rounded=true`;
        }
      }
    } else {
      if (item.initiatorModel === 'AuctionHouse') {
        if (item.receiverModel === 'SuperAdmin') {
          isItemSuperAdmin = true;
          name = 'Bid Darbaar';
        } else if (item.receiverModel === 'User') {
          name = item.receiverId.firstName + ' ' + item.receiverId.lastName;
          avatarUrl = item.receiverId.avatar
            ? item.receiverId.avatar
            : `http://ui-avatars.com/api/?name=${item.receiverId.firstName + '+' + item.receiverId.lastName}&background=cccccc&color=555555&rounded=true`;
        }
        context = item.receiverModel;
        recieverId = item.receiverId._id;
      } else {
        if (item.initiatorModel === 'SuperAdmin') {
          isItemSuperAdmin = true;
          name = 'Bid Darbaar';
        } else if (item.initiatorModel === 'User') {
          name = item.initiatorId.firstName + ' ' + item.initiatorId.lastName;
          avatarUrl = item.initiatorId.avatar
            ? item.initiatorId.avatar
            : `http://ui-avatars.com/api/?name=${item.initiatorId.firstName + '+' + item.initiatorId.lastName}&background=cccccc&color=555555&rounded=true`;
        }
        context = item.initiatorModel;
        recieverId = item.initiatorId._id;
      }
    }
    let message = item.chats[item.chats.length - 1]?.message;
    avatarUrl = ensureHttpsUrl(avatarUrl);
    return (
      <RNBounceable
        onPress={() => {
          navigation.navigate(Paths.Chat, {
            id: item.itemId._id,
            context: context,
            receiverId: recieverId,
            name: name,
            image: avatarUrl,
          });
        }}
        style={styles.card}
      >
        <Image
          source={isItemSuperAdmin ? logo : { uri: avatarUrl }}
          style={[
            styles.avatar,
            isItemSuperAdmin && { backgroundColor: 'white' },
          ]}
        />
        <View style={styles.textContainer}>
          <Text style={[styles.name, fonts.gray800]}>
            {isItemSuperAdmin ? 'Bid Darbaar' : name}
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
