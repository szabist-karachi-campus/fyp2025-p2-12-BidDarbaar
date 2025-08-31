import { View, Text, Image } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { SafeScreen } from '@/components/templates';
import { logo, logoDark } from '../../../images';
import RNBounceable from '@freakycoder/react-native-bounceable';
import type { RouteProp } from '@react-navigation/native';
import {
  CommonActions,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import type { RootStackParamList } from '@/navigation/types';
import type { StackNavigationProp } from '@react-navigation/stack';
import ForwardButton from '@/components/molecules/ForwardButton';
import { OtpInput } from 'react-native-otp-entry';
import { toast } from '@backpackapp-io/react-native-toast';
import { useForgotPassword, useVerifyOTP } from '@/queries/auth.queries';
import { Paths } from '@/navigation/paths';
import { ScrollView } from 'react-native-gesture-handler';

type OTPScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  Paths.Otp
>;
type OTPScreenRouteProp = RouteProp<RootStackParamList, Paths.Otp>;

export default function Otp() {
  const { t } = useTranslation();

  const navigation = useNavigation<OTPScreenNavigationProp>();
  const route = useRoute<OTPScreenRouteProp>();

  const params = route.params ?? {};

  const email = 'email' in params ? params.email : undefined;
  const type = 'type' in params ? params.type : undefined;
  const fromProfile = 'fromProfile' in params ? params.fromProfile : undefined;
  const { mutateAsync } = useVerifyOTP();
  const { mutateAsync: resetOTPMutateAsync, error: resetOTPError } =
    useForgotPassword();

  const resendOTP = async () => {
    if (seconds > 0) return;
    try {
      const response = await resetOTPMutateAsync({
        //@ts-ignore
        email: email,
        //@ts-ignore
        type: type,
      });
    } catch (err: any) {
      console.log(err.message);
    }
    setSeconds(30);
    toast.success(t('NewOTP'));
  };
  const onSubmit = async () => {
    if (otp.length < 4) {
      toast.error('Please enter a valid OTP');
      return;
    }
    setLoading(true);

    try {
      const response = await mutateAsync({
        otp: otp,
        //@ts-ignore
        email,
        //@ts-ignore
        type: type,
      });
      setLoading(false);
      toast.success(t('inUse.correctOTP'));
      if (type === 'reset') {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [
              {
                name: Paths.ChangePass,
                params: { email: email },
              },
            ],
          }),
        );
      } else {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: Paths.Login }],
          }),
        );
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message;

      if (errorMessage === 'Invalid OTP') {
        toast.error(t('invalidOTP'));
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
            resizeMode="contain"
            source={variant === 'dark' ? logoDark : logo}
            style={[{ width: 250, height: 250 }]}
          />
          <Text
            style={[
              fonts.gray800,
              fonts.bold,
              fonts.size_24,
              { alignSelf: 'center' },
              gutters.marginBottom_24,
            ]}
          >
            {t('OTP')}
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
                {t('Resend.Code')}{' '}
              </Text>
              <RNBounceable disabled={loading} onPress={resendOTP}>
                <Text style={[fonts.red500, fonts.size_16]}>
                  {' '}
                  {seconds > 0 ? seconds : t('Resend.Resend')}{' '}
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
