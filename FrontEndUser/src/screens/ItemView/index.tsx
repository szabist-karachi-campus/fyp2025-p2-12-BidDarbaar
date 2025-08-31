import { Image, ScrollView, View } from 'react-native';
import React, { useEffect, useLayoutEffect, useState } from 'react';
import { RootStackParamList } from '@/types/navigation';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '@/theme';
import { useTranslation } from 'react-i18next';

import { useStores } from '@/stores';
import { Text } from 'react-native-paper';
import RNBounceable from '@freakycoder/react-native-bounceable';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Carousel, FavButton } from '@/components/molecules';

import {
  useFetchAuctionItem,
  useFetchFavoriteAuctionItems,
  useToggleFavourites,
} from '@/queries/listing.queries';
import { logo } from '../../../assets/images';
import { useSharedValue } from 'react-native-reanimated';
import Carousell from 'react-native-reanimated-carousel';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { toast } from '@backpackapp-io/react-native-toast';
import { useGetUserProfile, useGetUserWallet } from '@/queries/profile.queries';
import Wallet from '../Wallet/index';

type ItemViewScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'ItemView'
>;

export default function ItemView() {
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
  const navigation = useNavigation<ItemViewScreenNavigationProp>();
  const route = useRoute<RouteProp<RootStackParamList, 'ItemView'>>();
  const { data: favouriteItems } = useFetchFavoriteAuctionItems(token);
  const { mutateAsync: toggleFavouriotesMutateAsync } = useToggleFavourites();
  const { data: userWalletData, isLoading: getUserWalletStatus } =
    useGetUserWallet();

  const { item } = route.params;
  const { data, status, refetch } = useFetchAuctionItem({
    token: token,
    itemId: item._id,
  });

  const [isLiked, setIsLiked] = React.useState(false);
  const scrollOffsetValue = useSharedValue<number>(0);
  function isItemInFavorites(favoriteItems: any[], itemId: string): boolean {
    return favoriteItems.some(
      (favoriteItem) => favoriteItem.itemId._id === itemId,
    );
  }

  console.log('walle', userWalletData);
  navigation.setOptions({
    headerRight: () => (
      <View style={[layout.flex_1, { flexDirection: 'row', marginRight: 20 }]}>
        <RNBounceable onPress={() => {}}>
          <MaterialIcons
            name="notifications-on"
            size={30}
            color={variant === 'dark' ? 'white' : 'black'}
            style={[{ marginRight: 10 }]}
          />
        </RNBounceable>
        <RNBounceable onPress={() => {}}>
          <FavButton
            isLiked={isItemInFavorites(favouriteItems.favoriteItems, item._id)}
            setIsLiked={() =>
              toggleFavouriotesMutateAsync({
                token: auth.token,
                itemId: item._id,
              })
            }
          />
        </RNBounceable>
      </View>
    ),
  });

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12 || 12;

    return `${hours}:${minutes} ${ampm}`;
  };

  const formatShortDate = (isoString: string) => {
    const date = new Date(isoString);

    const day = date.getDate();
    const suffix =
      day === 1 || day === 21 || day === 31
        ? 'st'
        : day === 2 || day === 22
        ? 'nd'
        : day === 3 || day === 23
        ? 'rd'
        : 'th';

    const month = date.toLocaleString('en-US', { month: 'short' });

    const year = date.getFullYear().toString().slice(-2);
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

    return `${day}${suffix} ${month} ${year}`;
  };

  const [isBiddingEnabled, setIsBiddingEnabled] = useState(false);

  const [isBiddingEnded, setIsBiddingEnded] = useState(false);

  useEffect(() => {
    if (
      !data?.auctionItem?.BiddingStartTime ||
      !data?.auctionItem?.BiddingEndTime
    )
      return;

    const checkBiddingTime = () => {
      const now = Date.now();
      const startTime = new Date(data.auctionItem.BiddingStartTime).getTime();
      const endTime = new Date(data.auctionItem.BiddingEndTime).getTime();
      const bidDate = new Date(data.auctionItem.BiddingDate).setHours(
        0,
        0,
        0,
        0,
      );
      if (now < bidDate) {
        setIsBiddingEnabled(false);
        setIsBiddingEnded(false);
        return;
      }
      setIsBiddingEnabled(now >= startTime && now <= endTime);
      setIsBiddingEnded(now > endTime);
    };

    checkBiddingTime();
    const interval = setInterval(checkBiddingTime, 1000);

    return () => clearInterval(interval);
  }, [data?.auctionItem?.BiddingStartTime, data?.auctionItem?.BiddingEndTime]);

  console.log('USER INFORMATION', userWalletData?.wallet?.balance);

  const onHandleSubmit = () => {
    const onBiddingPress = (item: any) => {
      navigation.navigate('Bidding', { item });
    };

    const startingBid = data.auctionItem.startingBid;
    const walletBalance = userWalletData?.wallet?.balance ?? 0;
    const minimumRequired = startingBid * 0.1;
    const userId = userWalletData.wallet.user;
    const bids = data.auctionItem?.bids ?? [];

    console.log('user ki id hey yeh', userId);

    const hasUserBid = bids.some((bid: any) => bid.bidderId === userId);

    if (isBiddingEnded) {
      toast.error('Bidding has ended');
      return;
    }

    if (!isBiddingEnabled) {
      toast.error('Bidding is not enabled yet');
      return;
    }

    if (!hasUserBid && walletBalance < minimumRequired) {
      toast.error(
        `Insufficient balance. At least 10% of starting bid (PKR ${minimumRequired.toLocaleString()}) required.`,
      );
      return;
    }

    onBiddingPress(data.auctionItem);
  };
  if (status === 'pending') {
    return <Text>Loading...</Text>;
  }
  if (status === 'error') {
    refetch();
    return <Text>Error...</Text>;
  }
  const hasUserAlreadyBidded = data.auctionItem.bids.some(
    (bid: any) => bid.bidderId === userWalletData?.wallet?.user.id,
  );

  return (
    <>
      <View
        style={[
          layout.itemsCenter,
          layout.justifyCenter,
          {
            height: '38%',
            marginLeft: 20,
            width: '90%',
          },
        ]}
      >
        <Carousell
          testID={'xxx'}
          loop={false}
          width={380}
          height={250}
          snapEnabled={true}
          pagingEnabled={true}
          data={data.auctionItem.avatar}
          defaultScrollOffsetValue={scrollOffsetValue}
          style={[
            { height: '100%', flex: 1 },
            ,
            layout.itemsCenter,
            borders.rounded_16,
          ]}
          renderItem={({ item, index }) => (
            <View
              style={[
                layout.flex_1,
                layout.justifyCenter,
                { width: '100%', height: '100%' },
              ]}
            >
              <Image
                style={[
                  { height: '95%', overflow: 'hidden' },
                  layout.fullWidth,
                  borders.rounded_16,
                ]}
                source={item ? { uri: item } : logo}
                resizeMode="stretch"
              />

              <View
                style={[
                  {
                    position: 'absolute',
                    zIndex: 1000,
                    bottom: 20,
                    left: 20,
                    padding: 5,
                    paddingHorizontal: 10,
                  },
                  {
                    backgroundColor: navigationTheme.colors.border,
                    borderRadius: 2,
                  },
                ]}
              >
                <Text style={[fonts.gray800]}>
                  {index + 1} / {data.auctionItem.avatar.length}
                </Text>
              </View>
            </View>
          )}
        />
      </View>

      <View
        style={[
          {
            maxHeight: 100,
            width: '90%',
            flexDirection: 'column',
            backgroundColor: navigationTheme.colors.border,
            alignSelf: 'center',
            paddingBottom: 5,
          },
          borders.roundedTop_16,
        ]}
      >
        <View
          style={[
            {
              width: '100%',
              flexDirection: 'row',
              marginTop: 8,
            },
            layout.itemsCenter,
            layout.justifyCenter,
          ]}
        >
          <Text
            style={[
              fonts.bold,
              fonts.capitalize,
              fonts.gray800,

              { fontSize: 28 },
            ]}
          >
            {data.auctionItem.title}
          </Text>
        </View>

        <View
          style={[
            {
              marginTop: 5,
              width: '90%',
              alignSelf: 'center',
              flexDirection: 'row',
            },
            layout.itemsCenter,
            layout.justifyCenter,
          ]}
        >
          {data.auctionItem.categories.map(
            (
              category: {
                name:
                  | string
                  | number
                  | boolean
                  | React.ReactElement<
                      any,
                      string | React.JSXElementConstructor<any>
                    >
                  | Iterable<React.ReactNode>
                  | React.ReactPortal
                  | null
                  | undefined;
              },
              index: number,
            ) => (
              <Text
                style={[
                  fonts.gray400,
                  fonts.capitalize,
                  fonts.bold,
                  fonts.size_16,
                ]}
                numberOfLines={2}
                adjustsFontSizeToFit
              >
                {category.name}
                {data.auctionItem.categories.length === index + 1 ? '' : ' - '}
              </Text>
            ),
          )}
        </View>
      </View>
      <View
        style={[
          {
            height: 100,
            backgroundColor: navigationTheme.colors.border,
            overflow: 'hidden',
            borderBottomEndRadius: 16,
            width: '90%',
            alignSelf: 'center',
          },
          borders.roundedBottom_16,
        ]}
      >
        <View
          style={[
            { flex: 1, flexDirection: 'row', marginTop: 10, marginLeft: 30 },
          ]}
        >
          <View style={[{ flex: 1, flexDirection: 'row' }]}>
            <MaterialCommunityIcons
              name="currency-rupee"
              size={22}
              color={variant === 'dark' ? 'white' : 'black'}
            >
              <Text
                style={[fonts.gray800, fonts.bold, { fontSize: 22 }]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {' ' + data.auctionItem.startingBid}
              </Text>
            </MaterialCommunityIcons>
          </View>
          <View style={[{ flex: 1 }]}>
            <FontAwesome5
              name="hourglass-start"
              color={variant === 'dark' ? 'white' : 'black'}
              size={22}
            >
              <Text style={[fonts.gray800, fonts.bold, { fontSize: 22 }]}>
                {'   '}
                {formatTime(data.auctionItem.BiddingStartTime)}{' '}
              </Text>
            </FontAwesome5>
          </View>
        </View>

        <View
          style={[
            {
              width: '100%',
              flexDirection: 'row',
              paddingVertical: 20,
            },
          ]}
        >
          <View style={[{ flex: 1, marginLeft: 30 }]}>
            <FontAwesome5
              name="calendar-alt"
              color={variant === 'dark' ? 'white' : 'black'}
              size={22}
            >
              <Text style={[fonts.gray800, fonts.bold, { fontSize: 22 }]}>
                {' '}
                {formatShortDate(data.auctionItem.BiddingDate)}
              </Text>
            </FontAwesome5>
          </View>
          <View style={{ flex: 1 }}>
            <FontAwesome5
              name="hourglass-end"
              color={variant === 'dark' ? 'white' : 'black'}
              size={22}
            >
              <Text style={[fonts.gray800, fonts.bold, { fontSize: 22 }]}>
                {'   '}
                {formatTime(data.auctionItem.BiddingEndTime)}{' '}
              </Text>
            </FontAwesome5>
          </View>
        </View>
      </View>

      <View
        style={[
          {
            width: '90%',
            marginHorizontal: '5%',
            backgroundColor: navigationTheme.colors.border,
            height: '26%',
            marginTop: 10,
          },
          gutters.padding_12,
          borders.rounded_16,
        ]}
      >
        <ScrollView>
          <Text style={[fonts.gray400, fonts.size_16]}>
            {data.auctionItem.description}
          </Text>
        </ScrollView>
      </View>
      <RNBounceable
        style={[
          {
            position: 'absolute',
            bottom: 10,
            width: '90%',
            alignSelf: 'center',
            opacity: isBiddingEnabled ? 1 : 0.6,
          },
        ]}
        onPress={onHandleSubmit}
      >
        <View
          style={[
            layout.itemsCenter,
            layout.justifyCenter,
            borders.rounded_16,

            {
              height: 50,

              backgroundColor: 'tomato',
            },
          ]}
        >
          <Text style={[fonts.gray50, fonts.bold, fonts.size_24]}>
            Start Bidding
          </Text>
        </View>
      </RNBounceable>
    </>
  );
}
