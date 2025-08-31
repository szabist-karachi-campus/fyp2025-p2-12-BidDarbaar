import Client from '../../client/index';

export async function assignAgent(values: AssignAgentRequest) {
  const data = await Client.post('/assign-agent', values, {
    headers: {
      Authorization: `jwt ${values.token}`,
    },
  });
  return data.data;
}

export async function registerAgent(values: registerAgentRequest) {
  const data = await Client.post('/create-agent', values, {
    headers: {
      Authorization: `jwt ${values.token}`,
    },
  });
  return data.data;
}

export async function getAvailableAgents(token: string) {
  const uri = 'jwt ' + token;
  const response = await Client.get('/available-agents', {
    headers: { Authorization: uri },
  });

  return response.data;
}

export async function updateOrderStatus(values: updateOrderStatusRequest) {
  const data = await Client.post('/order-status', values, {
    headers: {
      Authorization: `jwt ${values.token}`,
    },
  });
  return data.data;
}

export async function getAllOrders(values: getAllOrdersRequest) {
  const response = await Client.get('/get-all-orders', {
    headers: {
      Authorization: `jwt ${values.token}`,
    },
  });

  return response.data;
}
export async function getAuctionOrder(values: getAuctionOrderRequest) {
  try {
    const response = await Client.get('/get-Auction-Order', {
      headers: {
        Authorization: `jwt ${values.token}`,
        id: values.id,
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching auction order:', error);
    throw error;
  }
}
