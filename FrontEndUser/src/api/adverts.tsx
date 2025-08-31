import Client from '../../client/index';

export async function getAds() {
  try {
    const data = await Client.get('/activeAds', {});
    return data.data;
  } catch (e: any) {
    return e.message;
  }
}

export async function trackClick(values: trackClickRequest) {
  try {
    const authorization = `jwt ${values.token}`;

    const data = await Client.post(
      '/track-click',
      {
        adId: values.adId,
      },
      {
        headers: {
          authorization: authorization,
          userAgent: values.userAgent,
        },
      },
    );
    return data.data;
  } catch (e: any) {
    return e.message;
  }
}
