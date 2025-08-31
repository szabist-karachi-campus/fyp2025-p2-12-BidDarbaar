import { View, Text, Image, ScrollView } from 'react-native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { SafeScreen } from '@/components/templates';
import { TextField } from '@/components/molecules';
import { logo, logoDark } from '../../../images';
import RNBounceable from '@freakycoder/react-native-bounceable';
import { useNavigation } from '@react-navigation/native';
import type { RootStackParamList } from '@/navigation/types';
import type { StackNavigationProp } from '@react-navigation/stack';
import ForwardButton from '@/components/molecules/ForwardButton';
type ForgotPassScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  Paths.forgotPassword
>;
import { toast } from '@backpackapp-io/react-native-toast';
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import { useForgotPassword } from '@/queries/auth.queries';
import { Paths } from '@/navigation/paths';

export default function ForgotPassword() {
  const { t } = useTranslation();

  const navigation = useNavigation<ForgotPassScreenNavigationProp>();
  const { mutateAsync } = useForgotPassword();

  const [loading, setLoading] = useState(false);

  const { layout, gutters, fonts, variant } = useTheme();

  const Fields: Field[] = [
    {
      iconName: 'at',
      placeHolder: t('textFieldLabel.email'),
      keyboardType: 'email-address',
      key: 'email',
    },
  ];
  const validationForgotPassSchema = Yup.object({
    email: Yup.string()
      .trim()
      .lowercase()
      .email(t('inUse.validEmail'))
      .required(t('inUse.emailReq')),
    type: Yup.string().required('Type is required'),
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: '',
      type: 'reset',
    },
    resolver: yupResolver(validationForgotPassSchema),
    mode: 'onChange',
  });

  const onSubmit = handleSubmit(async (auctionHouse: forgotPasswordRequest) => {
    setLoading(true);
    try {
      const response = await mutateAsync({
        email: auctionHouse.email,
        type: 'reset',
      });
      if (response) {
        navigation.navigate(Paths.Otp, {
          email: auctionHouse.email,
          type: 'reset',
        });
        setLoading(false);
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message;
      console.log('error yahan araha hay', errorMessage);

      if (errorMessage === 'User not found, Invalid request!') {
        toast.error(t('inUse.noUser'));
      }
      setLoading(false);
    }
  });

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
              gutters.marginBottom_16,
            ]}
          >
            {t('ForgotPassTitle')}
          </Text>
          <View style={[layout.flex_1, layout.fullWidth, layout.itemsCenter]}>
            {Fields.map((a, index) => {
              return (
                <Controller
                  control={control}
                  key={a.key}
                  name={a.key as any}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View key={a.key + index} style={[gutters.marginBottom_12]}>
                      <TextField
                        error={errors[a.key as 'email']?.message}
                        handleChange={onChange}
                        iconName={a.iconName}
                        key={a.key}
                        keyboardType={a.keyboardType}
                        onBlur={onBlur}
                        placeholder={a.placeHolder}
                        secure={a.secure}
                        value={value}
                      />
                    </View>
                  )}
                />
              );
            })}
            <ForwardButton loading={loading} onPress={onSubmit} />
            <RNBounceable
              onPress={() => navigation.goBack()}
              style={[gutters.marginTop_16]}
            >
              <Text style={[fonts.gray800, gutters.marginTop_16, fonts.red500]}>
                {t('RememberPass')}
              </Text>
            </RNBounceable>
          </View>
        </View>
      </ScrollView>
    </SafeScreen>
  );
}
