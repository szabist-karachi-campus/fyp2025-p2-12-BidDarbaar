// import React, { useEffect, useState } from 'react';
// import { StyleSheet, View, PermissionsAndroid, Platform } from 'react-native';
// import MapView, { PROVIDER_GOOGLE, Marker, Region } from 'react-native-maps';
// import Geolocation from '@react-native-community/geolocation';

// interface Location {
//   latitude: number;
//   longitude: number;
// }

// const styles = StyleSheet.create({
//   container: {
//     ...StyleSheet.absoluteFillObject,
//     height: '100%',
//     width: '100%',
//     justifyContent: 'flex-end',
//     alignItems: 'center',
//   },
//   map: {
//     ...StyleSheet.absoluteFillObject,
//   },
// });

// const MapWithCurrentLocation: React.FC = () => {
//   const [currentLocation, setCurrentLocation] = useState<Location | null>(null);

//   const requestLocationPermission = async () => {
//     if (Platform.OS === 'android') {
//       try {
//         const granted = await PermissionsAndroid.request(
//           PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
//           {
//             title: 'Location Permission',
//             message: 'This app needs access to your location.',
//             buttonNeutral: 'Ask Me Later',
//             buttonNegative: 'Cancel',
//             buttonPositive: 'OK',
//           }
//         );
//         if (granted === PermissionsAndroid.RESULTS.GRANTED) {
//           getCurrentLocation();
//         } else {
//           console.log('Location permission denied');
//         }
//       } catch (err) {
//         console.warn(err);
//       }
//     } else {
//       getCurrentLocation();
//     }
//   };

//   const getCurrentLocation = () => {
//     Geolocation.getCurrentPosition(
//       (position: { coords: { latitude: any; longitude: any; }; }) => {
//         const { latitude, longitude } = position.coords;
//         setCurrentLocation({ latitude, longitude });
//         console.log('Current Location:', currentLocation);
//       },
//       (error: { code: any; message: any; }) => {
//         console.log(error.code, error.message);
//       },
//       { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
//     );
//   };

//   useEffect(() => {
//     requestLocationPermission();
//   }, []);

//   const defaultRegion: Region = {
//     latitude: 37.78825,
//     longitude: -122.4324,
//     latitudeDelta: 0.015,
//     longitudeDelta: 0.0121,
//   };

//   return (
//     <View style={styles.container}>
//       <MapView
//         provider={PROVIDER_GOOGLE}
//         style={styles.map}
//         region={
//           currentLocation
//             ? {
//                 latitude: currentLocation.latitude,
//                 longitude: currentLocation.longitude,
//                 latitudeDelta: 0.015,
//                 longitudeDelta: 0.0121,
//               }
//             : defaultRegion
//         }
//         showsUserLocation={true}
//         followsUserLocation={true}
//       >
//         {currentLocation && (
//           <Marker
//             coordinate={{
//               latitude: currentLocation.latitude,
//               longitude: currentLocation.longitude,
//             }}
//             title="Your Location"
//           />
//         )}
//       </MapView>
//     </View>
//   );
// };

// export default MapWithCurrentLocation;
