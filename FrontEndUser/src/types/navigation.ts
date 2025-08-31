import type { StackScreenProps } from '@react-navigation/stack';

export type RootStackParamList = {
  Startup: undefined;
  Example: undefined;
  Login: undefined;
  Signup: undefined;
  ForgotPass: undefined;
  OTP: { email: string; type: string };
  ChangePass: { email: string };
  UserProfile: undefined;
  WelcomePage: undefined;
  TabNavigator: undefined;
  ItemView: { item: { _id: string } };
  Bidding: { item: { _id: string } };
  WonItems: undefined;
  FavoriteItems: undefined;
  Checkout: { item: { _id: string } };
  Delivery: { id: string };
  ChatScreen: {
    id: string;
    name: string;
    image?: string;
    superAdmin?: boolean;
    receiverId?: string;
    context: 'User' | 'AuctionHouse' | 'SuperAdmin';
  };
  ChatList: undefined;
};

export type RootScreenProps<
  S extends keyof RootStackParamList = keyof RootStackParamList,
> = StackScreenProps<RootStackParamList, S>;
