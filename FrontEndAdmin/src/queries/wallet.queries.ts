import { useMutation, useQuery } from '@tanstack/react-query';
import { REACT_QUERY_KEYS } from '.';
import {
  connectStripeAccount,
  createPaymentIntent,
  getUserWallet,
  withdrawal,
} from '@/api/wallet';
import { useStores } from '@/stores';
import { queryClient } from '@/App';

export function useCreatePaymentIntent() {
  return useMutation({
    mutationKey: [REACT_QUERY_KEYS.walletQueries.createPaymentIntent],
    mutationFn: (values: createPaymentIntentRequest) =>
      createPaymentIntent(values),
    onSuccess(data) {},
  });
}
export function useConnectStripe() {
  return useMutation({
    mutationKey: [REACT_QUERY_KEYS.walletQueries.connectStripeAccount],
    mutationFn: (token: string) => connectStripeAccount(token),
    onSuccess(data) {
      queryClient.invalidateQueries({
        queryKey: [
          REACT_QUERY_KEYS.AuctionProfileQueries.getAuctionHouseProfile,
        ],
      });
    },
  });
}
export function useWithdrawal() {
  return useMutation({
    mutationKey: [REACT_QUERY_KEYS.walletQueries.withdrawal],
    mutationFn: ({ token, amount }: { token: string; amount: number }) =>
      withdrawal(token, amount),
    onSuccess(data) {
      queryClient.invalidateQueries({
        queryKey: [
          REACT_QUERY_KEYS.AuctionProfileQueries.getAuctionHouseProfile,
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [REACT_QUERY_KEYS.walletQueries.getWallet],
      });
    },
  });
}

export function useGetAuctionHouseWallet() {
  const { auth } = useStores();
  const token = auth.token;
  return useQuery({
    queryKey: [REACT_QUERY_KEYS.walletQueries.getWallet],
    queryFn: () => getUserWallet(token),
  });
}
