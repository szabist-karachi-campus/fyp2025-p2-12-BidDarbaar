import React, { useEffect, useLayoutEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import type { RootStackParamList } from '@/navigation/types';
import {
  useChangeProfilePicture,
  useGetAuctionHouseProfile,
  useEditAuctionHouseProfile,
} from '@/queries/profile.queries';
import { Paths } from '@/navigation/paths';
import { useStores } from '@/stores';
import { REACT_QUERY_KEYS } from '@/queries';
import { queryClient } from '@/App';
import { useTranslation } from 'react-i18next';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { toast } from '@backpackapp-io/react-native-toast';
import { useTheme } from '@/theme';
import { useI18n } from '@/hooks';
import { Avatar } from 'react-native-paper';
import { AvatarUser } from '@/../images/avatar.png';
import * as Icons from '@/components/molecules/Icons';
import RNBounceable from '@freakycoder/react-native-bounceable';
import { Controller, useForm } from 'react-hook-form';
import { TextField, Button } from '@/components/molecules';
import i18next from 'i18next';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

interface Location {
  latitude: number;
  longitude: number;
}

const Profile = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [isUploading, setIsUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { auth, user } = useStores();
  const { t } = useTranslation();
  const { toggleLanguage } = useI18n();

  const { data: auctionHouse, isLoading } = useGetAuctionHouseProfile();

  const [passwordLoading, setPasswordLoading] = useState(false);
  const changePictureMutation = useChangeProfilePicture();
  const {
    data: editUserProfileData,
    mutateAsync: editUserProfileMutateAsync,
    status: editUserProfileStatus,
  } = useEditAuctionHouseProfile();
  const { changeTheme, variant, gutters, fonts, layout } = useTheme();
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [edit, setEdit] = useState(true);
  const [region, setRegion] = useState({
    latitude: auctionHouse?.user?.location?.latitude || 37.78825,
    longitude: auctionHouse?.user?.location?.longitude || -122.4324,
    latitudeDelta: 0.015,
    longitudeDelta: 0.0121,
  });
  const Fields: Field[] = [
    {
      iconName: 'user-alt',
      placeHolder: t('inUse.name'),
      key: 'name',
    },
    {
      iconName: 'user-alt',
      placeHolder: t('inUse.ntn'),
      key: 'ntn',
    },
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
  useEffect(() => {
    if (auctionHouse?.user?.location) {
      setRegion({
        latitude: auctionHouse?.user?.location?.xAxis,
        longitude: auctionHouse?.user?.location?.yAxis,
        latitudeDelta: 0.015,
        longitudeDelta: 0.0121,
      });
    }
  }, [auctionHouse]);
  useEffect(() => {
    setAvatarUri(auctionHouse?.user?.avatar);
  }, [auctionHouse]);
  const [isSwitchOn, setIsSwitchOn] = React.useState(
    i18next.language === 'fr' ? false : true,
  );
  const onChangeLanguage = (lang: 'fr' | 'en', val: boolean) => {
    setIsSwitchOn(val);
    toggleLanguage();
    toast.success('Language changed successfully');
  };

  const [theme, setTheme] = React.useState(variant === 'dark' ? true : false);
  const onChangeTheme = (val: boolean) => {
    toast.success('Theme changed successfully');
    changeTheme(variant === 'default' ? 'dark' : 'default');
  };
  const handleLogout = async () => {
    try {
      await auth.logout();
      Alert.alert('Logged Out', 'You have successfully logged out!');

      navigation.reset({
        index: 0,
        routes: [{ name: Paths.Login }],
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to log out. Please try again.');
      console.error('Logout Error:', error);
    }
  };

  const validationSchema = Yup.object().shape({
    name: Yup.string()
      .trim()
      .required(t('inUse.name'))
      .min(3, t('inUse.nameLength'))
      .max(64, t('inUse.nameLength')),
    phoneNumber: Yup.string()
      .trim()
      .required(t('inUse.phoneReq'))
      .matches(/^(\+92|03)\d{9}$/, t('inUse.phoneFormat')),
    ntn: Yup.string().trim().required(t('inUse.ntn')),
    wallet: Yup.string().trim(),

    email: Yup.string()
      .transform((value) => value.toLowerCase().trim()) 
      .email(t('inUse.validEmail'))
      .required(t('inUse.emailReq')),
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      phoneNumber: '',
      wallet: '',
      ntn: '',
    },
    resolver: yupResolver(validationSchema),
    mode: 'onChange',
  });

  const onSubmit = handleSubmit(async (data: any) => {
    try {
      // @ts-expect-error
      const response = await editUserProfileMutateAsync({
        name: data.name,
        phoneNumber: data.phoneNumber,
        ntn: data.ntn,

        token: auth.token,
      });
      if (response) {
        toast.success('Profile updated successfully');
        setEdit(true);
      }
      setEdit(true);
    } catch (err: any) {
      setEdit(true);
      const errorMessage = err?.response?.data?.message;
      toast.error(
        errorMessage
          ? errorMessage
          : 'There was an error updating your profile',
      );
    }
  });

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () =>
        edit ? null : (
          <RNBounceable
            style={[gutters.marginLeft_12]}
            onPress={() => setEdit(true)}
          >
            <Text style={[fonts.bold, fonts.gray800, fonts.size_16]}>
              CANCEL
            </Text>
          </RNBounceable>
        ),
      headerRight: () =>
        edit ? (
          <RNBounceable
            onPress={() => {
              setEdit(!edit);
            }}
            style={[gutters.marginRight_16]}
          >
            <Icons.FontAwesome5
              name="user-edit"
              size={20}
              color={variant === 'dark' ? 'white' : 'black'}
            />
          </RNBounceable>
        ) : (
          <RNBounceable onPress={onSubmit} style={[gutters.marginRight_16]}>
            <Text style={[fonts.bold, fonts.gray800, fonts.size_16]}>SAVE</Text>
          </RNBounceable>
        ),
    });
  }, [navigation, edit, variant, fonts]);

  const handleChangePicture = async () => {
    try {
      launchImageLibrary({ mediaType: 'photo' }, async (response) => {
        if (response.didCancel) {
          console.log('User cancelled image picker');
        } else if (response.errorCode) {
          console.log('ImagePicker Error: ', response.errorMessage);
        } else if (response.assets && response.assets.length > 0) {
          const imageUri = response.assets[0].uri;
          console.log('Image URI: ', imageUri);
          setIsUploading(true);

          if (imageUri) {
            await changePictureMutation.mutateAsync({
              imageUri,
              token: auth.token,
            });
            Alert.alert('Success', 'Profile picture updated successfully!');
            setIsUploading(false);
            queryClient.invalidateQueries({
              queryKey: [
                REACT_QUERY_KEYS.AuctionProfileQueries.getAuctionHouseProfile,
              ],
            });
          } else {
            Alert.alert('Error', 'Invalid image URI.');
          }
        }
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile picture.');
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  console.log('Avatar URI:', auctionHouse?.user?.avatar);
  useEffect(() => {
    reset({
      name: auctionHouse?.user?.name,
      email: auctionHouse?.user?.email,
      phoneNumber: auctionHouse?.user?.phoneNumber,
      ntn: auctionHouse?.user?.ntn,
    });
  }, [reset, auctionHouse]);

  const renderBottomOptions = () => {
    return (
      <>
        <View
          style={[
            layout.row,
            layout.justifyBetween,
            layout.itemsCenter,
            { marginLeft: 5 },
          ]}
        >
          <Text style={[fonts.gray800, fonts.size_16]}>Change language</Text>
          <Switch
            value={isSwitchOn}
            onValueChange={(val) =>
              onChangeLanguage(i18next.language === 'fr' ? 'en' : 'fr', val)
            }
          />
        </View>
        <View
          style={[
            layout.row,
            layout.justifyBetween,
            layout.itemsCenter,
            { marginLeft: 5, marginTop: 10 },
          ]}
        >
          <Text style={[fonts.gray800, fonts.size_16]}>Toogle mode</Text>
          <Switch value={theme} onValueChange={(val) => onChangeTheme(val)} />
        </View>
        <View style={{ alignSelf: 'center', marginTop: 12, width: 250 }}>
          <Button
            title="Change Password"
            onPress={() =>
              navigation.navigate(Paths.ChangePass, {
                email: auctionHouse?.user?.email,
              })
            }
          />
          <Button
            title="Log Out"
            fontStyle={{ color: 'red' }}
            onPress={handleLogout}
          />
        </View>
      </>
    );
  };

  return (
    <ScrollView style={{ padding: 10 }}>
      <View
        style={[layout.fullWidth, layout.itemsCenter, layout.justifyCenter]}
      >
        <Avatar.Image
          size={275}
          source={avatarUri ? { uri: avatarUri } : AvatarUser}
        />
        {isUploading && (
          <ActivityIndicator
            style={{ position: 'absolute', zIndex: 100, bottom: 120 }}
            size="large"
            color={variant === 'dark' ? 'white' : 'black'}
          />
        )}

        {edit && (
          <RNBounceable
            style={[
              {
                padding: 10,
                backgroundColor: '#3B82F7',
                borderRadius: 100,
                alignItems: 'center',
                justifyContent: 'center',
                position: 'absolute',
                bottom: 0,
                right: 120,
                zIndex: 100,
              },
            ]}
            onPress={handleChangePicture}
          >
            <Icons.FontAwesome5
              name="edit"
              size={23}
              color={variant === 'dark' ? 'white' : 'black'}
            />
          </RNBounceable>
        )}
      </View>
      <View
        style={[
          layout.fullWidth,
          layout.itemsCenter,
          layout.justifyCenter,
          gutters.marginTop_32,
        ]}
      >
        {Fields.map((a, index) => {
          if (user.userType === 'auctionHouseUser' && a.key === 'ntn') {
            return null;
          }
          return (
            <Controller
              key={a.key}
              control={control}
              name={a.key as any}
              render={({ field: { onChange, onBlur, value } }) => (
                <View key={a.key + index} style={[gutters.marginBottom_12]}>
                  <TextField
                    error={
                      errors[a.key as 'email' | 'name' | 'ntn' | 'phoneNumber']
                        ?.message
                    }
                    handleChange={onChange}
                    onBlur={onBlur}
                    value={value}
                    disable={a.key === 'email' || a.key === 'ntn' ? true : edit}
                    key={a.key}
                    placeholder={a.placeHolder}
                    keyboardType={a.keyboardType}
                    secure={a.secure}
                    iconName={a.iconName}
                    mask={a.mask}
                  />
                </View>
              )}
            />
          );
        })}
        <View
          style={{
            height: 200,
            marginVertical: 16,
            borderWidth: 1,
            width: '80%',
          }}
        >
          <MapView
            style={{ flex: 1, borderRadius: 10 }}
            region={region}
            provider={PROVIDER_GOOGLE}
          >
            <Marker
              coordinate={{
                latitude: region.latitude,
                longitude: region.longitude,
              }}
              title={auctionHouse?.user?.name}
            />
          </MapView>
        </View>
      </View>
      <View style={{ width: '90%', marginLeft: 20 }}>
        {renderBottomOptions()}
      </View>
    </ScrollView>
  );
};

export default Profile;
