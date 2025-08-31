import {
  View,
  Text,
  ScrollView,
  Modal,
  Alert,
  Image,
  Linking,
  StyleSheet,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { RootStackParamList } from '@/types/navigation';
import { StackNavigationProp } from '@react-navigation/stack';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { SafeScreen } from '@/components/template';
import { useTheme } from '@/theme';
import { AvatarUser } from '../../../assets/images';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Avatar, HelperText } from 'react-native-paper';
import { Button, TextField } from '@/components/molecules';
import RNBounceable from '@freakycoder/react-native-bounceable';
import { Switch } from 'react-native-switch';
import i18next from 'i18next';
import { toast } from '@backpackapp-io/react-native-toast';
import Icon from 'react-native-vector-icons/Ionicons';
import { useStores } from '@/stores';
import {
  useChangeProfilePicture,
  useEditUserProfile,
  useGetUserProfile,
  useUpdateLocation,
} from '@/queries/profile.queries';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import { Controller, FieldErrors, set, useForm } from 'react-hook-form';
import { MotiView } from 'moti';
import { Skeleton } from 'moti/skeleton';
import FontAwesome5Icon from 'react-native-vector-icons/FontAwesome5';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import {
  Camera,
  CameraPermissionStatus,
  useCameraDevice,
} from 'react-native-vision-camera';
import { useForgotPassword } from '@/queries/auth.queries';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Geolocation from '@react-native-community/geolocation';

type UserProfileScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'UserProfile'
>;

