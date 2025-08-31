import Client from '../../client/index';

export async function createAuctionItems(
  values: auctionItemRequest,
): Promise<any> {
  if (!values.token) {
    throw new Error('Authorization token is missing!');
  }

  const response = await Client.post('/create-auction-item', values, {
    headers: {
      Authorization: `Bearer ${values.token}`,
    },
  });

  return response.data;
}
export async function editAuctionItems(values: editAuctionItemRequest) {
  const data = await Client.put(
    `/auction-item-update/${values.itemId}`,
    {
      title: values.title,
      description: values.description,
      startingBid: values.startingBid,
      BiddingStartTime: values.BiddingStartTime,
      BiddingEndTime: values.BiddingEndTime,
      BiddingDate: values.BiddingDate,
      categories: values.categories,
    },
    {
      headers: {
        Authorization: `Bearer ${values.token}`,
      },
    },
  );
  return data.data;
}
export async function deleteAuctionItems(values: deleteAuctionItemRequest) {
  const data = await Client.delete(`/auction-item-delete/${values.itemId}`, {
    headers: {
      Authorization: `Bearer ${values.token}`,
    },
  });
  return data.data;
}
export async function auctionItemPicture(values: AuctionItemPictureRequest) {
  const formData = new FormData();

  if (!Array.isArray(values.images)) {
    throw new Error('Images must be provided as an array.');
  }

  values.images.forEach((image: any, index: number) => {
    if (!image.uri || !image.type || !image.name) {
      throw new Error(
        `Image at index ${index} is missing required properties (uri, type, or name).`,
      );
    }

    formData.append('item', {
      uri: image.uri,
      type: image.type || 'image/jpeg',
      name: image.name || `image_${index}.jpg`,
    } as any);
  });

  const config = {
    headers: {
      'Content-Type': 'multipart/form-data',
      Authorization: `Bearer ${values.token}`,
      itemid: values.itemId,
    },
  };

  try {
    const response = await Client.post(
      `/upload-auction-item-picture`,
      formData,
      config,
    );
    return response.data;
  } catch (error) {
    const err = error as any;
    throw new Error(
      err.response?.data?.message || 'Image upload failed. Please try again.',
    );
  }
}

export async function fetchAuctionItems(token: string) {
  const data = await Client.get('/admin-get-all-auction-items', {
    headers: {
      Authorization: `jwt ${token}`,
    },
  });
  return data.data;
}

export async function fetchAuctionItem(
  values: useFetchAuctionItemRequestQuery,
) {
  try {
    const authorization = `jwt ${values.Authorization}`;

    const data = await Client.get('/get-auction-item-admin', {
      headers: {
        Authorization: authorization,
        itemid: values.itemid,
      },
    });
    return data.data;
  } catch (e: any) {
    return e.message;
  }
}
