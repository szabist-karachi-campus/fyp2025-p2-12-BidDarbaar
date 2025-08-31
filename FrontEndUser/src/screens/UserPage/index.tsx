import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  Button,
  TextInput,
} from 'react-native';
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { RootStackParamList } from '@/types/navigation';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSharedValue } from 'react-native-reanimated';
import { useStores } from '@/stores';
import {
  useFetchAuctionItems,
  useFetchCategories,
  useFetchFavoriteAuctionItems,
  useToggleFavourites,
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
import { useStore } from '@backpackapp-io/react-native-toast/lib/typescript/core/store';
import FontAwesome5Icon from 'react-native-vector-icons/FontAwesome5';
import { useGetUserWallet } from '@/queries/profile.queries';
import { useStripe } from '@stripe/stripe-react-native';
import { useCreatePaymentIntent } from '@/queries/payment.queries';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import { ActivityIndicator } from 'react-native-paper';
import { queryClient } from '@/App';
import { REACT_QUERY_KEYS } from '@/queries';
import LogoIcon from '@/../assets/chat.svg';
import { toast } from '@backpackapp-io/react-native-toast';

type WelcomePageScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'WelcomePage'
>;

const schema = Yup.object().shape({
  amount: Yup.string()
    .required('Amount is required')
    .matches(/^[1-9][0-9]*$/, 'Enter a valid whole number greater than 0'),
});
export default function WelcomePage() {
  const {
    layout,
    gutters,
    fonts,
    borders,
    variant,
    colors,
    navigationTheme,
    backgrounds,
  } = useTheme();
  const scrollOffsetValue = useSharedValue<number>(0);
  const { auth } = useStores();
  const token = auth.token;
  const navigation = useNavigation<WelcomePageScreenNavigationProp>();
  const [searchQuery, setSearchQuery] = useState<string>('');

  const { data, status, refetch } = useFetchAuctionItems(token);
  const { data: categoriesData, status: categoriesStatus } =
    useFetchCategories();
  const { data: favouriteItems } = useFetchFavoriteAuctionItems(token);
  const {
    mutateAsync: paymentIntentMutateAsync,
    data: paymentIntentData,
    status: paymentIntentStatus,
  } = useCreatePaymentIntent();

  const { data: adData, status: adStatus, refetch: adRefetch } = useGetAds();
  const { data: userWalletData, isLoading: getUserWalletStatus } =
    useGetUserWallet();
  const { mutateAsync: toggleFavouriotesMutateAsync } = useToggleFavourites();
  const { mutateAsync, status: clickStatus } = useTrackClick();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const [isLiked, setIsLiked] = React.useState(false);
  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <RNBounceable onPress={() => navigation.navigate('ChatList')}>
          <LogoIcon
            width={30}
            fill={'#1976D2'}
            height={30}
            style={[gutters.marginLeft_16, layout.justifyCenter]}
          />
        </RNBounceable>
      ),
    });
  }, []);
  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      amount: '',
    },
  });
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
  const [sortOption, setSortOption] = useState<string | null>(null);

  const bottomSheetRef = useRef<BottomSheet>(null);

  const handleSheetChanges = useCallback((index: number) => {
    console.log('handleSheetChanges', index);
  }, []);
  const openSheet = () => {
    bottomSheetRef.current?.expand();
  };

  const closeSheet = () => {
    bottomSheetRef.current?.close();
  };
  const onSubmit = async (data: { amount: string }) => {
    const amount = parseInt(data.amount, 10);

    if (isNaN(amount)) return;
    if (amount < 15000) {
      toast.error('Minimum amount is PKR 15000');
      return;
    }

    try {
      const response = await paymentIntentMutateAsync({
        token: auth.token,
        amount: amount * 100,
      });

      console.log('Payment Intent Response:', response);

      if (!response?.clientSecret) {
        console.error('No client secret received');
        return;
      }
      bottomSheetRef.current?.close();

      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'BidDarbaar Inc.',
        paymentIntentClientSecret: response.clientSecret,
      });

      if (initError) {
        console.error('Error initializing payment sheet:', initError);
        return;
      }

      const { error } = await presentPaymentSheet();

      if (error) {
        console.log('Payment failed:', error.message);
      } else {
        console.log('Payment succeeded!');
        queryClient.invalidateQueries({
          queryKey: [REACT_QUERY_KEYS.profileQueries.getUserProfile],
        });
        queryClient.invalidateQueries({
          queryKey: [REACT_QUERY_KEYS.profileQueries.getUserWallet],
        });

        closeSheet();
      }
    } catch (err) {
      console.error('Error during payment process:', err);
    }
  };
  console.log('Payment Intent Data:', paymentIntentData);
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  useEffect(() => {
    if (userWalletData) {
      auth.set('walletBalance', userWalletData.wallet.balance);
    }
  }, [auth, userWalletData]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <RNBounceable
          onPress={openSheet}
          style={[
            gutters.marginRight_16,
            { backgroundColor: 'tomato' },
            layout.row,
            borders.rounded_16,
            layout.justifyCenter,
            layout.itemsCenter,
            { width: 100, height: 30 },
          ]}
        >
          <FontAwesome5Icon
            name="wallet"
            size={15}
            color={variant === 'dark' ? 'white' : 'black'}
          />
          {getUserWalletStatus ? (
            <Text style={[fonts.text, fonts.bold, gutters.marginLeft_12]}>
              Loading...
            </Text>
          ) : (
            <Text
              adjustsFontSizeToFit
              numberOfLines={1}
              style={[
                fonts.text,
                fonts.bold,
                gutters.marginLeft_12,
                fonts.alignCenter,
                { width: '50%' },
              ]}
            >
              {userWalletData.wallet.balance}
            </Text>
          )}
        </RNBounceable>
      ),
    });
  }, [
    navigation,
    variant,
    fonts,
    getUserWalletStatus,
    openSheet,
    userWalletData,
    userWalletData,
  ]);

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

  const emojisWithIcons = [
    { title: 'A-Z', icon: 'sort-alpha-down' },
    { title: 'Z-A', icon: 'sort-alpha-down-alt' },
    { title: 'Live', icon: 'broadcast-tower' },
    { title: 'Starting Soon', icon: 'clock' },
  ];

  const onItemPress = (item: any) => {
    navigation.navigate('ItemView', { item: item });
  };
  const isBiddingActive = (bidEndTime: string) => {
    const now = new Date().getTime();
    const endTime = new Date(bidEndTime).getTime();
    return endTime > now;
  };
  console.log("ADSITEMS",adData)
  const adsItems =
    adData?.ads.slice(0, 2).map((ad: { auctionItemId: any }) => ({
      ...ad.auctionItemId,
      isAd: true as const,
    })) || [];
  const auctionItemsData =
    data?.auctionItems
      ?.reverse()
      .filter((item: any) => isBiddingActive(item.BiddingEndTime)) || [];
  const auctionItems = auctionItemsData.map((item: any) => ({
    ...item,
    isAd: false as const,
  }));

  const combinedData = useMemo(
    () => [...adsItems, ...auctionItems],
    [adsItems, auctionItems],
  );

  const onAdClick = async (auctionItemId: string) => {
    const matchingAd = adData.ads.find(
      (ad: { auctionItemId: { _id: string } }) =>
        ad.auctionItemId._id === auctionItemId,
    );

    const adId = matchingAd ? matchingAd._id : null;
    await mutateAsync({
      token: token,
      adId: adId,
      userAgent: Platform.OS,
    });
  };
  function isItemInFavorites(favoriteItems: any[], itemId: string): boolean {
    return favoriteItems.some(
      (favoriteItem) => favoriteItem.itemId._id === itemId,
    );
  }
  const filteredData = useMemo(() => {
    let list = combinedData;

    if (selectedCategory) {
      list = list.filter((item) =>
        item.isAd
          ? true
          : item.categories.some((c: any) => c.name === selectedCategory),
      );
    }

    if (searchQuery.trim()) {
      const lower = searchQuery.toLowerCase();
      list = list.filter(
        (item) =>
          item.title?.toLowerCase().includes(lower) ||
          item.description?.toLowerCase().includes(lower),
      );
    }

    const adItems = list.filter((item) => item.isAd);
    let otherItems = list.filter((item) => !item.isAd);

    const now = Date.now();
    switch (sortOption) {
      case 'A-Z':
        otherItems = otherItems.sort((a, b) => a.title.localeCompare(b.title));
        break;

      case 'Z-A':
        otherItems = otherItems.sort((a, b) => b.title.localeCompare(a.title));
        break;

      case 'Live':
        const live = otherItems.filter(
          (item) =>
            new Date(item.BiddingStartTime).getTime() <= now &&
            new Date(item.BiddingEndTime).getTime() > now,
        );
        const notLive = otherItems.filter((item) => !live.includes(item));
        otherItems = [...live, ...notLive];
        break;

      case 'Starting Soon':
        const upcoming = otherItems.filter(
          (item) => new Date(item.BiddingStartTime).getTime() > now,
        );
        const rest = otherItems.filter((item) => !upcoming.includes(item));
        upcoming.sort(
          (a, b) =>
            new Date(a.BiddingStartTime).getTime() -
            new Date(b.BiddingStartTime).getTime(),
        );
        otherItems = [...upcoming, ...rest];
        break;
    }

    return [...adItems, ...otherItems];
  }, [combinedData, selectedCategory, searchQuery, sortOption]);

  const [categories, setCategories] = useState<string[]>([]);
  useEffect(() => {
    if (categoriesData?.categories) {
      const categoryNames = categoriesData.categories.map(
        (category: { name: string }) => category.name,
      );
      setCategories(categoryNames);
    }
  }, [categoriesData]);
  if (!data) {
    refetch();
  }
  if (status === 'pending' || categoriesStatus === 'pending' || !categories) {
    return <Text>Loading...</Text>;
  }
  if (status === 'error') {
    return <Text>Error</Text>;
  }
  return (
    <View style={{ flex: 1 }}>
      <View
        style={[
          { height: 50, width: '95%' },
          { backgroundColor: navigationTheme.colors.border },
          { flexDirection: 'row' },
          borders.rounded_16,
          { marginLeft: 10, marginTop: 5 },
        ]}
      >
        <SelectDropdown
          data={categories}
          onSelect={(selectedItem, index) => {
            console.log('selected item', selectedItem);
            if (selectedItem === selectedCategory) {
              setSelectedCategory(null);
            } else {
              setSelectedCategory(selectedItem);
            }
          }}
          renderButton={(selectedItem, isOpened) => {
            return (
              <RNBounceable style={[layout.flex_1, layout.itemsCenter]}>
                <View
                  style={[
                    layout.fullWidth,
                    { height: 50 },
                    { backgroundColor: navigationTheme.colors.border },
                    { flexDirection: 'row' },
                    borders.rounded_16,
                    layout.justifyCenter,
                  ]}
                >
                  <MaterialIcons
                    name="filter-list"
                    size={40}
                    color="white"
                    style={[{ marginTop: 2 }]}
                  />
                </View>
              </RNBounceable>
            );
          }}
          renderItem={(item, index, isSelected) => {
            return (
              <View
                style={[
                  {
                    ...styles.dropdownItemStyle,
                    height: 50,
                    backgroundColor: navigationTheme.colors.border,
                    ...(isSelected && {}),
                  },
                  item === selectedCategory
                    ? { backgroundColor: 'tomato' }
                    : {},
                ]}
              >
                <Icon
                  name={item.icon}
                  style={styles.dropdownItemIconStyle}
                  color={variant === 'dark' ? 'white' : 'black'}
                />
                <Text
                  style={[
                    styles.dropdownItemTxtStyle,
                    { color: variant === 'dark' ? 'white' : 'black' },
                  ]}
                >
                  {item.toUpperCase()}
                </Text>
              </View>
            );
          }}
          showsVerticalScrollIndicator={false}
          dropdownStyle={styles.dropdownMenuStyle}
        />
        <View
          style={[{ flex: 0.001 }, layout.itemsCenter, borders.wRight_2]}
        ></View>
        <SelectDropdown
          defaultValueByIndex={0}
          data={[{ title: 'None' }, ...emojisWithIcons]}
          onSelect={(item) => {
            setSortOption(item.title === 'None' ? null : item.title);
          }}
          renderButton={(selectedItem, isOpened) => {
            return (
              <RNBounceable style={[layout.flex_1, layout.itemsCenter]}>
                <View
                  style={[
                    layout.fullWidth,
                    { height: 50 },
                    { backgroundColor: navigationTheme.colors.border },
                    { flexDirection: 'row' },
                    borders.rounded_16,
                    layout.justifyCenter,
                  ]}
                >
                  <MaterialIcons
                    name="sort"
                    size={40}
                    color="white"
                    style={[{ marginTop: 2 }]}
                  />
                </View>
              </RNBounceable>
            );
          }}
          renderItem={(item, index, isSelected) => {
            return (
              <View
                style={[
                  {
                    ...styles.dropdownItemStyle,
                    backgroundColor: navigationTheme.colors.border,

                    ...(isSelected && { backgroundColor: 'tomato' }),
                  },
                ]}
              >
                <FontAwesome5Icon
                  name={item.icon}
                  style={styles.dropdownItemIconStyle}
                  color={variant === 'dark' ? 'white' : 'black'}
                />
                <Text
                  style={[
                    styles.dropdownItemTxtStyle,
                    { color: variant === 'dark' ? 'white' : 'black' },
                  ]}
                >
                  {item.title}
                </Text>
              </View>
            );
          }}
          showsVerticalScrollIndicator={false}
          dropdownStyle={styles.dropdownMenuStyle}
        />
      </View>
      <View
        style={[
          layout.fullWidth,
          gutters.padding_12,
          { backgroundColor: navigationTheme.colors.card },
        ]}
      >
        <TextInput
          placeholder="Search items... 🔍 "
          placeholderTextColor={variant === 'dark' ? 'white' : 'black'}
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={[
            borders.w_1,
            borders.rounded_16,
            fonts.gray800,
            {
              paddingHorizontal: 12,
              height: 40,
              backgroundColor: navigationTheme.colors.card,
            },
          ]}
        />
      </View>
      <View style={[{ flex: 1 }]}>
        <FlashList
          data={filteredData}
          refreshing={false}
          onRefresh={() => {
            refetch();
            adRefetch();
          }}
          renderItem={({ item, index }: { item: any; index: number }) =>
            item.isAd ? (
              <Carousel
                isAd={true}
                isLiked={isItemInFavorites(
                  favouriteItems.favoriteItems,
                  item._id,
                )}
                onPress={async () => {
                  await onAdClick(item._id);
                  onItemPress(item);
                }}
                setIsLiked={() =>
                  toggleFavouriotesMutateAsync({
                    token: auth.token,
                    itemId: item._id,
                  })
                }
                item={item}
              />
            ) : (
              <Carousel
                isLiked={isItemInFavorites(
                  favouriteItems.favoriteItems,
                  item._id,
                )}
                onPress={() => {
                  onItemPress(item);
                }}
                setIsLiked={() =>
                  toggleFavouriotesMutateAsync({
                    token: auth.token,
                    itemId: item._id,
                  })
                }
                item={item}
              />
            )
          }
          estimatedItemSize={300}
          ListEmptyComponent={() =>
            searchQuery ? (
              <Text
                style={[fonts.text, fonts.alignCenter, gutters.marginTop_24]}
              >
                No items match “{searchQuery}”
              </Text>
            ) : (
              <View />
            )
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: 60,
          }}
          keyExtractor={(item, index) => item._id}
        />
      </View>

      <BottomSheet
        index={-1}
        ref={bottomSheetRef}
        onChange={handleSheetChanges}
        backgroundStyle={{ backgroundColor: navigationTheme.colors.border }}
        handleIndicatorStyle={backgrounds.gray800}
        enablePanDownToClose={true}
        snapPoints={['60%']}
      >
        <BottomSheetView style={styles.bottomSheetContent}>
          <View style={{ flex: 1, paddingHorizontal: '5%' }}>
            <Text
              style={[
                fonts.bold,
                fonts.text,
                gutters.marginBottom_16,
                fonts.size_24,
                {},
              ]}
            >
              Top Up Wallet
            </Text>

            <Text style={[gutters.marginTop_12, fonts.text, fonts.bold]}>
              Select Amount
            </Text>

            <View style={[layout.row, layout.justifyBetween, layout.wrap]}>
              {[15000, 20000, 30000, 40000, 50000, 100000].map((amount) => (
                <RNBounceable
                  onPress={() => setValue('amount', String(amount))}
                  key={amount}
                  style={[
                    gutters.padding_12,
                    borders.rounded_16,
                    layout.itemsCenter,
                    gutters.marginTop_24,
                    {
                      backgroundColor: 'tomato',
                      minWidth: 70,
                    },
                  ]}
                >
                  <Text style={[fonts.bold, { color: 'white' }]}>
                    PKR {amount}
                  </Text>
                </RNBounceable>
              ))}
            </View>

            <Text
              style={[
                gutters.marginTop_16,
                gutters.marginBottom_12,
                fonts.bold,
                fonts.text,
              ]}
            >
              Or Enter Amount
            </Text>
            <Controller
              control={control}
              name="amount"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  placeholder="Enter custom amount"
                  keyboardType="numeric"
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                  style={[
                    borders.w_1,
                    borders.rounded_4,
                    fonts.text,
                    gutters.padding_12,
                    gutters.marginTop_12,
                    {
                      borderColor: errors.amount ? 'red' : 'tomato',
                    },
                  ]}
                />
              )}
            />
            {errors.amount && (
              <Text style={[gutters.marginTop_12, { color: 'red' }]}>
                {errors.amount.message}
              </Text>
            )}
            <RNBounceable
              disabled={
                getUserWalletStatus || paymentIntentStatus === 'pending'
              }
              onPress={handleSubmit(onSubmit)}
              style={[
                gutters.padding_16,
                borders.rounded_16,
                layout.itemsCenter,
                gutters.marginTop_24,
                {
                  backgroundColor: 'tomato',
                },
              ]}
            >
              {getUserWalletStatus || paymentIntentStatus === 'pending' ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={[fonts.bold, { color: 'white' }]}>
                  Confirm Top-Up
                </Text>
              )}
            </RNBounceable>
          </View>
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  dropdownButtonStyle: {
    width: 200,
    height: 50,
    backgroundColor: '#E9ECEF',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  dropdownButtonTxtStyle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '500',
    color: '#151E26',
  },
  dropdownButtonArrowStyle: {
    fontSize: 28,
  },
  dropdownButtonIconStyle: {
    fontSize: 28,
    marginRight: 8,
  },
  dropdownMenuStyle: {
    backgroundColor: '#E9ECEF',
    borderRadius: 8,
  },
  dropdownItemStyle: {
    width: '100%',
    flexDirection: 'row',
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  dropdownItemTxtStyle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '500',
    color: '#151E26',
  },
  dropdownItemIconStyle: {
    fontSize: 28,
    marginRight: 8,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomSheetContent: {
    flex: 1,
  },
  closeButton: {
    marginTop: 20,
  },
});