export default function UserProfile() {
  const {
    layout,
    gutters,
    fonts,
    borders,
    backgrounds,
    variant,
    changeTheme,
    navigationTheme,
  } = useTheme();
  const { auth } = useStores();
  const { t } = useTranslation(['Login', 'common', 'Signup', 'Otp']);
  const navigation = useNavigation<UserProfileScreenNavigationProp>();
  const { data: userProfile, isLoading, error } = useGetUserProfile();
  const { data, mutateAsync, status } = useChangeProfilePicture();
  const {
    mutateAsync: updateLocationMutateAsync,
    status: updateLocationStatus,
  } = useUpdateLocation();
  const { mutateAsync: resetOTPMutateAsync, error: resetOTPError } =
    useForgotPassword();
  const {
    data: editUserProfileData,
    mutateAsync: editUserProfileMutateAsync,
    status: editUserProfileStatus,
  } = useEditUserProfile();
  const [modalVisible, setModalVisible] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [edit, setEdit] = useState(true);
  const [cameraPermissionStatus, setCameraPermissionStatus] =
    useState<CameraPermissionStatus>('not-determined');
  const [microphonePermissionStatus, setMicrophonePermissionStatus] =
    useState<CameraPermissionStatus>('not-determined');

  const requestMicrophonePermission = useCallback(async () => {
    console.log('Requesting microphone permission...');
    const permission = await Camera.requestMicrophonePermission();
    console.log(`Microphone permission status: ${permission}`);

    if (permission === 'denied') await Linking.openSettings();
    setMicrophonePermissionStatus(permission);
  }, []);

  const requestCameraPermission = useCallback(async () => {
    console.log('Requesting camera permission...');
    const permission = await Camera.requestCameraPermission();
    console.log(`Camera permission status: ${permission}`);

    if (permission === 'denied') await Linking.openSettings();
    setCameraPermissionStatus(permission);
  }, []);

  const requestPermissions = useCallback(async () => {
    await Promise.all([
      requestCameraPermission(),
      requestMicrophonePermission(),
    ]);
    setShowCamera(true);
  }, []);

  const [showCamera, setShowCamera] = useState(false);
  const [region, setRegion] = useState({
    latitude: userProfile?.user?.location?.yAxis || 37.78825,
    longitude: userProfile?.user?.location?.xAxis || -122.4324,
    latitudeDelta: 0.015,
    longitudeDelta: 0.0121,
  });

  const Fields: Field[] = [
    {
      iconName: 'at',
      placeHolder: t('common:textFieldLabel.email'),
      keyboardType: 'email-address',
      key: 'email',
    },
    {
      iconName: 'phone',
      placeHolder: t('Signup:name.phoneNum'),
      keyboardType: 'phone-pad',
      key: 'phoneNumber',
    },
    {
      iconName: 'lock',
      placeHolder: t('common:textFieldLabel.password'),
      keyboardType: 'default',
      key: 'password',
      secureTextEntry: true,
    },
    {
      iconName: 'wallet',
      placeHolder: t('common:textFieldLabel.wallet'),
      keyboardType: 'default',
      secure: true,
      key: 'wallet',
    },
  ];

  const validationSignupSchema = Yup.object({
    email: Yup.string()
      .email(t('common:inUse.validEmail'))
      .required(t('common:inUse.emailReq')),
    phoneNumber: Yup.string()
      .trim()
      .required(t('common:inUse.phoneReq'))
      .min(10, t('common:inUse.phoneLength'))
      .matches(/^(\+92|03)\d{9}$/, t('common:inUse.phoneFormat')),
    password: Yup.string().trim().min(8, t('common:inUse.passLength')),

    wallet: Yup.string().trim(),
    firstName: Yup.string()
      .trim()
      .required(t('common:inUse.firstName'))
      .min(3, t('common:inUse.nameLength'))
      .max(64, t('common:inUse.nameLength')),
    lastName: Yup.string()
      .trim()
      .required(t('common:inUse.lastName'))
      .min(3, t('common:inUse.nameLength'))
      .max(64, t('common:inUse.nameLength')),
  });

  const {
    control,
    handleSubmit,
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

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () =>
        edit ? null : (
          <RNBounceable
            style={[gutters.marginLeft_12]}
            onPress={() => (
              setEdit(true),
              reset({
                email: userProfile.user.email,
                phoneNumber: userProfile.user.phoneNumber,
                wallet:
                  userProfile.user.walletBalance > 0
                    ? userProfile.user.walletBalance.toString()
                    : '0',
                firstName: userProfile.user.firstName,
                lastName: userProfile.user.lastName,
              })
            )}
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
            <FontAwesome5Icon
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

  const onSubmit = handleSubmit(
    async (data: editUserProfileRequestQueryFields) => {
      try {
        const response = await editUserProfileMutateAsync({
          token: auth.token,
          email: data.email,
          phoneNumber: data.phoneNumber,
          firstName: data.firstName,
          lastName: data.lastName,
        });
        if (response) {
          toast.success('Profile updated successfully');
          setEdit(true);
          reset({
            email: response.user.email,
            phoneNumber: response.user.phoneNumber,
            wallet:
              response.user.walletBalance > 0
                ? response.user.walletBalance.toString()
                : '0',
            firstName: response.user.firstName,
            lastName: response.user.lastName,
          });
        }
        setEdit(true);
      } catch (err: any) {
        const errorMessage = err?.response?.data?.message;
        toast.error(
          errorMessage
            ? errorMessage
            : 'There was an error updating your profile',
        );
      }
    },
  );

  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission required',
          'We need access to your gallery to choose photos',
        );
      }
    })();
  }, []);
  const [isSwitchOn, setIsSwitchOn] = React.useState(
    i18next.language === 'fr' ? false : true,
  );
  const onChangeLanguage = (lang: 'fr' | 'en', val: boolean) => {
    setIsSwitchOn(val);
    void i18next.changeLanguage(lang);
    toast.success('Language changed successfully');
  };
  const [theme, setTheme] = React.useState(variant === 'dark' ? true : false);
  const onChangeTheme = (val: boolean) => {
    setTheme(val);
    toast.success(`Theme changed successfully`);
    changeTheme(variant === 'default' ? 'dark' : 'default');
  };
  useEffect(() => {
    if (userProfile?.user?.location) {
      setRegion({
        latitude: userProfile?.user?.location?.yAxis,
        longitude: userProfile?.user?.location?.xAxis,
        latitudeDelta: 0.015,
        longitudeDelta: 0.0121,
      });
    }
  }, [userProfile]);

  const onLogout = async () => {
    auth.set('token', '');
    auth.set('expiresAt', '');
    auth.set('loggedInDate', null);
    
    await AsyncStorage.removeItem('token');
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      }),
    );
  };
  const [passwordLoading, setPasswordLoading] = useState(false);
  const onChangePassword = async () => {
    if (userProfile.user.verified === false) {
      return toast('Please verify your email first');
    } else {
      setPasswordLoading(true);
      await resetOTPMutateAsync({
        email: userProfile.user.email,
        type: 'reset',
      });
      toast.success(t('Otp:NewOTP'));
      setPasswordLoading(false);

      navigation.navigate('OTP', {
        email: userProfile.user.email,
        type: 'reset',
      });
    }
  };
  const initialAvatarUri = userProfile?.user?.avatar
    ? userProfile.user.avatar.replace(/^http:\/\//i, 'https://')
    : null;

  useEffect(() => {
    if (!isLoading) {
      reset({
        email: userProfile.user.email,
        phoneNumber: userProfile.user.phoneNumber,
        wallet:
          userProfile.user.wallet.balance > 0
            ? userProfile.user.wallet.balance.toString()
            : '0',
        firstName: userProfile.user.firstName,
        lastName: userProfile.user.lastName,
      });
      if (
        userProfile.user.avatar &&
        userProfile.user.avatar !== '' &&
        userProfile.user.avatar !== null &&
        userProfile.user.avatar !== undefined
      ) {
        setAvatarUri(
          userProfile.user.avatar.replace(/^http:\/\//i, 'https://'),
        );
      }
    }
  }, [isLoading]);

  useEffect(() => {
    if (initialAvatarUri) {
      setAvatarUri(initialAvatarUri);
    }
  }, [initialAvatarUri]);
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
            activeText={'English'}
            inActiveText={'اردو'}
            circleSize={40}
            barHeight={30}
            circleBorderWidth={1}
            backgroundActive={variant === 'dark' ? '#303030' : '#E0E0E0'}
            backgroundInactive={variant === 'dark' ? '#303030' : '#E0E0E0'}
            circleActiveColor={'gray'}
            circleInActiveColor={'gray'}
            activeTextStyle={{
              color: variant === 'dark' ? 'white' : 'black',
            }}
            inactiveTextStyle={{
              color: variant === 'dark' ? 'white' : 'black',
            }}
            renderInsideCircle={() => (
              <Text style={{ color: 'white' }}>{isSwitchOn ? 'EN' : 'UR'}</Text>
            )}
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
          <Switch
            value={theme}
            onValueChange={(val) => onChangeTheme(val)}
            activeText={''}
            inActiveText={''}
            circleSize={40}
            barHeight={30}
            circleBorderWidth={1}
            backgroundActive={'#303030'}
            backgroundInactive={'#E0E0E0'}
            circleActiveColor={'#ffffff'}
            circleInActiveColor={'#ffffff'}
            activeTextStyle={{}}
            renderInsideCircle={() => (
              <View
                style={{
                  borderColor: variant === 'dark' ? 'black' : 'gray',
                  borderWidth: 1,
                  backgroundColor: !theme ? 'white' : 'gray',
                  flex: 1,
                  width: '100%',
                  borderRadius: 10000,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Icon
                  name={!theme ? 'sunny-sharp' : 'moon-sharp'}
                  size={20}
                  color={!theme ? 'orange' : 'white'}
                />
              </View>
            )}
          />
        </View>
        <View style={{ alignSelf: 'center', marginTop: 12, width: 250 }}>
          <Button
            title="Change Password"
            loading={passwordLoading}
            onPress={onChangePassword}
          />
          <Button
            title="Log Out"
            fontStyle={{ color: 'red' }}
            onPress={onLogout}
          />
        </View>
      </>
    );
  };
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled && result.assets) {
        const newImageUri = result.assets[0].uri;
        setAvatarUri(newImageUri);

        const compressedImage = await ImageManipulator.manipulateAsync(
          result.assets[0].uri,
          [{ resize: { width: 800 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG },
        );
        setIsUploading(true);
        const response = await mutateAsync({
          token: auth.token,
          imageUri: compressedImage.uri,
        });
        if (response?.user?.avatar) {
          const updatedAvatarUri = response.user.avatar.replace(
            /^http:\/\//i,
            'https://',
          );
          setAvatarUri(updatedAvatarUri);
          toast.success('Profile picture updated successfully');
        }
        setModalVisible(false);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'There was an error selecting the imag');
    } finally {
      setIsUploading(false);
    }
  };

  const [whichCamera, setWhichCamera] = useState<'back' | 'front'>('back');
  const device = useCameraDevice(whichCamera);
  const camera = useRef<Camera>(null);
  const [emailVerifyClick, setEmailVerifyClick] = useState(false);
  const onVerifyEmail = async () => {
    if (userProfile.user.verified === true) {
      return toast('Your email is already verified');
    }
    setEmailVerifyClick(true);
    await resetOTPMutateAsync({
      email: userProfile.user.email,
      type: 'verifyemail',
    });
    setEmailVerifyClick(false);
    toast.success(t('Otp:NewOTP'));
    navigation.navigate('OTP', {
      email: userProfile.user.email,
      type: 'verifyemail',
    });
  };
  const renderCamera = () => {
    if (!device) {
      return <Text>No camera device found</Text>;
    }
    return (
      <Camera
        device={device}
        isActive={false}
        ref={camera}
        photoQualityBalance="quality"
        outputOrientation="device"
        photo={true}
        style={StyleSheet.absoluteFill}
      />
    );
  };
  if (showCamera) {
    return renderCamera();
  }
  if (isLoading) {
    return (
      <SafeScreen>
        <MotiView
          transition={{
            type: 'timing',
          }}
          style={[
            {
              flex: 1,
            },
            {},
          ]}
          animate={{ backgroundColor: navigationTheme.colors.background }}
        >
          <View
            style={[
              layout.fullWidth,
              layout.itemsCenter,
              layout.justifyCenter,
              {
                height: 300,
              },
            ]}
          >
            <Skeleton
              colorMode={'light'}
              radius="round"
              height={225}
              width={225}
            />
            <View style={{ width: 300, marginVertical: 12 }}>
              <Skeleton colorMode={'light'} show width={'100%'} height={40} />
            </View>
          </View>
          <View style={[layout.itemsCenter, layout.justifyBetween]}>
            <View style={[gutters.marginBottom_24, layout.fullWidth]}>
              {Fields.map((a, index) => {
                return (
                  <View
                    style={[
                      {
                        height: 50,
                        width: '80%',
                        alignSelf: 'center',
                        marginBottom: 24,
                      },
                    ]}
                  >
                    <Skeleton colorMode={'light'} width={'100%'} height={50} />
                  </View>
                );
              })}
            </View>
          </View>
          <View style={{ width: '85%', alignSelf: 'center' }}>
            {renderBottomOptions()}
          </View>
        </MotiView>
      </SafeScreen>
    );
  }

  const handleGetCurrentLocation = async () => {
    if (Platform.OS === 'android') {
      PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      )
        .then((granted) => {
          if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            fetchCurrentLocation();
          } else {
            console.log('Location permission denied');
            toast.error(
              'Location permission denied. Please enable it in settings.',
            );
          }
        })
        .catch((err) => {
          console.warn(err);
        });
    } else {
      fetchCurrentLocation();
    }
  };

  const fetchCurrentLocation = async () => {
    Geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        setRegion({
          latitude,
          longitude,
          latitudeDelta: 0.015,
          longitudeDelta: 0.0121,
        });

        const values: updateLocationRequest = {
          token: auth.token,
          location: {
            xAxis: latitude.toString(),
            yAxis: longitude.toString(),
          },
        };

        await updateLocationMutateAsync(values);
      },
      (error) => {
        console.log(error.code, error.message);
        toast.error('Failed to fetch current location. Please try again.');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
    );
  };

  const onCurrentLocationSelected = async () => {
    Alert.alert(
      'Update Location',

      'Do you want to select current location?',
      [
        {
          text: 'Cancel',
          onPress: () => console.log('Cancel Pressed'),
          style: 'cancel',
        },
        {
          text: 'Yes',
          onPress: handleGetCurrentLocation,
        },
      ],
      { cancelable: false },
    );
  };

  return (
    <>
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
        }}
      >
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.5)',
          }}
        >
          <View
            style={[
              {
                margin: 20,
                width: '75%',
                height: 200,
                borderRadius: 20,
                paddingHorizontal: 10,
                paddingVertical: 10,
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: {
                  width: 0,
                  height: 2,
                },
                shadowOpacity: 0.25,
                shadowRadius: 4,
                elevation: 5,
                zIndex: 1000,
              },
              backgrounds.gray100,
            ]}
          >
            <View
              style={[
                { width: '100%', height: '100%' },
                layout.itemsCenter,
                layout.justifyCenter,
              ]}
            >
              {isUploading ? (
                <ActivityIndicator
                  size="large"
                  color={variant === 'dark' ? 'white' : 'black'}
                />
              ) : (
                <>
                  <View style={[{ width: '100%', alignItems: 'flex-end' }]}>
                    <FontAwesome5Icon
                      name="times-circle"
                      size={30}
                      color={variant === 'dark' ? 'white' : 'black'}
                      onPress={() => setModalVisible(false)}
                    />
                  </View>
                  <View style={{ width: 250, alignItems: 'center' }}>
                    <Button
                      containerStyle={{
                        backgroundColor: variant === 'dark' ? 'white' : 'black',
                      }}
                      iconColor={variant === 'dark' ? 'black' : 'white'}
                      fontStyle={{
                        color: variant === 'dark' ? 'black' : 'white',
                      }}
                      left={'camera'}
                      title="Open Camera"
                      onPress={requestPermissions}
                    />
                    <Button
                      containerStyle={{
                        backgroundColor: variant === 'dark' ? 'white' : 'black',
                      }}
                      iconColor={variant === 'dark' ? 'black' : 'white'}
                      fontStyle={{
                        color: variant === 'dark' ? 'black' : 'white',
                      }}
                      left={'images'}
                      title="Pick From Gallery"
                      onPress={pickImage}
                    />
                  </View>
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>
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
          {isUploading && (
            <ActivityIndicator
              style={{ position: 'absolute', zIndex: 100, bottom: 150 }}
              size="large"
              color="white"
            />
          )}
          {edit && (
            <RNBounceable
              style={[
                {
                  padding: 10,
                  backgroundColor: 'green',
                  borderRadius: 100,
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'absolute',
                  bottom: 80,
                  right: 120,
                  zIndex: 100,
                },
              ]}
            >
              <FontAwesome5Icon
                name="edit"
                size={23}
                color={'white'}
                onPress={() => setModalVisible(true)}
              />
            </RNBounceable>
          )}
          {!edit ? (
            <>
              <Controller
                key={'firstName'}
                control={control}
                name={'firstName' as any}
                render={({ field: { onChange, onBlur, value } }) => (
                  <View
                    key={'firstName'}
                    style={[
                      layout.fullWidth,
                      layout.itemsCenter,
                      gutters.marginTop_24,
                    ]}
                  >
                    <TextField
                      error={errors['firstName']?.message}
                      handleChange={onChange}
                      onBlur={onBlur}
                      value={value}
                      key={'firstName'}
                      placeholder={t('Signup:name.FirstName')}
                      keyboardType={'default'}
                      secure={false}
                      iconName={'user-alt'}
                      disable={edit}
                      secureTextEntry={false}
                    />
                  </View>
                )}
              />
              <Controller
                key={'lastName'}
                control={control}
                name={'lastName' as any}
                render={({ field: { onChange, onBlur, value } }) => (
                  <View
                    key={'lastName'}
                    style={[
                      gutters.marginBottom_24,
                      layout.fullWidth,
                      layout.itemsCenter,
                      gutters.marginTop_24,
                    ]}
                  >
                    <TextField
                      error={
                        (
                          errors as FieldErrors<editUserProfileRequestQueryFields>
                        )['lastName']?.message
                      }
                      handleChange={onChange}
                      onBlur={onBlur}
                      value={value}
                      key={'lastName'}
                      placeholder={t('Signup:name.LastName')}
                      keyboardType={'default'}
                      secure={false}
                      iconName={'user-alt'}
                      disable={edit}
                      secureTextEntry={false}
                    />
                  </View>
                )}
              />
            </>
          ) : (
            <Text
              style={[
                { fontSize: 40 },
                fonts.gray800,
                gutters.marginVertical_12,
              ]}
            >
              {isLoading
                ? 'Loading...'
                : userProfile.user.firstName!! +
                  ' ' +
                  userProfile.user.lastName!!}
            </Text>
          )}
        </View>
        <View
          style={[layout.flex_1, layout.itemsCenter, layout.justifyBetween]}
        >
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
                          disable={
                            a.key === 'wallet' || a.key === 'password'
                              ? true
                              : edit
                          }
                          secureTextEntry={a.secureTextEntry ?? false}
                        />
                      </View>
                    )}
                  />

                  {a.key === 'email' && userProfile.user.verified === false && (
                    <>
                      {emailVerifyClick ? (
                        <ActivityIndicator
                          color={variant === 'dark' ? 'white' : 'black'}
                          style={{ marginTop: 10 }}
                        />
                      ) : (
                        <HelperText
                          type={'error'}
                          onPress={onVerifyEmail}
                          style={fonts.size_16}
                        >
                          Your email is not verifed.Click here to verify
                        </HelperText>
                      )}
                    </>
                  )}
                  {a.key === 'email' && (
                    <View style={gutters.marginBottom_24} />
                  )}
                </>
              );
            })}
          </View>
          {edit ? (
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
          ) : (
            <View
              style={[gutters.marginBottom_12, { width: '80%', height: 50 }]}
            >
              <RNBounceable
                disabled={updateLocationStatus === 'pending'}
                onPress={onCurrentLocationSelected}
                style={[
                  borders.rounded_16,
                  ,
                  {
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexDirection: 'row',
                    borderWidth: 1,
                    borderColor: variant === 'default' ? 'black' : 'white',
                  },
                ]}
              >
                {updateLocationStatus === 'pending' ? (
                  <ActivityIndicator
                    size="small"
                    color={variant === 'dark' ? 'white' : 'black'}
                    style={{ marginRight: 10 }}
                    animating={true}
                  />
                ) : (
                  <>
                    <MaterialIcons name={'my-location'} size={25} color="red" />
                    <Text style={[fonts.gray800, { fontSize: 20 }]}>
                      {' '}
                      Select Current location
                    </Text>
                  </>
                )}
              </RNBounceable>
            </View>
          )}
          <View style={{ width: '85%' }}>{renderBottomOptions()}</View>
        </View>
      </ScrollView>
    </>
  );
}
