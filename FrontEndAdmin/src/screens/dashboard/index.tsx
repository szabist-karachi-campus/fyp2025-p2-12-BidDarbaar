import {
  View,
  Text,
  TextInput,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAuctionHouseAds } from '@/queries/ad.queries';
import { Carousel } from '@/components/molecules';
import { useStores } from '@/stores';
import { FlashList } from '@shopify/flash-list';
import { useNavigation } from '@react-navigation/native';
import index from '@/components/molecules/itemCart';
import { Paths } from '@/navigation/paths';
import type { StackNavigationProp } from '@react-navigation/stack/lib/typescript/src/types';
import type { RootStackParamList } from '@/navigation/types';
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import RNBounceable from '@freakycoder/react-native-bounceable';
import { useTheme } from '@/theme';
import {
  useCreatePaymentIntent,
  useGetAuctionHouseWallet,
} from '@/queries/wallet.queries';
import FontAwesome5Icon from 'react-native-vector-icons/FontAwesome5';
import {
  initPaymentSheet,
  presentPaymentSheet,
} from '@stripe/stripe-react-native';
import { queryClient } from '@/App';
import { REACT_QUERY_KEYS } from '@/queries';
import LogoIcon from '@/../assets/chat.svg';
import { toast } from '@backpackapp-io/react-native-toast';
type DashboardNavigationProp = StackNavigationProp<
  RootStackParamList,
  Paths.Dashboard
>;

const schema = Yup.object().shape({
  amount: Yup.string()
    .required('Amount is required')
    .matches(/^[1-9][0-9]*$/, 'Enter a valid whole number greater than 0'),
});
export default function Dashboard() {
  const { auth, user } = useStores();
  const token = auth.token;

  const [isLiked, setIsLiked] = React.useState(false);
  const {
    fonts,
    borders,
    navigationTheme,
    gutters,
    backgrounds,
    layout,
    variant,
  } = useTheme();
  const navigation = useNavigation<DashboardNavigationProp>();
  const {
    data: userWalletData,
    isLoading: getUserWalletStatus,
    refetch: refetchWallet,
  } = useGetAuctionHouseWallet();
  const {
    data: adData,
    status: adStatus,
    refetch: adRefetch,
  } = useAuctionHouseAds(token);
  const {
    mutateAsync: paymentIntentMutateAsync,
    data: paymentIntentData,
    status: paymentIntentStatus,
  } = useCreatePaymentIntent();
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  useEffect(() => {
    if (userWalletData?.wallet?.balance != null) {
      setWalletBalance(userWalletData.wallet.balance);
    }
  }, [userWalletData?.wallet?.balance]);
  useEffect(() => {
    navigation.setOptions({
      headerLeft: () =>
        user.userType === 'auctionHouseUser' ? null : (
          <RNBounceable onPress={() => navigation.navigate(Paths.ChatList)}>
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
  useEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        user.userType === 'auctionHouseUser' ? null : (
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
            {walletBalance == null ? (
              <Text style={[fonts.gray800, fonts.bold, gutters.marginLeft_12]}>
                Loading...
              </Text>
            ) : (
              <Text
                adjustsFontSizeToFit
                numberOfLines={1}
                style={[
                  fonts.gray800,
                  fonts.bold,
                  gutters.marginLeft_12,
                  fonts.alignCenter,
                  { width: '50%' },
                ]}
              >
                {walletBalance}
              </Text>
            )}
          </RNBounceable>
        ),
    });
  }, [walletBalance, variant]);
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
  const adsData =
    adData?.ads?.slice(0, 3).map((ad: any) => ({
      ...ad.auctionItemId,
      budget: ad.budget,
      bidAmount: ad.bidAmount,
    })) || [];
  const bottomSheetRef = useRef<BottomSheet>(null);

  console.log('Query Response:', adsData);
  console.log('Processed Ads Data:', adsData);
  const handleSheetChanges = useCallback((index: number) => {
    console.log('handleSheetChanges', index);
  }, []);
  const openSheet = () => {
    bottomSheetRef.current?.snapToIndex(0); 
  };

  const closeSheet = () => {
    bottomSheetRef.current?.close();
  };
  if (adStatus === 'pending') {
    return <Text>Loading...</Text>;
  }

  if (adStatus === 'error' || !adData?.ads) {
    return <Text>Error loading ads</Text>;
  }
  console.log('Ads Data:', adsData);

  const onSubmit = async (data: { amount: string }) => {
    const amount = parseInt(data.amount, 10);

    if (isNaN(amount)) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (amount < 15000) {
      toast.error('Minimum top-up amount is PKR 15,000');
      return;
    }

    try {
      const response = await paymentIntentMutateAsync({
        token: auth.token,
        amount: amount,
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
            REACT_QUERY_KEYS.walletQueries.getWallet,
            REACT_QUERY_KEYS.AuctionProfileQueries.getAuctionHouseProfile,
          ],
        });
        await refetchWallet();
        closeSheet();
      }
    } catch (err) {
      console.error('Error during payment process:', err);
    }
  };

  return (
    <View style={{ flex: 1 ,paddingTop:20}}>
      <FlashList
        data={adsData}
        refreshing={false}
        ListEmptyComponent={() => (
          <View
            style={[
              layout.flex_1,
              layout.itemsCenter,
              layout.justifyCenter,
              { padding: 20 },
            ]}
          >
            <Text style={[fonts.size_24, fonts.gray800, fonts.bold]}>
              No Ads Available
            </Text>
            <Text style={[fonts.size_16, fonts.gray400, gutters.marginTop_16]}>
              Please check back later.
            </Text>
          </View>
        )}
        onRefresh={() => {
          adRefetch();
        }}
        renderItem={({ item, index }: { item: any; index: number }) => (
          <Carousel
            key={index}
            item={item}
            isAd={true}
            budget={item.budget}
            bidAmount={item.bidAmount}
            onPress={() => {
              navigation.navigate(Paths.ItemView, { item });
            }}
            isLiked={isLiked}
            setIsLiked={setIsLiked}
          />
        )}
        estimatedItemSize={300}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 60,
        }}
        keyExtractor={(item: any) => item?._id || index.toString()}
      />
      <BottomSheet
        index={-1}
        ref={bottomSheetRef}
        onChange={handleSheetChanges}
        backgroundStyle={{ backgroundColor: navigationTheme.colors.border }}
        handleIndicatorStyle={backgrounds.gray800}
        enablePanDownToClose={true} 
        snapPoints={['60%', '90%']} 
      >
        <BottomSheetView style={styles.bottomSheetContent}>
          <View style={{ flex: 1, paddingHorizontal: '5%' }}>
            <View
              style={[layout.row, layout.justifyBetween, layout.itemsCenter]}
            >
              <Text
                style={[
                  fonts.bold,
                  fonts.gray800,
                  gutters.marginBottom_16,
                  fonts.size_24,
                  {},
                ]}
              >
                Top Up Wallet
              </Text>
              {user.userType === 'auctionHouse' && (
                <RNBounceable
                  onPress={() => navigation.navigate(Paths.WithdrawScreen)}
                  style={{
                    backgroundColor: 'red',
                    padding: 10,
                    borderRadius: 100,
                  }}
                >
                  <Text style={[fonts.bold, { color: 'white' }]}>
                    Withdraw money
                  </Text>
                </RNBounceable>
              )}
            </View>

            <Text style={[gutters.marginTop_12, fonts.gray800, fonts.bold]}>
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
                fonts.gray800,
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
                    fonts.gray800,
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
