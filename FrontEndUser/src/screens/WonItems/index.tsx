import { View, Text, StyleSheet, Platform, Alert } from 'react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { RootStackParamList } from '@/types/navigation';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSharedValue } from 'react-native-reanimated';
import { useStores } from '@/stores';
import {
  useFetchAuctionItems,
  useFetchWonAuctionItems,
} from '@/queries/listing.queries';
import { useNavigation } from '@react-navigation/native';
import SelectDropdown from 'react-native-select-dropdown';
import RNBounceable from '@freakycoder/react-native-bounceable';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { FlashList } from '@shopify/flash-list';
import { Carousel } from '@/components/molecules';
import { useTheme } from '@/theme';
import { useGetAds, useTrackClick } from '@/queries/adverts.queries';
import { forModalPresentationIOS } from '@react-navigation/stack/lib/typescript/src/TransitionConfigs/CardStyleInterpolators';
import filterSortContainer from '../../components/atoms/SortFilter/filterSortContainer';

type WonItemsPageScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'WonItems'
>;

const defaultDataWith6Colors = [
  '#B0604D',
  '#899F9C',
  '#B3C680',
  '#5C6265',
  '#F5D399',
  '#F1F1F1',
];
export default function WonItem() {
  const { layout, gutters, fonts, borders, variant, colors, navigationTheme } =
    useTheme();
  const scrollOffsetValue = useSharedValue<number>(0);
  const { auth } = useStores();
  const token = auth.token;
  const navigation = useNavigation<WonItemsPageScreenNavigationProp>();

  const { data, status, refetch } = useFetchWonAuctionItems(token);

  const [isLiked, setIsLiked] = React.useState(false);
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
  const targetDate = new Date();
  const [timeLeft, setTimeLeft] = useState(getCountdownTime(targetDate));
  const timeLeftRef = useRef(getCountdownTime(targetDate));
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

  const onItemPress = (item: any) => {
    navigation.navigate('Checkout', { item: item });
  };
  const isBiddingActive = (bidEndTime: string) => {
    const now = new Date().getTime();
    const endTime = new Date(bidEndTime).getTime();
    return endTime > now;
  };
  const auctionItemsData = data?.wonItems?.reverse() || [];

  if (!data) {
    refetch();
  }
  if (status === 'pending') {
    return <Text>Loading...</Text>;
  }
  if (status === 'error') {
    return <Text>Error</Text>;
  }

  return (
    <View style={[layout.fullHeight]}>
      <FlashList
        data={auctionItemsData}
        refreshing={false}
        onRefresh={() => {
          refetch();
        }}
        renderItem={({ item }: { item: any }) => {
          const lastBid = item.bids?.[item.bids.length - 1];
          const bidder = lastBid?.bidderId;
          return (
            <Carousel
              wonItem={{
                status: item.status,
                winDate: item.winDate,
              }}
              isLiked={isLiked}
              onPress={() => {
                onItemPress(item);
              }}
              item={item}
            />
          );
        }}
        estimatedItemSize={300}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 60,
        }}
        keyExtractor={(item: any) => item._id}
      />
    </View>
  );
}
