const authQueries = {
  userLogin: 'userLogin',
  userSignup: 'userSignup',
  verifyOTP: 'verifyOTP',
  forgotPassword: 'forgotPassword',
  isResetTokenValid: 'isResetTokenValid',
  changePassword: 'changePassword',
  editUserProfile: 'editUserProfile',
};

const profileQueries = {
  getUserProfile: 'getUserProfile',
  changeProfilePicture: 'changeProfilePicture',
  updateLocation: 'updateLocation',
  getUserWallet: 'getUserWallet',
};

const listingQueries = {
  getAuctionItems: 'getAuctionItems',
  getAuctionItem: 'getAuctionItem',
  getWonAuctionItem: 'getWonAuctionItem',
  getFavoriteAuctionItems: 'getFavoriteAuctionItems',
  toggleFavourite: 'toggleFavourite',
  getCategories: 'getCategories',
};

const advertQueries = {
  trackClick: 'trackClick',
  getAds: 'getAds',
};
const paymentQueries = {
  createPaymentIntent: 'createPaymentIntent',
  checkout: 'checkout',
  isPayable: 'isPayable',
  getOrder: 'getOrder',
};

const messageQueries = {
  startThreadOrSendMessage: 'startThreadOrSendMessage',
  getUserAdminThreads: 'getUserAdminThreads',
  getChats: 'getChats',
  getChat: 'getChat',
};

export const REACT_QUERY_KEYS = {
  authQueries,
  profileQueries,
  listingQueries,
  advertQueries,
  paymentQueries,
  messageQueries,
};
