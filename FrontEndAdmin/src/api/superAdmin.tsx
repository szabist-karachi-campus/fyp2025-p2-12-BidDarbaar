import Client from '../../client/index';

export async function getAllAuctionHouses(token: string) {
  const uri = 'jwt ' + token;

  const response = await Client.get('/get-all-auctionHouses', {
    headers: { Authorization: uri },
  });

  return response.data;
}
export async function getAllUsers(token: string) {
  const uri = 'jwt ' + token;

  const response = await Client.get('/get-all-users', {
    headers: { Authorization: uri },
  });

  return response.data;
}

export async function deleteAuctionItem(values: deleteAuctionHouseRequest) {
  const data = await Client.post('/delete-auction-house', values, {
    headers: {
      Authorization: `jwt ${values.token}`,
    },
  });
  return data.data;
}
export async function getOneUser(values: getOneUserRequest) {
  const data = await Client.post('/get-one-user', values, {
    headers: {
      Authorization: `jwt ${values.token}`,
    },
  });
  return data.data;
}

export async function getCategory(values: getCategoryRequest) {
  const response = await Client.get('/get-category', {
    headers: {
      Authorization: `jwt ${values.token}`,
      id: values.id,
    },
  });

  return response.data;
}
export async function getItem(values: getItemRequest) {
  const response = await Client.get('/get-super-item', {
    headers: {
      Authorization: `jwt ${values.token}`,
      itemid: values.itemid,
    },
  });
  return response.data;
}

export async function createSuperAdmin(values: createSuperAdminRequest) {
  const data = await Client.post('/super-admin-signup', values, {
    headers: {
      Authorization: `jwt ${values.token}`,
    },
  });
  return data.data;
}

export async function getSuperAdmin(values: getSuperAdminRequest) {
  const response = await Client.get('/get-super-admin', {
    headers: {
      Authorization: `jwt ${values.token}`,
    },
  });

  return response.data;
}

export async function getWaitingList(token: string) {
  const response = await Client.get('/get-waiting-list', {
    headers: {
      Authorization: `jwt ${token}`,
    },
  });

  return response.data;
}

export async function handleAuctionHouseStatus(
  values: handleAuctionHouseStatusRequest,
) {
  const data = await Client.post('/handleAuctionHouseStatus', values, {
    headers: {
      Authorization: `jwt ${values.token}`,
    },
  });
  return data.data;
}
