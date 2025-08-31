import { View, Text, ScrollView } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useTheme } from '@/theme';
import { Avatar } from 'react-native-paper';
import { Controller, useForm } from 'react-hook-form';
import { TextField } from '@/components/molecules';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useGetOneUser } from '@/queries/superAdmin.queries';
import { useTranslation } from 'react-i18next';
import * as Yup from 'yup';
import { AvatarUser } from '@/../images/avatar.png';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/navigation/types';
import { Paths } from '@/navigation/paths';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useStores } from '@/stores';
import { yupResolver } from '@hookform/resolvers/yup';

type SuperUserViewScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  Paths.SuperUserView
>;
type SuperUserViewScreenRouteProp = RouteProp<
  RootStackParamList,
  Paths.SuperUserView
>;

export default function SuperUserView() {
  const { layout, gutters, fonts } = useTheme();
  const { t } = useTranslation();
  const { auth } = useStores();
  const navigation = useNavigation<SuperUserViewScreenNavigationProp>();
  const route = useRoute<SuperUserViewScreenRouteProp>();

  const params = route.params ?? {};

  const id = params.id;
  const { data, mutateAsync } = useGetOneUser();
  const [userProfile, setUserProfile] = useState<any | null>(null);
  console.log('userProfile', userProfile);
  useEffect(() => {
    if (id) {
      mutateAsync({
        id,
        token: auth.token,
      });
    }
  }, [id]);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  const [region, setRegion] = useState({
    latitude: userProfile?.user?.location?.yAxis || 37.78825,
    longitude: userProfile?.user?.location?.xAxis || -122.4324,
    latitudeDelta: 0.015,
    longitudeDelta: 0.0121,
  });
  const validationSignupSchema = Yup.object({
    email: Yup.string()
      .email(t('inUse.validEmail'))
      .required(t('inUse.emailReq')),
    phoneNumber: Yup.string()
      .trim()
      .required(t('inUse.phoneReq'))
      .min(10, t('inUse.phoneLength'))
      .matches(/^(\+92|03)\d{9}$/, t('inUse.phoneFormat')),

    firstName: Yup.string()
      .trim()
      .required(t('inUse.firstName'))
      .min(3, t('inUse.nameLength'))
      .max(64, t('inUse.nameLength')),
    lastName: Yup.string()
      .trim()
      .required(t('inUse.lastName'))
      .min(3, t('inUse.nameLength'))
      .max(64, t('inUse.nameLength')),
  });

  const {
    control,
    formState: { errors },
    reset,
  } = useForm<editUserProfileRequestQueryFields>({
    defaultValues: {
      email: 'loading...',
      phoneNumber: 'Loading...',
      wallet: 'Loading...',
      firstName: 'Loading...',
      lastName: 'Loading...',
    },
    // @ts-ignore
    resolver: yupResolver(validationSignupSchema),
    mode: 'onChange',
  });
  useEffect(() => {
    if (data) {
      setUserProfile(data);
    }
  }, [data]);
  useEffect(() => {
    if (userProfile) {
      if (userProfile?.user?.location) {
        setRegion({
          latitude: userProfile?.user?.location?.yAxis,
          longitude: userProfile?.user?.location?.xAxis,
          latitudeDelta: 0.015,
          longitudeDelta: 0.0121,
        });
      }
    }
  }, [userProfile]);
  useEffect(() => {
    if (userProfile) {
      reset({
        email: userProfile.user.email,
        phoneNumber: userProfile?.user?.phoneNumber,

        firstName: userProfile?.user?.firstName,
        lastName: userProfile?.user?.lastName,
      });
      if (
        userProfile?.user?.avatar &&
        userProfile?.user?.avatar !== '' &&
        userProfile?.user.avatar !== null &&
        userProfile?.user?.avatar !== undefined
      ) {
        setAvatarUri(
          userProfile.user.avatar.replace(/^http:\/\//i, 'https://'),
        );
      }
    }
  }, [userProfile]);
  const initialAvatarUri = userProfile?.user?.avatar
    ? userProfile.user.avatar.replace(/^http:\/\//i, 'https://')
    : null;

  useEffect(() => {
    if (initialAvatarUri) {
      setAvatarUri(initialAvatarUri);
    }
  }, [initialAvatarUri]);
  const Fields: Field[] = [
    {
      iconName: 'at',
      placeHolder: t('textFieldLabel.email'),
      keyboardType: 'email-address',
      key: 'email',
    },
    {
      iconName: 'phone',
      placeHolder: t('name.phoneNum'),
      keyboardType: 'phone-pad',
      key: 'phoneNumber',
    },
  ];
  if (!userProfile) {
    return (
      <View
        style={[
          layout.fullWidth,
          layout.itemsCenter,
          layout.justifyCenter,
          { marginTop: 10 },
        ]}
      >
        <Text>Loading...</Text>
      </View>
    );
  }
  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View
        style={[
          layout.fullWidth,
          layout.itemsCenter,
          layout.justifyCenter,
          { marginTop: 10 },
        ]}
      >
        <Avatar.Image
          size={225}
          source={avatarUri ? { uri: avatarUri } : AvatarUser}
        />

        <Text
          style={[{ fontSize: 40 }, fonts.gray800, gutters.marginVertical_12]}
        >
          {!userProfile
            ? 'Loading...'
            : userProfile.user.firstName!! + ' ' + userProfile.user.lastName!!}
        </Text>
      </View>
      <View style={[layout.flex_1, layout.itemsCenter, layout.justifyBetween]}>
        <View style={[{ marginBottom: 20 }]}>
          {Fields.map((a, index) => {
            return (
              <>
                <Controller
                  key={a.key}
                  control={control}
                  name={a.key as any}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View
                      key={a.key + index}
                      style={[
                        a.key !== 'email' && gutters.marginBottom_24,
                        layout.fullWidth,
                      ]}
                    >
                      <TextField
                        error={
                          errors[
                            a.key as keyof editUserProfileRequestQueryFields
                          ]?.message as any
                        }
                        handleChange={onChange}
                        onBlur={onBlur}
                        value={value}
                        key={a.key}
                        placeholder={a.placeHolder}
                        keyboardType={a.keyboardType}
                        secure={a.secure}
                        iconName={a.iconName}
                        mask={a.mask}
                        disable={true}
                        secureTextEntry={a.secureTextEntry ?? false}
                      />
                    </View>
                  )}
                />
              </>
            );
          })}
        </View>

        <View
          style={{
            width: '75%',
            marginBottom: 30,
            height: 200,
            borderRadius: 10,
          }}
        >
          <MapView
            provider={PROVIDER_GOOGLE}
            style={{ flex: 1, borderRadius: 10 }}
            region={region}
          >
            <Marker
              description="Your location"
              coordinate={{
                latitude: userProfile.user.location.yAxis,
                longitude: userProfile.user.location.xAxis,
              }}
            />
          </MapView>
        </View>
      </View>
    </ScrollView>
  );
}
