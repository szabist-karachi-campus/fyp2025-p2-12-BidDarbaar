const authQueries = {
  userLogin: 'userLogin',
  userSignUp: 'userSignUp',
  auctionUserSignUp: 'auctionHouseUserSignUp',
  verifyOTP: 'verifyOTP',
  forgotPassword: 'forgotPassword',
  changePassword: 'changePassword',
  isResetTokenValid: 'isResetTokenValid',
  auctionUserLogin: 'auctionHouseUserLogin',
  editAuctionHouseProfile: 'editAuctionHouseProfile',
  createAuctionItems: 'createAuctionItems',
  editAuctionItems: 'editAuctionItems',
  deleteAuctionItems: 'deleteAuctionItems',
  fetchAuctionItems: 'fetchAuctionItems',
};
const AuctionProfileQueries = {
  getAuctionHouseProfile: 'getAuctionHouseProfile',
  changeProfilePicture: 'changeProfilePicture',
};
const itemQueries = {
  createAuctionItems: 'createAuctionItems',
  editAuctionItems: 'editAuctionItems',
  deleteAuctionItems: 'deleteAuctionItems',
  auctionItemPicture: 'auctionItemPicture',
  fetchAuctionItems: 'fetchAuctionItems',
  fetchAuctionItem: 'fetchAuctionItem',
};
const categoryQueries = {
  getItemCategory: 'getItemCategory',
};

const adQueries = {
  createAd: 'createAd',
  getAdPerformance: 'getAdPerformance',
  getActiveAds: 'getActiveAds',
  editAd: 'editAd',
  useEditAd: 'useEditAd',
  isItemAdActive: 'isItemAdActive',
  trackView: 'trackView',
  getMinBid: 'getMinBid',
  getAd: 'getAd',
  getAuctionAds: 'getAuctionAds',
};

const userQueries = {
  getAllUsers: 'getAllUsers',
  deleteAuctionUser: 'deleteAuctionUser',
  getAnalytics: 'getAnalytics',
};
const walletQueries = {
  createPaymentIntent: 'createPaymentIntent',
  getWallet: 'getWallet',
  connectStripeAccount: 'connectStripeAccount',
  withdrawal: 'withdrawal',
};
const superAdminQueries = {
  getAllAuctionHouses: 'getAllAuctionHouses',
  getAllUsers: 'getAllSuperUsers',
  deleteAuctionHouse: 'deleteAuctionHouse',
  getOneUser: 'getOneUser',
  addCategory: 'addCategory',
  getCategory: 'getCategory',
  getItem: 'getItem',
  editCategory: 'editCategory',
  createSuperAdmin: 'createSuperAdmin',
  getSuperAdmin: 'getSuperAdmin',
  getWaitingList: 'getWaitingList',
  handleAuctionHouseStatus: 'handleAuctionHouseStatus',
};
const deliveryQueries = {
  assignAgent: 'assignAgent',
  registerAgent: 'registerAgent',
  orderStatus: 'orderStatus',
  getAvailableAgents: 'getAvailableAgents',
  getAllOrders: 'getAllOrders',
  getAuctionOrder: 'getAuctionOrder',
};

const messageQueries = {
  startThreadOrSendMessage: 'startThreadOrSendMessage',
  getUserAdminThreads: 'getUserAdminThreads',
  getChats: 'getChats',
  getChat: 'getChat',
};

export const REACT_QUERY_KEYS = {
  authQueries,
  AuctionProfileQueries,
  itemQueries,
  categoryQueries,
  adQueries,
  userQueries,
  walletQueries,
  superAdminQueries,
  deliveryQueries,
  messageQueries,
};
