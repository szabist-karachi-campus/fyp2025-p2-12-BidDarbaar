import { Alert } from 'react-native';
import Client from '../../client/index';

export async function createAd(values: createAdRequest) {
  if (!values.token) {
    throw new Error('Authorization token is missing!');
  }
  const response = await Client.post('/createAd', values, {
    headers: {
      Authorization: `Bearer ${values.token}`,
    },
  });
  return response.data;
}

export async function getAdPerformance(values: getAdPerformanceRequest) {
  if (!values.adId) {
    throw new Error('Ad ID is required!');
  }

  const data = await Client.get('/performance', {
    headers: {
      id: values.adId,
    },
  });
  return data.data;
}

export async function getActiveAds() {
  const response = await Client.get('/activeAds');
  return response.data;
}

export async function editAd(values: editAdRequest) {
  if (!values.itemId) {
    throw new Error('Ad ID is required!');
  }
  if (!values.token) {
    throw new Error('Authorization token is missing!');
  }

  const response = await Client.post(`/editAd`, values, {
    headers: {
      Authorization: `Bearer ${values.token}`,
    },
  });
  return response.data;
}

export async function trackView({ auctionItemId, token }: TrackViewRequest) {
  if (!auctionItemId) {
    throw new Error('Auction Item ID is required!');
  }
  if (!token) {
    throw new Error('Authorization token is missing!');
  }

  try {
    const response = await Client.post(
      '/trackView',
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
          id: auctionItemId,
        },
      },
    );
    return response.data;
  } catch (error) {
    console.error('Error tracking view:', error);
    throw error;
  }
}

export async function isItemAdActive(values: getItemAdActive) {
  if (!values.itemId) {
    throw new Error('Item ID is required!');
  }
  try {
    const response = await Client.get('/isItemAdActive', {
      headers: {
        id: values.itemId,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error checking ad status:', error);
    throw error;
  }
}

export async function getMinBid() {
  try {
    const response = await Client.get('/bidAmount', {});
    return response.data;
  } catch (error) {
    console.error('Error checking ad status:', error);
    throw error;
  }
}

export async function getAd(id: string) {
  if (!id) {
    throw new Error('Item ID is required!');
  }
  try {
    const response = await Client.get('/getAd', {
      headers: {
        id: id,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error checking ad status:', error);
    throw error;
  }
}

export async function getAuctionAds(token: string) {
  if (!token) {
    Alert.alert('Error', 'Authentication token is required!');
    return;
  }
  try {
    const response = await Client.get('/getAuctionHouseAds', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching auction ads:', error);
    throw error;
  }
}
