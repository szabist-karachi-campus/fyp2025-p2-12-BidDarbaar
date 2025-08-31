import { View, Text, Image, ScrollView } from 'react-native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { SafeScreen } from '@/components/templates';
import { TextField } from '@/components/molecules';
import { logo, logoDark } from '../../../images';
import type { RouteProp } from '@react-navigation/native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RootStackParamList } from '@/navigation/types';
import type { StackNavigationProp } from '@react-navigation/stack';
import ForwardButton from '@/components/molecules/ForwardButton';
type ChangePassScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  Paths.ChangePass
>;
type changePassScreenRouteParam = RouteProp<
  RootStackParamList,
  Paths.ChangePass
>;

import { toast } from '@backpackapp-io/react-native-toast';
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import { useChangePassword } from '@/queries/auth.queries';
import { Paths } from '@/navigation/paths';

export default function ChangePassword() {
  const { t } = useTranslation();

  const navigation = useNavigation<ChangePassScreenNavigationProp>();
  const route = useRoute<changePassScreenRouteParam>();

  const email = route.params?.email;
  const emailNormalized = email ? email.toLowerCase() : '';

  const { layout, gutters, fonts, variant } = useTheme();
  const { mutateAsync } = useChangePassword();

  const Fields: Field[] = [
    {
      iconName: 'lock',
      placeHolder: t('textFieldLabel.password'),
      keyboardType: 'default',
      secure: true,
      key: 'password',
    },
    {
      iconName: 'lock',
      placeHolder: t('textFieldLabel.confirmPass'),
      keyboardType: 'default',
      secure: true,
      key: 'confirmPass',
    },
  ];

  const validationLoginSchema = Yup.object({
    password: Yup.string()
      .trim()
      .min(8, t('inUse.passLength'))
      .required(t('inUse.password')),
    confirmPass: Yup.string()
      .trim()
      .required(t('inUse.confirmPass'))
      .oneOf([Yup.ref('password')], t('inUse.passMatch'))
      .required(t('inUse.confirmPass')),
  });
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      password: '',
      confirmPass: '',
    },
    resolver: yupResolver(validationLoginSchema),
    mode: 'onChange',
  });
  const [loading, setLoading] = useState(false);

  const onSubmit = handleSubmit(async (data: changePasswordRequest) => {
    setLoading(true);
    try {
      const response = await mutateAsync({
        password: data.password,
        // @ts-ignore
        confirmPassword: data.confirmPass,
        email: emailNormalized,
      });

      if (response) {
        toast.success(t('inUse.signupSuccess'));
        navigation.navigate(Paths.Login);
        setLoading(false);
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message;
      console.log('error yahan araha hay', errorMessage);
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
            {t('textFieldLabel.ChangePass')}
          </Text>
          <View style={[layout.flex_1, layout.fullWidth, layout.itemsCenter]}>
            {Fields.map((a, index) => {
              return (
                <View
                  key={a.key + index}
                  style={[
                    gutters.marginBottom_12,
                    { width: '100%' },
                    layout.itemsCenter,
                  ]}
                >
                  <Controller
                    control={control}
                    key={a.key}
                    name={a.key as any}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <View
                        key={a.key + index}
                        style={[gutters.marginBottom_12]}
                      >
                        <TextField
                          error={
                            errors[a.key as 'password' | 'confirmPass']?.message
                          }
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
                </View>
              );
            })}
            <ForwardButton loading={loading} onPress={onSubmit} />
          </View>
        </View>
      </ScrollView>
    </SafeScreen>
  );
}
