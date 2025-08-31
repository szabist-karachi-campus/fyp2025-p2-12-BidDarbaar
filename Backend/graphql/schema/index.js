const { gql } = require('apollo-server-express');

const typeDefs = gql`
  type Query {
    _empty: String
  }
  type Mutation {
    updateBid(auctionItemId: ID!, bidAmount: Float!): BidResponse!
  }

  type BidResponse {
    success: Boolean!
    message: String!
    currentBid: Float
    auctionItemId: ID
  }
`;

module.exports = typeDefs;
