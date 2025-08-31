import { View, Text, Image, Alert } from 'react-native';
import React, { useState } from 'react';
import { useTheme } from '@/theme';
import { TextField } from '@/components/molecules';
import RNBounceable from '@freakycoder/react-native-bounceable';
import { useNavigation } from '@react-navigation/native';
import ForwardButton from '@/components/molecules/ForwardButton';
import { useAuctionHouseLogin } from '@/queries/auth.queries';
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import { toast } from '@backpackapp-io/react-native-toast';
import type { StackNavigationProp } from '@react-navigation/stack/lib/typescript/src/types';
import type { RootStackParamList } from '@/navigation/types';
import { Paths } from '@/navigation/paths';
import { SafeScreen } from '@/components/templates';
import { logo, logoDark } from '../../../../images';
import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native-gesture-handler';
import { useStores } from '@/stores';

type LoginScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  Paths.Login
>;

export default function Login() {
  const { t } = useTranslation();
  const { auth, user, superAdmin } = useStores();
  const { mutateAsync } = useAuctionHouseLogin();
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { layout, gutters, fonts, variant } = useTheme();
  const [loading, setLoading] = useState<boolean>(false);
  const Fields: Field[] = [
    {
      iconName: 'at',
      placeHolder: t('textFieldLabel.email'),
      keyboardType: 'email-address',
      key: 'email',
    },
    {
      iconName: 'lock',
      placeHolder: t('textFieldLabel.password'),
      keyboardType: 'default',
      secure: true,
      key: 'password',
    },
  ];
  const validationLoginSchema = Yup.object({
    email: Yup.string()
      .trim()
      .email(t('inUse.validEmail'))
      .required(t('inUse.emailReq')),

    password: Yup.string()
      .trim()
      .min(8, t('inUse.shortPass'))
      .required(t('inUse.password')),
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
    data.email = data.email.trim();
    data.email = data.email.toLowerCase();
    setLoading(true);
    try {
      const response = await mutateAsync({
        email: data.email,
        password: data.password,
        deviceToken: auth.deviceToken ? auth.deviceToken : '',
      });

      if (response) {
        toast.success(t('inUse.signinSuccess'));
        console.log('response', response);
        auth.set('token', response.token);
        auth.set('expiresAt', response.expiresAt);
        const now = new Date();
        auth.set('loggedInAt', now);
        if (response.superAdmin) {
          auth.set('superAdmin', true);
          superAdmin.setMany({
            firstName: response.superAdmin.firstName,
            lastName: response.superAdmin.lastName,
            email: response.superAdmin.email,
            superAdmin: true,
          });
        } else if (!response.auctionHouse) {
          user.set('userType', 'auctionHouseUser');
          user.set('jobTitle', response.auctionHouseUser.jobTitle);
          const userStore: AuctionHouseStoreType = {
            name: response.auctionHouseUser.name,
            email: response.auctionHouseUser.email,
            phoneNumber: response.auctionHouseUser.phoneNumber,
            id: response.auctionHouseUser._id,
            auctionHouseId: response.auctionHouseUser.auctionHouseId,
          };
          user.set('user', userStore);
        } else {
          const userStore: AuctionHouseStoreType = {
            name: response.auctionHouse.name,
            email: response.auctionHouse.email,
            phoneNumber: response.auctionHouse.phoneNumber,
            id: response.auctionHouse._id,
          };
          user.set('user', userStore);
          user.set('userType', 'auctionHouse');
        }
        navigation.reset({
          index: 0,
          routes: response.superAdmin
            ? [{ name: Paths.SuperBottomTab }]
            : [{ name: Paths.BottomTab }],
        });
        setLoading(false);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error_: any) {
      const errorMessage = error_?.response?.data?.message;

      if (errorMessage === 'User not found!') {
        toast.error(t('inUse.noUser'));
      } else if (errorMessage === 'Invalid password') {
        toast.error(t('inUse.validPass'));
      } else {
        toast.error(t('inUse.signinFailed'));
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
            {t('LoginTitle')}
          </Text>
          <View style={[layout.flex_1, layout.fullWidth, layout.itemsCenter]}>
            {Fields.map((a, index) => {
              return (
                <Controller
                  control={control}
                  key={a.key}
                  name={a.key as never}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View key={a.key + index} style={[gutters.marginBottom_12]}>
                      <TextField
                        error={errors[a.key as 'email' | 'password']?.message}
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
              onPress={() => {
                navigation.navigate(Paths.forgotPassword);
              }}
              style={[gutters.marginTop_12]}
            >
              <Text style={[fonts.gray800, gutters.marginTop_12]}>
                {t('forgotPass')}
              </Text>
            </RNBounceable>
            <View
              style={[layout.row, gutters.marginTop_12, layout.itemsCenter]}
            >
              <Text style={[fonts.gray800, fonts.size_12]}>
                {t('newUser.newUser1')}
              </Text>
              <RNBounceable
                onPress={() => {
                  navigation.navigate(Paths.Signup);
                }}
                style={[gutters.marginLeft_12]}
              >
                <Text style={[fonts.red500]}>{t('newUser.signUp')}</Text>
              </RNBounceable>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeScreen>
  );
}
