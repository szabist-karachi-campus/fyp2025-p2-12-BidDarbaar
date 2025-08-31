import Client from '../../client';
export async function createPaymentIntent(values: createPaymentIntentRequest) {
  const data = await Client.post(
    '/create-AuctionHouse-payment-intent',
    values,
    {
      headers: {
        Authorization: `jwt ${values.token}`,
      },
    },
  );
  return data.data;
}

export async function getUserWallet(token: string) {
  const uri = 'jwt ' + token;
  const response = await Client.get('/get-AuctionHouse-wallet', {
    headers: { Authorization: uri },
  });

  return response.data;
}

export async function connectStripeAccount(token: string) {
  const uri = 'jwt ' + token;

  const response = await Client.post(
    '/connect-stripe',
    {},
    {
      headers: { Authorization: uri },
    },
  );

  return response.data;
}

export async function withdrawal(token: string, amount: number) {
  const uri = 'jwt ' + token;

  const response = await Client.post(
    '/withdraw',
    { amount },
    {
      headers: { Authorization: uri },
    },
  );

  return response.data;
}
