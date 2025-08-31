import Client from '../../client/index';

export async function fetchAuctionItems(token: string) {
  try {
    const authorization = `jwt ${token}`;
    const data = await Client.get('/get-all-auction-items', {
      headers: {
        authorization: authorization,
      },
    });
    return data.data;
  } catch (e: any) {
    return e.message;
  }
}
export async function fetchAuctionItem(
  values: useFetchAuctionItemRequestQuery,
) {
  try {
    const authorization = `jwt ${values.token}`;

    const data = await Client.get('/get-auction-item', {
      headers: {
        authorization: authorization,
        itemid: values.itemId,
      },
    });
    return data.data;
  } catch (e: any) {
    return e.message;
  }
}
export async function fetchWonAuctionItems(token: string) {
  try {
    const authorization = `jwt ${token}`;

    const data = await Client.get('/get-won-auction-item', {
      headers: {
        authorization: authorization,
      },
    });
    return data.data;
  } catch (e: any) {
    return e.message;
  }
}
export async function fetchFavoriteAuctionItems(token: string) {
  try {
    const authorization = `jwt ${token}`;

    const data = await Client.get('/get-favorite-item', {
      headers: {
        authorization: authorization,
      },
    });
    return data.data;
  } catch (e: any) {
    return e.message;
  }
}

export async function toggleFavourite(values: toggleFavouriteRequest) {
  const data = await Client.post('/toggle-favorite-item', values, {
    headers: {
      Authorization: `jwt ${values.token}`,
    },
  });
  return data.data;
}

export async function fetchCategories() {
  try {
    const data = await Client.get('/get-categories');
    return data.data;
  } catch (e: any) {
    return e.message;
  }
}
