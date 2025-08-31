import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { MaterialIcons, TextField } from '@/components/molecules';
import RNBounceable from '@freakycoder/react-native-bounceable';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import ForwardButton from '@/components/molecules/ForwardButton';
import { toast } from '@backpackapp-io/react-native-toast';
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import { SafeScreen } from '@/components/templates';
import { RootStackParamList } from '@/navigation/types';
import { useAuctionHouseSignUp } from '@/queries/auth.queries';
import { Paths } from '@/navigation/paths';
import { logo, logoDark } from '../../../../images';
import Modal from 'react-native-modal';
import MapView, { PROVIDER_GOOGLE, Marker, Region } from 'react-native-maps';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import Geolocation from '@react-native-community/geolocation';
import Geocoder from 'react-native-geocoding';

type SignupScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  Paths.Signup
>;

interface Location {
  latitude: number;
  longitude: number;
}
Geocoder.init('AIzaSyCzlSWOrg3L9rIPymZihR2I6n9zS6HgueE');

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    height: '100%',
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  autoCompleteContainer: {
    position: 'absolute',
    top: 50,
    left: 10,
    right: 10,
    zIndex: 100,
    backgroundColor: 'white',
    borderRadius: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
});
export default function Signup() {
  const { t } = useTranslation();

  const navigation = useNavigation<SignupScreenNavigationProp>();
  const { layout, gutters, fonts, variant, borders } = useTheme();

  const { mutateAsync } = useAuctionHouseSignUp();
  const [loading, setLoading] = useState<boolean>(false);
  const [isModalVisible, setModalVisible] = useState<boolean>(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null,
  );

  const [region, setRegion] = useState<Region>({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.015,
    longitudeDelta: 0.0121,
  });
  const toggleModal = () => {
    setModalVisible(!isModalVisible);
  };
  const googlePlacesRef = useRef(null);

  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app needs access to your location.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          getCurrentLocation();
        } else {
          console.log('Location permission denied');
        }
      } catch (err) {
        console.warn(err);
      }
    } else {
      getCurrentLocation();
    }
  };

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const getCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setRegion({
          latitude,
          longitude,
          latitudeDelta: 0.015,
          longitudeDelta: 0.0121,
        });
      },
      (error) => {
        console.log(error.code, error.message);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
    );
  };

  const handleSelectLocation = () => {
    if (!selectedLocation) {
      toast.error('Please select a location on the map.');
      return;
    }
    toggleModal();
    console.log('Selected Location:', selectedLocation);
  };

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
    {
      iconName: 'my-location',
      placeHolder: 'location',
      key: 'location',
    },

    {
      iconName: 'lock',
      placeHolder: t('textFieldLabel.password'),
      keyboardType: 'default',
      secure: true,
      key: 'password',
    },
    {
      iconName: 'lock',
      placeHolder: t('confirmPass'),
      keyboardType: 'default',
      secure: true,
      key: 'confirmPassword',
    },
  ];

  const validationSignupSchema = Yup.object({
    name: Yup.string()
      .trim()
      .required(t('inUse.name'))
      .min(3, t('inUse.nameLength'))
      .max(64, t('inUse.nameLength')),
    ntn: Yup.string()
      .trim()
      .required(t('inUse.ntn'))
      .min(7, t('inUse.ntnLength'))
      .max(7, t('inUse.ntnLength')),
    email: Yup.string()
      .transform((value) => value.toLowerCase().trim())
      .email(t('inUse.validEmail'))
      .required(t('inUse.emailReq')),
    location: Yup.object().shape({
      xAxis: Yup.string().trim().required(t('inUse.xAxis')),
      yAxis: Yup.string().trim().required(t('inUse.yAxis')),
    }),
    phoneNumber: Yup.string()
      .trim()
      .required(t('inUse.phoneReq'))
      .min(10, t('inUse.phoneLength'))
      .matches(/^(\+92|03)\d{9}$/, t('inUse.phoneFormat')),
    password: Yup.string()
      .trim()
      .min(8, t('inUse.passLength'))
      .required(t('inUse.password')),
    confirmPassword: Yup.string()
      .trim()
      .required(t('inUse.confirmPass'))
      .oneOf([Yup.ref('password')], t('inUse.passMatch')),
  });

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      phoneNumber: '',
      password: '',
      confirmPassword: '',
      location: { xAxis: '', yAxis: '' },
      ntn: '',
    },
    resolver: yupResolver(validationSignupSchema),
    mode: 'onChange',
  });

  const onSubmit = handleSubmit(async (data) => {
    setLoading(true);
    try {
      const normalizedEmail = data.email.toLowerCase().trim();

      const response = await mutateAsync({
        email: normalizedEmail,
        password: data.password,
        name: data.name,
        ntn: data.ntn,
        location: {
          xAxis: data.location.xAxis.toString(),
          yAxis: data.location.yAxis.toString(),
        },
        phoneNumber: data.phoneNumber,
        confirmPassword: data.confirmPassword,
      });

      if (response) {
        setLoading(false);
        toast.success(t('inUse.verifyEmail'));
        navigation.navigate(Paths.Otp, {
          email: normalizedEmail,
          type: 'verifyEmail',
        });
      }
    } catch (err: any) {
      if (err.message === 'Phone number already in use') {
        toast.error(t('inUse.phone'));
      } else if (err.message === 'Email already in use') {
        toast.error(t('inUse.email'));
      } else {
        toast.error(t('inUse.error'));
      }
      setLoading(false);
    }
  });

  const handleMapPress = async (e: any) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;

    setSelectedLocation({ latitude, longitude });
    setRegion({
      latitude,
      longitude,
      latitudeDelta: 0.015,
      longitudeDelta: 0.0121,
    });

    try {
      const response = await Geocoder.from(latitude, longitude);
      const address = response.results[0]?.formatted_address;

      if (address && googlePlacesRef.current) {
        // @ts-ignore
        googlePlacesRef.current.setAddressText(address);
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
    }
  };
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
            {t('signupTitle')}
          </Text>
          <View style={[layout.flex_1, layout.fullWidth, layout.itemsCenter]}>
            {Fields.map((a, index) => {
              if (a.key === 'location') {
                return (
                  <View
                    key={index}
                    style={[
                      gutters.marginBottom_12,
                      { width: '80%', height: 50 },
                    ]}
                  >
                    <RNBounceable
                      onPress={() => {
                        toggleModal();
                      }}
                      style={[
                        borders.rounded_16,
                        ,
                        {
                          flex: 1,
                          justifyContent: 'center',
                          alignItems: 'center',
                          flexDirection: 'row',
                          borderWidth: 1,
                          borderColor: 'white',
                        },
                      ]}
                    >
                      <MaterialIcons name={a.iconName} size={25} color="red" />
                      <Text style={{ color: 'white', fontSize: 20 }}>
                        {' '}
                        Select location
                      </Text>
                    </RNBounceable>
                  </View>
                );
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
                          errors[
                            a.key as
                              | 'email'
                              | 'password'
                              | 'name'
                              | 'ntn'
                              | 'phoneNumber'
                              | 'confirmPassword'
                          ]?.message
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
                      />
                    </View>
                  )}
                />
              );
            })}
            <Modal isVisible={isModalVisible} onBackdropPress={toggleModal}>
              <View style={{ flex: 1 }}>
                <View style={styles.autoCompleteContainer}>
                  <GooglePlacesAutocomplete
                    ref={googlePlacesRef}
                    placeholder="Search for location"
                    fetchDetails={true}
                    query={{
                      key: 'AIzaSyCzlSWOrg3L9rIPymZihR2I6n9zS6HgueE',
                      language: 'en',
                    }}
                    onPress={(data, details = null) => {
                      if (details?.geometry?.location) {
                        const { lat, lng } = details.geometry.location;
                        setSelectedLocation({ latitude: lat, longitude: lng });
                        setRegion({
                          latitude: lat,
                          longitude: lng,
                          latitudeDelta: 0.015,
                          longitudeDelta: 0.0121,
                        });
                      }
                    }}
                    styles={{
                      textInputContainer: {
                        backgroundColor: 'white',
                        borderTopWidth: 0,
                        borderBottomWidth: 0,
                      },
                      textInput: {
                        height: 40,
                        color: '#5d5d5d',
                        fontSize: 16,
                      },
                      predefinedPlacesDescription: {
                        color: '#1faadb',
                      },
                    }}
                  />
                </View>

                <MapView
                  provider={PROVIDER_GOOGLE}
                  style={styles.map}
                  region={region}
                  // onRegionChange={setRegion}
                  onPress={handleMapPress}
                >
                  {selectedLocation && (
                    <Marker
                      coordinate={{
                        latitude: selectedLocation.latitude,
                        longitude: selectedLocation.longitude,
                      }}
                    />
                  )}
                </MapView>

                <RNBounceable
                  onPress={() => {
                    if (selectedLocation) {
                      setValue('location', {
                        xAxis: selectedLocation.latitude.toString(),
                        yAxis: selectedLocation.longitude.toString(),
                      });
                      handleSelectLocation();
                    } else {
                      toast.error('Please select a location.');
                    }
                  }}
                  style={[
                    borders.rounded_16,
                    {
                      backgroundColor: 'blue',
                      padding: 10,
                      bottom: 50,
                      position: 'absolute',
                      alignSelf: 'center',
                      width: 100,
                      alignItems: 'center',
                    },
                  ]}
                >
                  <Text style={{ color: 'white' }}>OK</Text>
                </RNBounceable>
              </View>
            </Modal>
            <ForwardButton loading={loading} onPress={onSubmit} />
            <View
              style={[layout.row, gutters.marginTop_16, layout.itemsCenter]}
            >
              <Text style={[fonts.gray800, fonts.size_12]}>
                {t('oldUser.oldUser1')}
              </Text>
              <RNBounceable
                style={[gutters.marginLeft_12]}
                onPress={() => navigation.goBack()}
              >
                <Text style={[fonts.red500]}>{t('oldUser.logIn')}</Text>
              </RNBounceable>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeScreen>
  );
}
