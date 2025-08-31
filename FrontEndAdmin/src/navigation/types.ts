import type { StackScreenProps } from '@react-navigation/stack';
import type {  Paths } from '@/navigation/paths';

export type RootStackParamList = {
  [Paths.Startup]: undefined;
  [Paths.Example]: undefined;
  [Paths.Login]: undefined;
  [Paths.Signup]: undefined;
  [Paths.Otp]: { email: string; type: string; fromProfile?: boolean };
  [Paths.forgotPassword]: undefined;
  [Paths.ChangePass]: { email: string } | undefined;
  [Paths.userSignUp]: undefined;
  [Paths.UserLogin]: undefined;
  [Paths.auctionItems]: undefined;
  [Paths.BottomTab]: undefined;
  [Paths.Dashboard]: undefined;
  [Paths.auctionHouseUserSignUp]: undefined;
  [Paths.auctionHouseUserSignIn]: undefined;
  [Paths.auctionHouseUser]: undefined;
  [Paths.Profile]: undefined;
  [Paths.ItemView]: { item: any };
  [Paths.newItem]: { item: any };
  [Paths.Advertisement]: { id: string };
  [Paths.SuperBottomTab]: undefined;
  [Paths.SuperDashboard]: undefined;
  [Paths.SuperUserStack]: undefined;
  [Paths.SuperUser]: undefined;
  [Paths.SuperUserView]: { id: string };
  [Paths.SuperCategoryStack]: undefined;
  [Paths.SuperCategory]: undefined;
  [Paths.SuperCategoryView]: { id: string };
  [Paths.SuperItem]: { id: string };
  [Paths.SuperAdminCreate]: { id: string };
  [Paths.delivery]: undefined;
  [Paths.deliveryStack]: undefined;
  [Paths.deliveryOverView]: { id: string };
  [Paths.ChatList]: undefined;
  [Paths.SuperDashboardStack]: undefined;
  [Paths.AnalyticsScreen]: undefined;

  [Paths.Chat]: {
    id: string;
    name: string;
    image?: string;
    superAdmin?: boolean;
    receiverId?: string;
    context: 'User' | 'AuctionHouse' | 'SuperAdmin';
  };
  [Paths.WithdrawScreen]: undefined;
  [Paths.SuperWaitingList]: undefined;
};

export type RootScreenProps<
  S extends keyof RootStackParamList = keyof RootStackParamList,
> = StackScreenProps<RootStackParamList, S>;
