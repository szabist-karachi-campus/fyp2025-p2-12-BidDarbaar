import { Alert } from 'react-native';
import Client from '../../client/index';

export async function createPaymentIntent(values: createPaymentIntentRequest) {
  const data = await Client.post('/create-payment-intent', values, {
    headers: {
      Authorization: `jwt ${values.token}`,
    },
  });
  return data.data;
}
export async function createCheckout(values: createCheckoutRequest) {
  const data = await Client.post(
    '/checkout',
    {
      itemid: values.itemid,
      location: values.location,
    },
    {
      headers: {
        Authorization: `jwt ${values.token}`,
      },
    },
  );
  return data.data;
}

export async function isPayable(values: isPayableRequest) {
  try {
    const data = await Client.get('/isPayable', {
      headers: {
        Authorization: `jwt ${values.token}`,
        id: values.id,
      },
    });
    return data.data;
  } catch (e: any) {
    return e.message;
  }
}
export async function getOrder(values: getOrderRequest) {
  try {
    const data = await Client.get('/get-order', {
      headers: {
        Authorization: `jwt ${values.token}`,
        id: values.id,
      },
    });
    return data.data;
  } catch (e: any) {
    return e.message;
  }
}
