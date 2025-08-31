type KeyboardType =
  | 'default'
  | 'number-pad'
  | 'decimal-pad'
  | 'numeric'
  | 'email-address'
  | 'phone-pad'
  | 'url';

type Field = {
  iconName: string;
  placeHolder: string;
  secure?: boolean;
  keyboardType?: KeyboardType;
  key: string;
  mask?: string;
  secureTextEntry?: boolean;
};

type loginRequest = {
  email: string;
  password: string;
  deviceToken?: string;
};

type signupRequest = {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  location: {
    xAxis: string;
    yAxis: string;
  };
};

type otpRequest = {
  email: string;
  otp: string;
  type: string;
};

type user = {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
  verified: boolean;
  walletBalance: number;
  bids: [];
  wonItems: [];
};

type forgotPasswordRequest = {
  email: string;
  type: string;
};

type isResetTokenValidRequest = {
  email: string;
  token: string;
};

type changePasswordRequest = {
  password: string;
  confirmPass: string;
};

type changePasswordRequestQuery = {
  password: string;
  email: string;
};

type changeProfilePictureRequestQuery = {
  imageUri: string;
  token: string;
};

type editUserProfileRequestQuery = {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  token: string;
};
type editUserProfileRequestQueryFields = {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  wallet?: string;
};

type useEditUserProfileRequestQuery = {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  token: string;
};

type useFetchAuctionItemRequestQuery = {
  token: string;
  itemId: string;
};

type updateBidRequest = {
  auctionItemId: string;
  bidAmount: number;
};

type trackClickRequest = {
  token: string;
  userAgent: string;
  adId: string;
};
type updateLocationRequest = {
  token: string;
  location: {
    xAxis: string;
    yAxis: string;
  };
};

type toggleFavouriteRequest = {
  token: string;
  itemId: string;
};

type createPaymentIntentRequest = {
  token: string;
  amount: number;
};

type createCheckoutRequest = {
  token: string;
  itemid: string;
  location: {
    xAxis: string;
    yAxis: string;
  };
};
type isPayableRequest = {
  token: string;
  id: string;
};

type getOrderRequest = {
  token: string;
  id: string;
};

type startMessageRequest = {
  token: string;
  message: string;
  title: string;
  receiverModel: string;
  receiverId?: string;
  itemId: string;
};

type getChatRequest = {
  token: string;
  itemId: string;
  context: 'User' | 'AuctionHouse' | 'SuperAdmin';
};
