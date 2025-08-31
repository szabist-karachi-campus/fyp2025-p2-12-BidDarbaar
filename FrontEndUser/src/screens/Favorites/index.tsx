import { Image, ScrollView, View } from 'react-native';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { RootStackParamList } from '@/types/navigation';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '@/theme';
import { useTranslation } from 'react-i18next';

import { useStores } from '@/stores';
import { Text } from 'react-native-paper';
import { Carousel, FavButton } from '@/components/molecules';

import { useSharedValue } from 'react-native-reanimated';
import {
  useFetchFavoriteAuctionItems,
  useToggleFavourites,
} from '@/queries/listing.queries';
import { FlashList } from '@shopify/flash-list';

type FavoritesScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'FavoriteItems'
>;

export default function Favorites() {
  const {
    layout,
    gutters,
    fonts,
    borders,
    backgrounds,
    variant,
    changeTheme,
    navigationTheme,
  } = useTheme();
  const { auth } = useStores();
  const token = auth.token;
  const { t } = useTranslation(['Login', 'common', 'Signup', 'Otp']);
  const navigation = useNavigation<FavoritesScreenNavigationProp>();

  const { data, status, refetch } = useFetchFavoriteAuctionItems(token);
  const { mutateAsync: toggleFavouriotesMutateAsync } = useToggleFavourites();

  const [isLiked, setIsLiked] = React.useState(false);
  const scrollOffsetValue = useSharedValue<number>(0);

  const getCountdownTime = (targetDate: Date) => {
    const now = new Date().getTime();
    const distance = new Date(targetDate).getTime() - now;

    if (distance > 0) {
      const hours = Math.floor(
        (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      return {
        hours: hours.toString().padStart(2, '0'),
        minutes: minutes.toString().padStart(2, '0'),
        seconds: seconds.toString().padStart(2, '0'),
      };
    } else {
      return {
        hours: '00',
        minutes: '00',
        seconds: '00',
      };
    }
  };
  const onItemPress = (item: any) => {
    navigation.navigate('ItemView', { item: item });
  };
  const targetDate = new Date();
  const [timeLeft, setTimeLeft] = useState(getCountdownTime(targetDate));
  const timeLeftRef = useRef(getCountdownTime(targetDate));

  const isBiddingActive = (bidEndTime: string) => {
    const now = new Date().getTime();
    const endTime = new Date(bidEndTime).getTime();
    return endTime > now;
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const newTime = getCountdownTime(targetDate);
      if (
        timeLeftRef.current.hours !== newTime.hours ||
        timeLeftRef.current.minutes !== newTime.minutes ||
        timeLeftRef.current.seconds !== newTime.seconds
      ) {
        timeLeftRef.current = newTime;
        setTimeLeft(newTime);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);
  if (status === 'pending') {
    return <Text>Loading...</Text>;
  }
  if (status === 'error') {
    refetch();
    return <Text>Error...</Text>;
  }
  function isItemInFavorites(favoriteItems: any[], itemId: string): boolean {
    return favoriteItems.some(
      (favoriteItem) => favoriteItem.itemId._id === itemId,
    );
  }

  return (
    <View style={[layout.fullHeight]}>
      <FlashList
        data={data.favoriteItems}
        refreshing={false}
        onRefresh={() => {
          refetch();
        }}
        renderItem={({ item, index }: { item: any; index: number }) => (
          <Carousel
            onPress={() => {
              onItemPress(item.itemId);
            }}
            isLiked={true}
            setIsLiked={async () =>
              await toggleFavouriotesMutateAsync({
                token: auth.token,
                itemId: item.itemId._id,
              })
            }
            item={item.itemId}
          />
        )}
        estimatedItemSize={300}
        ListEmptyComponent={() => {
          return (
            <View
              style={{
                height: 100,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 20, color: 'white' }}>
                Opps! you do not have any favourite Items
              </Text>
            </View>
          );
        }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 60,
        }}
        keyExtractor={(item: any) => item._id}
      />
    </View>
  );
}
