import { View, Text, Image, ScrollView } from 'react-native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { SafeScreen } from '@/components/template';
import { TextField } from '@/components/molecules';
import { logo, logoDark } from '../../../../assets/images/index';
import RNBounceable from '@freakycoder/react-native-bounceable';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '@/types/navigation';
import { StackNavigationProp } from '@react-navigation/stack';
import ForwardButton from '@/components/molecules/ForwardButton';
import { useUserLogin } from '@/queries/auth.queries';
import { Controller, set, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import { toast } from '@backpackapp-io/react-native-toast';
import { useStores } from '@/stores';
import AsyncStorage from '@react-native-async-storage/async-storage';

type LoginScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Login'
>;

export default function Login() {
  const { t } = useTranslation(['Login', 'common']);
  const { mutate, mutateAsync, status, data, error } = useUserLogin();
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { layout, gutters, fonts, variant } = useTheme();
  const [loading, setLoading] = useState<boolean>(false);
  const { auth } = useStores();
  const Fields: Field[] = [
    {
      iconName: 'at',
      placeHolder: t('common:textFieldLabel.email'),
      keyboardType: 'email-address',
      key: 'email',
    },
    {
      iconName: 'lock',
      placeHolder: t('common:textFieldLabel.password'),
      keyboardType: 'default',
      secure: true,
      key: 'password',
    },
  ];
  const validationLoginSchema = Yup.object({
    email: Yup.string()
      .trim()
      .email(t('common:inUse.validEmail'))
      .required(t('common:inUse.emailReq')),

    password: Yup.string()
      .trim()
      .min(8, t('common:inUse.shortPass'))
      .required(t('common:inUse.password')),
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
    resolver: yupResolver(validationLoginSchema),
    mode: 'onChange',
  });

  const onSubmit = handleSubmit(async (data: loginRequest) => {
    setLoading(true);
    try {
      const response = await mutateAsync({
        email: data.email,
        password: data.password,
        deviceToken: auth.deviceToken ? auth.deviceToken : '',
      });
      if (response) {
        toast.success(t('common:inUse.signinSuccess'));
        auth.set('token', response.token);

        auth.set('expiresAt', response.expiresAt);
        auth.set("loggedInDate", new Date());
        await AsyncStorage.setItem('token', response.token);

        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'TabNavigator' }],
          }),
        );
        setLoading(false);
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message;

      if (errorMessage === 'User not found!') {
        toast.error(t('common:inUse.noUser'));
      } else if (errorMessage === 'Invalid password') {
        toast.error(t('common:inUse.validPass'));
      } else {
        toast.error(t('common:inUse.signinFailed'));
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
            {t('LoginTitle')}
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
                        error={errors[a.key as 'email' | 'password']?.message}
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
              onPress={() => {
                navigation.navigate('ForgotPass');
              }}
              style={[gutters.marginTop_12]}
            >
              <Text style={[fonts.gray800, gutters.marginTop_12]}>
                {t('Login:forgotPass')}
              </Text>
            </RNBounceable>
            <View
              style={[layout.row, gutters.marginTop_12, layout.itemsCenter]}
            >
              <Text style={[fonts.gray800, fonts.size_12]}>
                {t('Login:newUser.newUser1')}
              </Text>
              <RNBounceable
                style={[gutters.marginLeft_12]}
                onPress={() => {
                  navigation.navigate('Signup');
                }}
              >
                <Text style={[fonts.red500]}>{t('Login:newUser.signUp')}</Text>
              </RNBounceable>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeScreen>
  );
}
