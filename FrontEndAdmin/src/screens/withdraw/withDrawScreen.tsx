import React, { useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Linking,
  TextInput,
} from 'react-native';
import RNBounceable from '@freakycoder/react-native-bounceable';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@/theme';
import { useGetAuctionHouseProfile } from '@/queries/profile.queries';
import { ActivityIndicator } from 'react-native-paper';
import { toast } from '@backpackapp-io/react-native-toast';
import {
  useConnectStripe,
  useGetAuctionHouseWallet,
  useWithdrawal,
} from '@/queries/wallet.queries';
import { useStores } from '@/stores';
import { FontAwesome5 } from '@/components/molecules';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';

const schema = Yup.object().shape({
  amount: Yup.string()
    .required('Amount is required')
    .matches(/^[1-9][0-9]*$/, 'Enter a valid whole number greater than 0'),
});
const WithdrawScreen = () => {
  const {
    variant,
    fonts,
    backgrounds,
    layout,
    navigationTheme,
    gutters,
    borders,
  } = useTheme();
  const { data, isFetching } = useGetAuctionHouseProfile();
  const { data: userWalletData, isFetching: getUserWalletStatus } =
    useGetAuctionHouseWallet();
  const { auth } = useStores();
  const {
    mutateAsync,
    isPending,
    data: connectStripeData,
  } = useConnectStripe();
  const {
    mutateAsync: useWithdrawalMutateAsync,
    isPending: withdrawalIsPending,
  } = useWithdrawal();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const handleSheetChanges = useCallback((index: number) => {
    console.log('handleSheetChanges', index);
  }, []);
  const openSheet = () => {
    bottomSheetRef.current?.snapToIndex(0);
  };
  const closeSheet = () => {
    bottomSheetRef.current?.close();
  };

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
  if (isFetching) {
    return (
      <View style={[styles.container, layout.justifyCenter]}>
        <ActivityIndicator
          size="large"
          color={variant === 'dark' ? 'white' : '#1976D2'}
        />
      </View>
    );
  }
  const handleConnectStripe = async () => {
    try {
      const response = await mutateAsync(auth.token);
      toast.success('Stripe account connected successfully!');
      console.log('Stripe connect data:', connectStripeData);
      Linking.openURL(response.url);
    } catch (error) {
      console.error('Error connecting Stripe:', error);
      toast.error('Failed to connect Stripe account. Please try again.');
    }
  };
  const isStripeConnected = data?.user?.stripeConnectedId?.length > 1;
  const onsubmit = handleSubmit(async (data) => {
    console.log('Withdraw amount:', data.amount);
    const amountNumber = Number(data.amount);
    if (isNaN(amountNumber) || amountNumber <= 0) {
      toast.error('Please enter a valid amount.');
      return;
    }
    try {
      if (amountNumber > userWalletData.wallet.balance) {
        toast.error('Insufficient balance for withdrawal.');
        return;
      } else if (amountNumber < 1000) {
        toast.error('Minimum withdrawable amount is PKR 1000.');
        return;
      } else {
        await useWithdrawalMutateAsync({
          token: auth.token,
          amount: amountNumber,
        });
        toast.success('Withdrawal request submitted successfully.');
        closeSheet();
      }
    } catch (error) {
      console.error('Error during withdrawal:', error);
      toast.error('Failed to process withdrawal. Please try again.');
    }
  });
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons
          name="cash-outline"
          size={120}
          color={variant === 'dark' ? 'white' : '#1976D2'}
        />
      </View>

      <Text
        style={[
          styles.title,
          {
            color: variant === 'dark' ? 'white' : '#1976D2',
          },
        ]}
      >
        Withdraw Funds
      </Text>
      <Text style={[styles.balanceText, fonts.gray800]}>
        Balance:{' '}
        <Text
          style={[
            { fontWeight: 'bold', color: '#4CAF50' },
            userWalletData.wallet.balance < 1000 && { color: 'red' },
          ]}
        >
          PKR {userWalletData.wallet.balance}
        </Text>
      </Text>
      <View style={styles.instructionsContainer}>
        <Text style={[styles.instruction, fonts.gray800]}>
          • Make sure your Stripe account is connected before withdrawing.
        </Text>
        <Text style={[styles.instruction, fonts.gray800]}>
          • Withdrawals may take 1–3 business days to reflect in your account.
        </Text>
        <Text style={[styles.instruction, fonts.gray800]}>
          • Minimum withdrawable amount is PKR 1000.
        </Text>
      </View>

      <View style={[styles.termsContainer, backgrounds.gray200]}>
        <Text style={[styles.termsTitle, fonts.bold]}>Terms & Conditions</Text>
        <Text style={styles.termsText}>
          By initiating a withdrawal, you agree to our payout processing policy.
          Ensure your account details are correct. Any incorrect withdrawal
          caused by wrong Stripe details will not be refunded.
        </Text>
      </View>

      <RNBounceable
        onPress={handleConnectStripe}
        disabled={isPending || isStripeConnected}
        style={[styles.connectButton, layout.row, layout.justifyCenter]}
      >
        {isPending ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <>
            {isStripeConnected && (
              <FontAwesome5
                name="check"
                size={20}
                color="white"
                style={{ marginRight: 10 }}
              />
            )}
            <Text style={styles.connectText}>
              {isStripeConnected
                ? 'Stripe Account Connected'
                : 'Connect Stripe Account'}
            </Text>
          </>
        )}
      </RNBounceable>

      <RNBounceable
        disabled={withdrawalIsPending}
        onPress={() => {
          if (!isStripeConnected) {
            toast.error('Please connect your Stripe account first.');
          } else if (userWalletData.wallet.balance < 1000) {
            toast.error('Minimum withdrawable amount is PKR 1000.');
          } else {
            openSheet();
          }
        }}
        style={[
          styles.withdrawButton,
          !isStripeConnected && { backgroundColor: 'gray' },
        ]}
      >
        {withdrawalIsPending ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Text style={styles.withdrawText}>Withdraw</Text>
        )}
      </RNBounceable>
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
                Withdraw balance
              </Text>
            </View>

            <Text style={[gutters.marginTop_12, fonts.gray800, fonts.bold]}>
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
                withdrawalIsPending ||
                !isStripeConnected ||
                userWalletData.wallet.balance < 1000
              }
              onPress={onsubmit}
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
              {withdrawalIsPending ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={[fonts.bold, { color: 'white' }]}>
                  Confirm Withdrawal
                </Text>
              )}
            </RNBounceable>
          </View>
        </BottomSheetView>
      </BottomSheet>
    </ScrollView>
  );
};

export default WithdrawScreen;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    marginTop: 40,
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',

    marginBottom: 20,
  },
  instructionsContainer: {
    marginBottom: 25,
    width: '100%',
  },
  instruction: {
    fontSize: 16,
    marginBottom: 10,
    lineHeight: 22,
  },
  termsContainer: {
    padding: 16,
    borderRadius: 12,
    width: '100%',
    marginBottom: 30,
    elevation: 2,
  },
  termsTitle: {
    fontSize: 18,
    marginBottom: 8,
    color: '#222',
  },
  termsText: {
    fontSize: 14,
    lineHeight: 20,
  },
  connectButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 50,
    marginBottom: 15,
    width: '90%',
    alignItems: 'center',
  },
  connectText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  withdrawButton: {
    backgroundColor: '#1976D2',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 50,
    width: '90%',
    alignItems: 'center',
  },
  withdrawText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  balanceText: {
    fontSize: 18,
    marginBottom: 20,
  },
  bottomSheetContent: {
    flex: 1,
  },
  closeButton: {
    marginTop: 20,
  },
});
