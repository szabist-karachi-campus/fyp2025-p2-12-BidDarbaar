const { updateBid } = require('../controller/bid.controller');

const resolvers = {
  Query: {
    _empty: () => 'This is a placeholder query',
  },
  Mutation: {
    updateBid: async (_, { auctionItemId, bidAmount }, context) => {
      try {
        const req = {
          headers: context.req.headers,
          body: { auctionItemId, bidAmount: bidAmount.toString() },
        };

        const res = {
          json: (data) => data,
          status: () => ({ json: (data) => data }),
        };

        return await updateBid(req, res);
      } catch (error) {
        throw new ApolloError(
          error.message,
          error.extensions?.code || 'INTERNAL_SERVER_ERROR',
          error.extensions,
        );
      }
    },
  },
};

module.exports = resolvers;
