/* eslint-disable typescript-sort-keys/interface */
type PureFunc = () => void;
interface IService {
  init: () => PVoid;
}

type PVoid = Promise<void>;
interface IStore {
  hydrate?: () => PVoid;
}
type StoreKeysOf<S> = keyof Omit<S, StoreDefaultKeys>;

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
  key: string;
  keyboardType?: KeyboardType;
  secure?: boolean;
  placeHolder: string;
  mask?: string;
  secureTextEntry?: boolean;
};

type loginRequest = {
  email: string;
  password: string;
  deviceToken?: string;
};

type signUpRequest = {
  name: string;
  ntn: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  location: {
    xAxis: string;
    yAxis: string;
  };
};

interface auctionHouse {
  name: string;
  ntn: string;
  email: string;
  location: {
    xAxis: string;
    yAxis: string;
  };
  avatar: string;
  phoneNumber: string;
  password: string;
  createdAt: Date;
  walletBalance: number;
  listings: [];
  boostedListings: [];
  analytics: [];
}
type otpRequest = {
  email: string;
  otp: string;
  type: string;
  userType: string;
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
interface auctionHouseuser {
  name: string;
  email: string;
  phoneNumber: string;
  password: string;
  jobTitle: string;
  createdAt: Date;
  auctionHouseId: string;
}

type userSignUpRequest = {
  name: String;
  email: String;
  phoneNumber: String;
  password: String;
  confirmPassword: String;
  jobTitle: String;
  auctionHouseId: string;
  token: string;
};

type userLoginRequest = {
  email: String;
  password: String;
};

type auctionItemRequest = {
  title: string;
  description: string;
  startingBid: number;
  categories: string[];
  BiddingStartTime: Date;
  BiddingEndTime: Date;
  BiddingDate: Date;
  token: string;
};

interface AuctionHouseUserData {
  _id: string;
  email: string;
  phoneNumber: string;
  jobTitle: string;
  verified: boolean;
  auctionHouseId: string;
  createdAt: Date;
}

interface AuctionHouseData {
  _id: string;
  name: string;
  avatar: string;
  ntn: string;
  email: string;
  location: { xAxis: string; yAxis: string };
  phoneNumber: string;
  verified: boolean;
  password: string;
  walletBalance: number;
  listings: string[];
  boostedListings: string[];
  analytics: { itemId: string; views: number; clicks: number }[];
  createdAt: Date;
}

type changeAuctionHouseProfilePictureRequest = {
  imageUri: string;
  token: string;
};

interface AuctionItem {
  _id: string;
  title: string;
  description: string;
  startingBid: number;
  categories: string[];
  createdAt: string;
}
type editAuctionItemRequest = {
  itemId: string;
  title: string;
  description: string;
  startingBid: number;
  categories: string[];
  BiddingDate: Date;
  BiddingStartTime: Date;
  BiddingEndTime: Date;
  token: string;
};
type deleteAuctionItemRequest = {
  itemId: string;
  token: string;
};

type AuctionItemPictureRequest = {
  itemId: string;
  images: any[];
  token: string;
};
type fetchAuctionItemsRequest = {
  token: string;
};

type useFetchAuctionItemRequestQuery = {
  Authorization: string;
  itemid: string;
};

type editAuctionHouseProfileRequest = {
  name: string;
  ntn: string;
  phoneNumber: string;
  location: {
    xAxis: string;
    yAxis: string;
  };
  wallet?: string;
  token: string;
};

type createAdRequest = {
  token: string;
  budget: number;
  bidAmount: number;
  auctionItemId: string;
};

type getAdPerformanceRequest = {
  adId: string;
};

type TrackViewRequest = {
  auctionItemId: string;
  token: string;
};

type AuctionHouseStoreType = {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  auctionHouseId?: string;
};

type getUsers = {
  token: string;
  auctionHouseId: string;
};

type deleteAuctionHouseUserRequest = {
  token: string;
  auctionHouseId: string;
  email: string;
};

type getItemAdActive = {
  itemId: string;
};

type editAdRequest = {
  token: string;
  budget: number;
  bidAmount: number;
  itemId: string;
  isActive?: boolean;
};

type createPaymentIntentRequest = {
  token: string;
  amount: number;
};

type AuctionHousesType = {
  phoneNumber: string;
  verified: boolean;

  name: string;

  deviceToken?: string;
  avatar?: string;
  ntn: string;
  location: {
    xAxis: number;
    yAxis: number;
  };
  _id: string;
  email: string;
  accountStatus: 'active' | 'suspended';
};

type deleteAuctionHouseRequest = {
  token: string;
  auctionHouseId: string;
};

type endUserType = {
  _id: string;
  avatar: string;
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
};
type getOneUserRequest = {
  token: string;
  id: string;
};
type editUserProfileRequestQueryFields = {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  wallet?: string;
};
type category = { _id: string; name: string; items: string[] };

type addCategoriesRequest = {
  token: string;
  name: string;
};

type getCategoryRequest = {
  token: string;
  id: string;
};
type getItemRequest = {
  token: string;
  itemid: string;
};
type editCategoryRequest = {
  token: string;
  id: string;
  name: string;
};

type AssignAgentRequest = {
  token: string;
  orderId: string;
  agentId: string;
};

type registerAgentRequest = {
  token: string;
  name: string;
  phone: string;
};

type updateOrderStatusRequest = {
  token: string;
  orderId: string;
  status: string;
};

type createSuperAdminRequest = {
  token: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

type getSuperAdminRequest = {
  token: string;
};

type getAllOrdersRequest = {
  token: string;
};

type superAdmin = {
  _id: string;
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

type getAuctionOrderRequest = {
  token: string;
  id: string;
};

// type getChatRequest = {
//   token: string;
//   itemId: string;
// }

// type startMessageRequest = {
//   token: string;
//   message: string;
//   title: string;
//   receiverModel: string;
//   receiverId: string;
//   itemId: string;
// };

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
type handleAuctionHouseStatusRequest = {
  token: string;
  email: string;
  status: 'APPROVE' | 'REJECT';
};
