import { useStores } from '@/stores';
import Client from '../../client/index';
import { Alert } from 'react-native';

export async function getUserProfile(token: string) {
  console.log('token:', token);
  const uri = 'jwt ' + token;
  console.log('uri:', uri);
  const response = await Client.get('/get-user-profile', {
    headers: { Authorization: uri },
  });
  console.log('Fetched user profile data:', response.data);

  return response.data;
}

export async function changeProfilePicture(
  values: changeProfilePictureRequestQuery,
) {
  const formData = new FormData();
  formData.append('profile', {
    uri: values.imageUri,
    name: 'profile.jpg',
    type: 'image/jpeg',
  });
  const data = await Client.post('/upload-profile-picture', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      Authorization: `jwt ${values.token}`,
    },
  });

  return data.data;
}

export async function editUserProfile(values: editUserProfileRequestQuery) {
  const data = await Client.post('/edit-user-profile', values, {
    headers: {
      Authorization: `jwt ${values.token}`,
    },
  });
  return data.data;
}
export async function updateLocation(values: updateLocationRequest) {
  const data = await Client.post('/update-location', values, {
    headers: {
      Authorization: `jwt ${values.token}`,
    },
  });
  return data.data;
}

export async function getUserWallet(token: string) {
  const uri = 'jwt ' + token;
  console.log('uri:', uri);
  const response = await Client.get('/get-user-wallet', {
    headers: { Authorization: uri },
  });

  return response.data;
}
