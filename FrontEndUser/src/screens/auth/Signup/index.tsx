import {
  View,
  Text,
  Image,
  ScrollView,
  PermissionsAndroid,
  Platform,
  StyleSheet,
} from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { SafeScreen } from '@/components/template';
import { TextField } from '@/components/molecules';
import RNBounceable from '@freakycoder/react-native-bounceable';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '@/types/navigation';
import { StackNavigationProp } from '@react-navigation/stack';
import { logo, logoDark } from '../../../../assets/images';
import ForwardButton from '@/components/molecules/ForwardButton';
import { useUserSignup } from '@/queries/auth.queries';
import { toast } from '@backpackapp-io/react-native-toast';
import { Controller, set, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import MapView, { PROVIDER_GOOGLE, Marker, Region } from 'react-native-maps';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import Geolocation from '@react-native-community/geolocation';
import Geocoder from 'react-native-geocoding';
import Modal from 'react-native-modal';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import 'react-native-get-random-values';

type SignupScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Signup'
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
  const { t } = useTranslation(['Signup', 'common']);

  const navigation = useNavigation<SignupScreenNavigationProp>();
  const { layout, gutters, fonts, borders, variant } = useTheme();

  const { data, status, mutateAsync, error } = useUserSignup();
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
      placeHolder: t('Signup:name.FirstName'),
      key: 'firstName',
    },
    {
      iconName: 'user-alt',
      placeHolder: t('Signup:name.LastName'),
      key: 'lastName',
    },
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
      iconName: 'my-location',
      placeHolder: 'location',
      key: 'location',
    },
    {
      iconName: 'lock',
      placeHolder: t('common:textFieldLabel.password'),
      keyboardType: 'default',
      secure: true,
      key: 'password',
    },
    {
      iconName: 'lock',
      placeHolder: t('Signup:confirmPass'),
      keyboardType: 'default',
      secure: true,
      key: 'confirmPassword',
    },
  ];

  const validationSignupSchema = Yup.object({
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
    email: Yup.string()
      .email(t('common:inUse.validEmail'))
      .required(t('common:inUse.emailReq')),
    location: Yup.object().shape({
      xAxis: Yup.string().trim().required(t('common:inUse.xAxis')),
      yAxis: Yup.string().trim().required(t('common:inUse.yAxis')),
    }),
    phoneNumber: Yup.string()
      .trim()
      .required(t('common:inUse.phoneReq'))
      .min(10, t('common:inUse.phoneLength'))
      .matches(/^(\+92|03)\d{9}$/, t('common:inUse.phoneFormat')),
    password: Yup.string()
      .trim()
      .min(8, t('common:inUse.passLength'))
      .required(t('common:inUse.password')),
    confirmPassword: Yup.string()
      .trim()
      .required(t('common:inUse.confirmPass'))
      .oneOf([Yup.ref('password')], t('common:inUse.passMatch'))
      .required(t('common:inUse.confirmPass')),
  });

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      password: '',
      confirmPassword: '',
      location: { xAxis: '', yAxis: '' },
    },
    resolver: yupResolver(validationSignupSchema),
    mode: 'onChange',
  });
  const [buttonLoading, setButtonLoading] = useState(false);

  const onSubmit = handleSubmit(async (data: signupRequest) => {
    setLoading(true);
    console.log('Form data:', data);
    try {
      const response = await mutateAsync({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber,
        confirmPassword: data.confirmPassword,
        location: {
          xAxis: data.location.xAxis,
          yAxis: data.location.yAxis,
        },
      });
      if (response) {
        setLoading(false);
        toast.success(t('common:inUse.verifyEmail'));
        navigation.navigate('OTP', {
          email: response.user.email,
          type: 'signup',
        });
      }
    } catch (err: any) {
      console.log(err);
      if (err.message === 'Phone number already in use') {
        toast.error(t('common:inUse.phone'));
      } else if (err.message === 'Email already in use') {
        toast.error(t('common:inUse.email'));
      } else {
        toast.error(t('common:inUse.error'));
      }
      setLoading(false);
    }
    setLoading(false);
  });

  const handleMapPress = async (e: any) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    console.log('Selected coordinates:', latitude, longitude);

    setSelectedLocation({ latitude, longitude });
    setRegion({
      latitude,
      longitude,
      latitudeDelta: 0.015,
      longitudeDelta: 0.0121,
    });
    setValue('location', {
      xAxis: String(longitude),
      yAxis: String(latitude),
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
        <Modal
          isVisible={isModalVisible}
          onBackdropPress={toggleModal}
          style={{ margin: 0 }}
        >
          <View style={{ flex: 1, backgroundColor: 'white' }}>
            <RNBounceable
              onPress={toggleModal}
              style={{
                position: 'absolute',
                top: Platform.OS === 'ios' ? 50 : 20,
                left: 16,
                zIndex: 300,
                padding: 8,
                borderRadius: 20,
                backgroundColor: 'rgba(255,255,255,0.8)',
              }}
            >
              <MaterialIcons name="arrow-back" size={24} color="#333" />
            </RNBounceable>

            <View
              style={[
                styles.autoCompleteContainer,
                {
                  zIndex: 300,
                  elevation: 300,
                  top: Platform.OS === 'ios' ? 100 : 70,
                },
              ]}
            >
              <GooglePlacesAutocomplete
                ref={googlePlacesRef}
                placeholder="Search for location"
                fetchDetails
                autoFillOnNotFound
                query={{
                  key: 'AIzaSyCzlSWOrg3L9rIPymZihR2I6n9zS6HgueE',
                  language: 'en',
                }}
                GooglePlacesDetailsQuery={{
                  fields: 'geometry,formatted_address',
                }}
                onPress={(data, details = null) => {
                  if (details) {
                    const { lat, lng } = details.geometry.location;
                    const address = details.formatted_address;
                    // @ts-ignore
                    googlePlacesRef.current?.setAddressText(address);
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
                    backgroundColor: '#fff',
                    borderRadius: 8,
                    borderBottomWidth: 1,
                    borderBottomColor: '#ddd',
                  },
                  textInput: {
                    height: 44,
                    fontSize: 16,
                  },
                  listView: {
                    backgroundColor: '#fff',
                    marginTop: 0,
                  },
                  row: { padding: 12, height: 44 },
                  separator: { height: 1, backgroundColor: '#eee' },
                }}
              />
            </View>

            <MapView
              provider={PROVIDER_GOOGLE}
              style={styles.map}
              region={region}
              onPress={handleMapPress}
            >
              {selectedLocation && <Marker coordinate={selectedLocation} />}
            </MapView>

            <RNBounceable
              onPress={() => {
                if (!selectedLocation) return toast.error('Pick a spot first');
                setValue('location', {
                  xAxis: String(selectedLocation.latitude),
                  yAxis: String(selectedLocation.longitude),
                });
                handleSelectLocation();
              }}
              style={[
                borders.rounded_16,
                {
                  backgroundColor: 'blue',
                  padding: 10,
                  position: 'absolute',
                  bottom: 50,
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
        <View
          style={[layout.itemsCenter, layout.flex_1, layout.justifyBetween]}
        >
          <Image
            source={variant === 'dark' ? logoDark : logo}
            resizeMode="contain"
            style={[{ width: 250, height: 250 }]}
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
            {t('Signup:signupTitle')}
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
                          borderColor:
                            variant === 'default' ? 'black' : 'white',
                        },
                      ]}
                    >
                      <MaterialIcons name={a.iconName} size={25} color="red" />
                      <Text style={[fonts.gray800, { fontSize: 20 }]}>
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
                              | 'firstName'
                              | 'lastName'
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

            <ForwardButton loading={loading} onPress={onSubmit} />

            <View
              style={[layout.row, gutters.marginTop_16, layout.itemsCenter]}
            >
              <Text style={[fonts.gray800, fonts.size_12]}>
                {t('Signup:oldUser.oldUser1')}
              </Text>
              <RNBounceable
                style={[gutters.marginLeft_12]}
                onPress={() => navigation.goBack()}
              >
                <Text style={[fonts.red500]}>{t('Signup:oldUser.logIn')}</Text>
              </RNBounceable>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeScreen>
  );
}
