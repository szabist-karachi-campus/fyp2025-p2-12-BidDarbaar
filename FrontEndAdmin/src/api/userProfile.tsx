import Client from '../../client/index';

export async function getAuctionHouseProfile(token: string) {
  const uri = 'jwt ' + token;

  const response = await Client.get('/get-auction-house-profile', {
    headers: { Authorization: uri },
  });

  return response.data;
}

export async function changeProfilePicture(
  values: changeAuctionHouseProfilePictureRequest,
) {
  const formData = new FormData();
  formData.append('profile', {
    uri: values.imageUri,
    name: 'profile.jpg',
    type: 'image/jpeg',
  });
  const data = await Client.post(
    '/upload-auction-house-profile-picture',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `jwt ${values.token}`,
      },
    },
  );

  return data.data;
}

export async function editAuctionHouseProfile(
  values: editAuctionHouseProfileRequest,
) {
  const data = await Client.post('/edit-auction-house-profile', values, {
    headers: {
      Authorization: `jwt ${values.token}`,
    },
  });
  return data.data;
}
