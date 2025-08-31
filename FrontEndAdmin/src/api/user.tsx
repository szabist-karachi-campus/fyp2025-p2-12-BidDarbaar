import Client from '../../client/index';

export async function getUsers(values: getUsers) {
  try {
    const data = await Client.post(
      '/get-Auction-House-Users',
      {},
      {
        headers: {
          Authorization: `Bearer ${values.token}`,
          auctionHouseId: values.auctionHouseId,
        },
      },
    );
    return data.data;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
}
export async function deleteAuctionUser(values: deleteAuctionHouseUserRequest) {
  try {
    const data = await Client.delete('/delete-Auction-House-User', {
      headers: {
        Authorization: `Bearer ${values.token}`,
        auctionhouseid: values.auctionHouseId,
        email: values.email,
      },
    });
    return data.data;
  } catch (error) {
    console.error('Error deleting auction house user:', error);
    throw error;
  }
}

export async function getAnalytics(token:string) {
  try {
    const data = await Client.get('/get-AuctionHouse-Analytics', {
      headers: {
        Authorization: `Bearer ${token}`,
       
      },
    });
    return data.data;
  } catch (error) {
    console.error('Error deleting auction house user:', error);
    throw error;
  }
}