import { useMutation, useQuery } from '@tanstack/react-query';
import { REACT_QUERY_KEYS } from '.';
import {
  createCheckout,
  createPaymentIntent,
  getOrder,
  isPayable,
} from '@/api/payment';
import { queryClient } from '@/App';

export function useCreatePaymentIntent() {
  return useMutation({
    mutationKey: [REACT_QUERY_KEYS.paymentQueries.createPaymentIntent],
    mutationFn: (values: createPaymentIntentRequest) =>
      createPaymentIntent(values),
    onSuccess(data) {},
  });
}
export function useCreateCheckout() {
  return useMutation({
    mutationKey: [REACT_QUERY_KEYS.paymentQueries.checkout],
    mutationFn: (values: createCheckoutRequest) => createCheckout(values),
    onSuccess(data) {},
  });
}

export function useIsPayable(values: isPayableRequest) {
  return useQuery({
    queryKey: [REACT_QUERY_KEYS.paymentQueries.isPayable],
    queryFn: () => isPayable(values),
  });
}
export function useGetOrder(values: getOrderRequest) {
  return useQuery({
    queryKey: [REACT_QUERY_KEYS.paymentQueries.getOrder],
    queryFn: () => getOrder(values),
  });
}
