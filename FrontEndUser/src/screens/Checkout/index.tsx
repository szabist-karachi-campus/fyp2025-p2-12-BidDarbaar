import { Image, ScrollView, StyleSheet, View } from 'react-native';
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { RootStackParamList } from '@/types/navigation';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '@/theme';
import { useTranslation } from 'react-i18next';

import { useStores } from '@/stores';
import { ActivityIndicator, Text, TextInput } from 'react-native-paper';
import RNBounceable from '@freakycoder/react-native-bounceable';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Carousel, FavButton } from '@/components/molecules';

import { useFetchAuctionItem } from '@/queries/listing.queries';
import { logo } from '../../../assets/images';
import { useSharedValue } from 'react-native-reanimated';
import Carousell from 'react-native-reanimated-carousel';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { toast } from '@backpackapp-io/react-native-toast';
import FontAwesome5Icon from 'react-native-vector-icons/FontAwesome5';
import LottieView from 'lottie-react-native';
import {
  useCreateCheckout,
  useCreatePaymentIntent,
  useIsPayable,
} from '@/queries/payment.queries';
import { useGetUserProfile, useGetUserWallet } from '@/queries/profile.queries';
import { queryClient } from '@/App';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { REACT_QUERY_KEYS } from '@/queries';
import { useStripe } from '@stripe/stripe-react-native';
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';

type CheckoutScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Checkout'
>;

const schema = Yup.object().shape({
  amount: Yup.string()
    .required('Amount is required')
    .matches(/^[1-9][0-9]*$/, 'Enter a valid whole number greater than 0'),
});

export default function Checkout() {
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
  const navigation = useNavigation<CheckoutScreenNavigationProp>();
  const route = useRoute<RouteProp<RootStackParamList, 'Checkout'>>();
  const { data: userProfile, isLoading, error } = useGetUserProfile();
  const [isPayable, setIsPayable] = useState(false);

  const { item } = route.params;
  const { data, status, refetch } = useFetchAuctionItem({
    token: token,
    itemId: item._id,
  });

  const [isLiked, setIsLiked] = React.useState(false);
  const scrollOffsetValue = useSharedValue<number>(0);
  const {
    mutateAsync: paymentIntentMutateAsync,
    data: paymentIntentData,
    status: paymentIntentStatus,
  } = useCreatePaymentIntent();
  const { mutateAsync, isPending } = useCreateCheckout();
  const { data: userWalletData, isLoading: getUserWalletStatus } =
    useGetUserWallet();
  const {
    data: isPayableData,
    refetch: isPayableRefetch,
    isPending: isPayablePending,
  } = useIsPayable({
    token: auth.token,
    id: item._id,
  });
  const bottomSheetRef = useRef<BottomSheet>(null);
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
          queryKey: [
            REACT_QUERY_KEYS.profileQueries.getUserWallet,
            REACT_QUERY_KEYS.profileQueries.getUserProfile,
          ],
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
      auth.set('walletBalance', userWalletData?.wallet?.balance);
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
    if (!isPayableData) {
      isPayableRefetch();
    }
    if (isPayableData) {
      setIsPayable(isPayableData.payable);
    }
  }, [isPayableData]);
  if (status === 'pending') {
    return <Text>Loading...</Text>;
  }
  if (status === 'error') {
    refetch();
    return <Text>Error...</Text>;
  }
  const handlePayNow = async () => {
    if (userWalletData.wallet.balance < data.auctionItem.currentBid) {
      toast.error('Insufficient balance in wallet');
      openSheet();
    } else {
      try {
        await mutateAsync({
          token: auth.token,
          itemid: data.auctionItem._id,
          location: userProfile.user.location,
        });
        toast.success('Checkout successful');
        queryClient.invalidateQueries({
          queryKey: [
            REACT_QUERY_KEYS.profileQueries.getUserWallet,
            REACT_QUERY_KEYS.profileQueries.getUserProfile,
            REACT_QUERY_KEYS.paymentQueries.isPayable,
          ],
        });
        setIsPayable(false);
      } catch (error) {
        console.error('Error during checkout:', error);
      }
    }
  };
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
              key={index}
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
        <View style={[{ marginTop: 10, alignItems: 'center' }]}>
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
              {' ' + data.auctionItem.currentBid}
            </Text>
          </MaterialCommunityIcons>
        </View>

        <View style={[{ marginTop: 10, alignItems: 'center' }]}>
          <FontAwesome5Icon
            name="user-alt"
            color={variant === 'dark' ? 'white' : 'black'}
            size={22}
          >
            <Text style={[fonts.gray800, fonts.bold, { fontSize: 22 }]}>
              {'  '}
              {data.auctionItem.currentBidder.firstName +
                ' ' +
                data.auctionItem.currentBidder.lastName}
            </Text>
          </FontAwesome5Icon>
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
      {isPayable ? (
        <RNBounceable
          disabled={isPending}
          style={[
            {
              position: 'absolute',
              bottom: 10,
              width: '90%',
              alignSelf: 'center',
            },
          ]}
          onPress={handlePayNow}
        >
          <View
            style={[
              layout.itemsCenter,
              layout.justifyCenter,
              borders.rounded_16,

              {
                height: 50,

                backgroundColor: 'red',
              },
            ]}
          >
            {isPending ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={[fonts.gray50, fonts.bold, fonts.size_24]}>
                Pay Now
              </Text>
            )}
          </View>
        </RNBounceable>
      ) : (
        <RNBounceable
          style={[
            {
              position: 'absolute',
              bottom: 10,
              width: '90%',
              alignSelf: 'center',
            },
          ]}
          onPress={() => {
            navigation.navigate('Delivery', { id: data.auctionItem._id });
          }}
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
              Delivery
            </Text>
          </View>
        </RNBounceable>
      )}

      <BottomSheet
        index={-1}
        ref={bottomSheetRef}
        onChange={handleSheetChanges}
        backgroundStyle={{ backgroundColor: navigationTheme.colors.border }}
        handleIndicatorStyle={backgrounds.gray800}
        enablePanDownToClose={true}
        snapPoints={['50%']}
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
              {[1000, 5000, 10000, 50000].map((amount) => (
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
    </>
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
