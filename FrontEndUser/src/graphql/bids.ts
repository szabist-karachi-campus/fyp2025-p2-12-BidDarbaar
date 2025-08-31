import { gql } from '@apollo/client';

export const UPDATE_BID_MUTATION = gql`
  mutation UpdateBid($auctionItemId: ID!, $bidAmount: Float!) {
    updateBid(auctionItemId: $auctionItemId, bidAmount: $bidAmount) {
      success
      message
      currentBid
      auctionItemId
    }
  }
`;
