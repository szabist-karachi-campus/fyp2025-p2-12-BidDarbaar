import { View, Text, Image, ScrollView } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { SafeScreen } from '@/components/template';
import { logo, logoDark } from '../../../../assets/images/index';
import RNBounceable from '@freakycoder/react-native-bounceable';
import {
  CommonActions,
  RouteProp,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import { RootStackParamList } from '@/types/navigation';
import { StackNavigationProp } from '@react-navigation/stack';
import ForwardButton from '@/components/molecules/ForwardButton';
import { OtpInput } from 'react-native-otp-entry';
import { toast } from '@backpackapp-io/react-native-toast';
import { useForgotPassword, useVerifyOTP } from '@/queries/auth.queries';

type OTPScreenNavigationProp = StackNavigationProp<RootStackParamList, 'OTP'>;
type OTPRouteProp = RouteProp<RootStackParamList, 'OTP'>;

export default function Otp() {
  const { t } = useTranslation(['Otp', 'common']);

  const navigation = useNavigation<OTPScreenNavigationProp>();
  const route = useRoute<OTPRouteProp>();
  const { email, type } = route.params;

  const { data, status, mutateAsync, error } = useVerifyOTP();
  const { mutateAsync: resetOTPMutateAsync, error: resetOTPError } =
    useForgotPassword();
  const resendOTP = async () => {
    if (seconds > 0) return;
    try {
      const response = await resetOTPMutateAsync({
        email,
        type,
      });
      setSeconds(30);
      toast.success(t('Otp:NewOTP'));
    } catch (err) {
      if (err instanceof Error) {
        console.log(err.message);
        toast.error('An ERROR OCCURRED: ' + err.message);
      } else {
        console.log('An unknown error occurred');
      }
    }
  };

  const onSubmit = async () => {
    if (otp.length < 4 || otp.length > 4) {
      toast.error('Please enter a valid OTP');
      return;
    }
    setLoading(true);
    try {
      if (type === 'reset') {
        const response = await mutateAsync({
          otp,
          email,
          type,
        });
        setLoading(false);
        toast.success(t('common:inUse.correctOTP'));
        navigation.navigate('ChangePass', { email: email });
      } else {
        const response = await mutateAsync({
          otp,
          email,
          type,
        });
        setLoading(false);
        if (type === 'signup') {
          toast.success(t('common:inUse.signupSuccess'));
          setLoading(false);

          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            }),
          );
        } else {
          toast.success(t('common:inUse.emailVerified'));
          setLoading(false);

          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'TabNavigator' }],
            }),
          );
        }
      }
    } catch (err: any) {
      console.log('ps5:', err.message);
      const errorMessage = err?.response?.data?.message;

      if (errorMessage === 'Invalid OTP') {
        toast.error(t('Otp:invalidOTP'));
        setLoading(false);
      }
    }
  };

  const { layout, gutters, fonts, variant } = useTheme();

  const [seconds, setSeconds] = useState(30);

  useEffect(() => {
    if (seconds > 0) {
      const interval = setInterval(() => {
        setSeconds((prevSeconds) => prevSeconds - 1);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [seconds]);

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  return (
    <SafeScreen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View
          style={[
            layout.itemsCenter,
            layout.flex_1,
            layout.justifyBetween,
            gutters.marginTop_80,
          ]}
        >
          <Image
            source={variant === 'dark' ? logoDark : logo}
            resizeMode="contain"
            style={[{ width: 250, height: 250 }, gutters.marginBottom_80]}
          />
          <Text
            style={[
              fonts.text,
              fonts.bold,
              fonts.size_24,
              { alignSelf: 'center' },
              gutters.marginBottom_24,
            ]}
          >
            {t('Otp:OTP')}
          </Text>
          <View style={[layout.flex_1, layout.fullWidth, layout.itemsCenter]}>
            <OtpInput
              theme={{
                containerStyle: {
                  width: '80%',
                  alignItems: 'center',
                  marginBottom: 20,
                },
                pinCodeTextStyle: {
                  color: variant === 'dark' ? 'white' : 'black',
                },
              }}
              numberOfDigits={4}
              focusColor={'green'}
              onTextChange={(text) => setOtp(text)}
              type="numeric"
              disabled={loading}
            />

            <View
              style={[
                layout.row,
                layout.fullWidth,
                layout.itemsCenter,
                layout.justifyCenter,
                gutters.marginBottom_12,
              ]}
            >
              <Text style={[fonts.gray800, fonts.size_16]}>
                {' '}
                {t('Otp:Resend.Code')}{' '}
              </Text>
              <RNBounceable disabled={loading} onPress={resendOTP}>
                <Text style={[fonts.red500, fonts.size_16]}>
                  {' '}
                  {seconds > 0 ? seconds : t('Otp:Resend.Resend')}{' '}
                </Text>
              </RNBounceable>
            </View>
            <ForwardButton onPress={onSubmit} loading={loading} />
          </View>
        </View>
      </ScrollView>
    </SafeScreen>
  );
}
