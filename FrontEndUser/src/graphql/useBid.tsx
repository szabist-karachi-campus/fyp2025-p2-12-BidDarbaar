import { useMutation } from '@apollo/client';
import { UPDATE_BID_MUTATION } from '../graphql/bids';

interface BidVariables {
  auctionItemId: string;
  bidAmount: number;
}

export const useUpdateBid = () => {
  const [mutate, { data, loading, error }] = useMutation<
    {
      updateBid: {
        success: boolean;
        message: string;
        currentBid: number;
        auctionItemId: string;
      };
    },
    BidVariables
  >(UPDATE_BID_MUTATION);

  const updateBid = async (variables: BidVariables) => {
    try {
      const result = await mutate({ variables });
      return result.data?.updateBid;
    } catch (e) {
      console.error('Bid error:', e);
      throw e;
    }
  };

  return { updateBid, loading, data, error };
};
