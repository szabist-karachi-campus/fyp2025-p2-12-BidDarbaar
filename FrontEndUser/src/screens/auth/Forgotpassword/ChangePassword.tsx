import { View, Text, Image, ScrollView } from 'react-native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { SafeScreen } from '@/components/template';
import { TextField } from '@/components/molecules';
import { logo, logoDark } from '../../../../assets/images/index';
import {
  CommonActions,
  RouteProp,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import { RootStackParamList } from '@/types/navigation';
import { StackNavigationProp } from '@react-navigation/stack';
import ForwardButton from '@/components/molecules/ForwardButton';
type ChangePassScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'ChangePass'
>;
type changePassScreenRouteParam = RouteProp<RootStackParamList, 'ChangePass'>;

import { toast } from '@backpackapp-io/react-native-toast';
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import { useChangePassword, useForgotPassword } from '@/queries/auth.queries';
import { useStores } from '@/stores';

export default function ChangePassword() {
  const { t } = useTranslation(['common']);

  const navigation = useNavigation<ChangePassScreenNavigationProp>();
  const route = useRoute<changePassScreenRouteParam>();
  const { auth } = useStores();

  const email = route.params?.email;

  const { layout, gutters, fonts, variant } = useTheme();
  const { mutateAsync, error } = useChangePassword();

  const Fields: Field[] = [
    {
      iconName: 'lock',
      placeHolder: t('common:textFieldLabel.password'),
      keyboardType: 'default',
      secure: true,
      key: 'password',
    },
    {
      iconName: 'lock',
      placeHolder: t('common:textFieldLabel.confirmPass'),
      keyboardType: 'default',
      secure: true,
      key: 'confirmPass',
    },
  ];

  const validationLoginSchema = Yup.object({
    password: Yup.string()
      .trim()
      .min(8, t('common:inUse.passLength'))
      .required(t('common:inUse.password')),
    confirmPass: Yup.string()
      .trim()
      .required(t('common:inUse.confirmPass'))
      .oneOf([Yup.ref('password')], t('common:inUse.passMatch'))
      .required(t('common:inUse.confirmPass')),
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
        email: email,
      });

      if (response) {
        toast.success(t('common:inUse.signupSuccess'));

        auth.set('token', '');
        auth.set('expiresAt', '');
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          }),
        );
        setLoading(false);
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message;
      console.log('error yahan araha hay', errorMessage);
      toast.error(errorMessage);
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
            style={[{ width: 250, height: 250 }, gutters.marginBottom_40]}
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
            {t('common:textFieldLabel.ChangePass')}
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
                    key={a.key}
                    control={control}
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
                </View>
              );
            })}
            <ForwardButton loading={false} onPress={onSubmit} />
          </View>
        </View>
      </ScrollView>
    </SafeScreen>
  );
}
