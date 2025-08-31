import { View, Text, Image, ScrollView } from 'react-native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { SafeScreen } from '@/components/template';
import { TextField } from '@/components/molecules';
import { logo, logoDark } from '../../../../assets/images/index';
import RNBounceable from '@freakycoder/react-native-bounceable';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '@/types/navigation';
import { StackNavigationProp } from '@react-navigation/stack';
import ForwardButton from '@/components/molecules/ForwardButton';
type ForgotPassScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'ForgotPass'
>;
import { toast } from '@backpackapp-io/react-native-toast';
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import { useForgotPassword } from '@/queries/auth.queries';

export default function ForgotPass() {
  const { t } = useTranslation(['ForgotPass', 'common']);

  const navigation = useNavigation<ForgotPassScreenNavigationProp>();
  const { data, status, mutateAsync, error } = useForgotPassword();

  const [loading, setLoading] = useState(false);

  const { layout, gutters, fonts, variant } = useTheme();

  const Fields: Field[] = [
    {
      iconName: 'at',
      placeHolder: t('common:textFieldLabel.email'),
      keyboardType: 'email-address',
      key: 'email',
    },
  ];
  const validationForgotPassSchema = Yup.object({
    email: Yup.string()
      .trim()
      .lowercase()
      .email(t('common:inUse.validEmail'))
      .required(t('common:inUse.emailReq')),
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: '',
    },
    resolver: yupResolver(validationForgotPassSchema),
    mode: 'onChange',
  });

  const onSubmit = handleSubmit(async (data: any) => {
    setLoading(true);
    console.log(data.email);
    try {
      const response = await mutateAsync({
        email: data.email,
        type: 'reset',
      });
      if (response) {
        navigation.navigate('OTP', {
          email: response.user.email,
          type: 'reset',
        });
        setLoading(false);
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message;
      console.log('error yahan araha hay', errorMessage);
      console.log('error yahan araha hay2222:', err);

      if (errorMessage === 'User not found, Invalid request!') {
        toast.error(t('common:inUse.noUser'));
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
              gutters.marginBottom_16,
            ]}
          >
            {t('ForgotPass:ForgotPassTitle')}
          </Text>
          <View style={[layout.flex_1, layout.fullWidth, layout.itemsCenter]}>
            {Fields.map((a, index) => {
              return (
                <Controller
                  key={a.key}
                  control={control}
                  name={a.key as any}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View key={a.key + index} style={[gutters.marginBottom_12]}>
                      <TextField
                        error={errors[a.key as 'email']?.message}
                        handleChange={onChange}
                        onBlur={onBlur}
                        value={value}
                        key={a.key}
                        placeholder={a.placeHolder}
                        keyboardType={a.keyboardType}
                        secure={a.secure}
                        iconName={a.iconName}
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
                {t('ForgotPass:RememberPass')}
              </Text>
            </RNBounceable>
          </View>
        </View>
      </ScrollView>
    </SafeScreen>
  );
}
