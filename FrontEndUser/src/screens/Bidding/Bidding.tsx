import { View, Text, Image, ScrollView, Alert } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { TextField } from '@/components/molecules';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '@/types/navigation';
import { StackNavigationProp } from '@react-navigation/stack';
import ForwardButton from '@/components/molecules/ForwardButton';
import { toast } from '@backpackapp-io/react-native-toast';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { useFetchAuctionItem } from '@/queries/listing.queries';
import { useStores } from '@/stores';
import Carousell from 'react-native-reanimated-carousel';
import { logo } from '../../../assets/images';
import { useSharedValue } from 'react-native-reanimated';
import { Controller, set, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import { useMutation } from '@apollo/client';
import { UPDATE_BID_MUTATION } from '@/graphql/bids';
import { useQueryClient } from '@tanstack/react-query';
import { REACT_QUERY_KEYS } from '../../queries/index';
import { useGetUserProfile } from '@/queries/profile.queries';
import { ApolloError } from '@apollo/client/errors';
type BiddingScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Bidding'
>;

export default function Bidding() {
  const { t } = useTranslation(['Signup', 'common']);
  const queryClient = useQueryClient();
  const { auth } = useStores();
  const token = auth.token;
  const navigation = useNavigation<BiddingScreenNavigationProp>();
  const {
    data: userData,
    refetch: refetchUser,
    status: userStatus,
  } = useGetUserProfile();
  const [updateBid, { loading: isBidding }] = useMutation(UPDATE_BID_MUTATION, {
    onCompleted: (data) => {
      if (data.updateBid.success) {
        toast.success(data.updateBid.message);
        queryClient.invalidateQueries({
          queryKey: [REACT_QUERY_KEYS.listingQueries.getAuctionItem],
        });
      }
    },
    onError: (error) => {
      toast.error('Bid amount must be greater than current bid');

      if (error instanceof ApolloError) {
        console.log('GraphQL Errors:', error.graphQLErrors);
        console.log('Network Error:', error.networkError);
      }

      console.error('Error updating bid:', error?.message || error);
    },
  });
  const { layout, gutters, fonts, borders, variant, navigationTheme } =
    useTheme();
  const route = useRoute<RouteProp<RootStackParamList, 'Bidding'>>();

  const { item } = route.params;

  const { data, status, refetch } = useFetchAuctionItem({
    token: token,
    itemId: item._id,
  });

  const scrollOffsetValue = useSharedValue<number>(0);

  const [countdownText, setCountdownText] = useState<string | null>(null);

  useEffect(() => {
    const { BiddingStartTime, BiddingEndTime } = data.auctionItem;

    const calculateCountdown = () => {
      const now = new Date();
      const startTime = new Date(BiddingStartTime);
      const endTime = new Date(BiddingEndTime);

      if (now < startTime) {
        setCountdownText('Coming Soon');
        return;
      }

      const difference = endTime.getTime() - now.getTime();

      if (difference > 0) {
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / (1000 * 60)) % 60);
        const seconds = Math.floor((difference / 1000) % 60);

        setCountdownText(
          `${hours.toString().padStart(2, '0')}:${minutes
            .toString()
            .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
        );
      } else {
        setCountdownText('Bidding Ended');
      }
    };

    calculateCountdown();
    const intervalId = setInterval(calculateCountdown, 1000);

    return () => clearInterval(intervalId);
  }, [data.auctionItem.BiddingStartTime, data.auctionItem.BiddingEndTime]);

  const Field = [
    {
      icon: (
        <View
          style={[
            layout.fullHeight,
            borders.gray800,
            layout.justifyCenter,
            layout.itemsCenter,
          ]}
        >
          <MaterialCommunityIcons
            name={'currency-rupee'}
            size={20}
            color={variant === 'dark' ? 'white' : 'black'}
          />
        </View>
      ),
      placeHolder: 'Enter your bid',
      keyboardType: 'number-pad',
      key: 'bid',
    },
  ];
  const minBid: number =
    data.auctionItem.currentBid > 0
      ? parseInt(data.auctionItem.currentBid)
      : parseInt(data.auctionItem.startingBid);
  console.log('minBid', minBid);
  const validationBidSchema = Yup.object({
    bid: Yup.number()
      .typeError('Bid cannot be empty')
      .required('Bid cannot be empty')
      .min(minBid, 'Bid should be greater than Current bid'),
  });
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      bid: data.auctionItem.startingBid,
    },
    resolver: yupResolver(validationBidSchema),
  });

  useEffect(() => {
    if (data) {
      reset({
        bid: data.auctionItem.startingBid,
      });
    }
  }, [data]);

  const [loading, setLoading] = useState<boolean>(false);
  const [userCurrentBid, setUserCurrentBid] = useState<number>(0);
  useEffect(() => {
    refetchUser();
  }, [data]);
  useEffect(() => {
    if (userData) {
      setUserCurrentBid(
        userData?.user.bids.find(
          (element: { itemId: string; bidAmount: number }) =>
            element.itemId === item._id,
        )?.bidAmount || 0,
      );
    }
  }, [userData]);
  const onSubmit = handleSubmit(async (data: any) => {
    console.log('data', data);
    setLoading(true);
    try {
      await updateBid({
        variables: {
          auctionItemId: item._id,
          bidAmount: data.bid,
        },
      });
    } catch (e) {
      console.error('Bid error:', e);
      throw e;
    } finally {
      setLoading(false);
    }
  });

  if (status === 'pending') {
    return <Text>Loading...</Text>;
  }
  if (status === 'error') {
    refetch();
    return <Text>Error...</Text>;
  }

  return (
    <ScrollView>
      <View
        style={[
          layout.itemsCenter,
          layout.justifyCenter,
          {
            height: 300,
            marginLeft: 20,
            width: '90%',
          },
        ]}
      >
        <Carousell
          testID={'xxx'}
          loop={false}
          width={380}
          height={250}
          snapEnabled={true}
          pagingEnabled={true}
          data={data.auctionItem.avatar}
          defaultScrollOffsetValue={scrollOffsetValue}
          style={[
            { height: '100%', flex: 1 },
            ,
            layout.itemsCenter,
            borders.rounded_16,
          ]}
          renderItem={({ item, index }) => (
            <View
              style={[
                layout.flex_1,
                layout.justifyCenter,
                { width: '100%', height: '100%' },
              ]}
            >
              <Image
                style={[
                  { height: '95%', overflow: 'hidden' },
                  layout.fullWidth,
                  borders.rounded_16,
                ]}
                source={item ? { uri: item } : logo}
                resizeMode="stretch"
              />

              <View
                style={[
                  {
                    position: 'absolute',
                    zIndex: 1000,
                    bottom: 20,
                    left: 20,
                    padding: 5,
                    paddingHorizontal: 10,
                  },
                  {
                    backgroundColor: navigationTheme.colors.border,
                    borderRadius: 2,
                  },
                ]}
              >
                <Text style={[fonts.gray800]}>
                  {index + 1} / {data.auctionItem.avatar.length}
                </Text>
              </View>
            </View>
          )}
        />
      </View>

      <View
        style={[
          {
            maxHeight: 100,
            width: '90%',
            flexDirection: 'column',
            backgroundColor: navigationTheme.colors.border,
            alignSelf: 'center',
          },
          borders.roundedTop_16,
        ]}
      >
        <View
          style={[
            {
              width: '100%',
              flexDirection: 'row',
              marginTop: 8,
            },
            layout.itemsCenter,
            layout.justifyCenter,
          ]}
        >
          <Text
            style={[
              fonts.bold,
              fonts.capitalize,
              fonts.gray800,

              { fontSize: 28 },
            ]}
          >
            {data.auctionItem.title}
          </Text>
        </View>

        <View
          style={[
            {
              marginTop: 5,
              width: '90%',
              alignSelf: 'center',
              flexDirection: 'row',
            },
            layout.itemsCenter,
            layout.justifyCenter,
          ]}
        >
          {data.auctionItem.categories.map(
            (
              category: {
                name:
                  | string
                  | number
                  | boolean
                  | React.ReactElement<
                      any,
                      string | React.JSXElementConstructor<any>
                    >
                  | Iterable<React.ReactNode>
                  | React.ReactPortal
                  | null
                  | undefined;
              },
              index: number,
            ) => (
              <Text
                style={[
                  fonts.gray400,
                  fonts.capitalize,
                  fonts.bold,
                  fonts.size_16,
                ]}
                numberOfLines={2}
                adjustsFontSizeToFit
              >
                {category.name}
                {data.auctionItem.categories.length === index + 1 ? '' : ' - '}
              </Text>
            ),
          )}
        </View>
      </View>

      <View
        style={[
          {
            backgroundColor: navigationTheme.colors.border,
            overflow: 'hidden',
            borderBottomEndRadius: 16,
            width: '90%',
            alignSelf: 'center',
          },
          borders.roundedBottom_16,
        ]}
      >
        <View style={[{ marginTop: 10, marginLeft: 30 }]}>
          <Text
            style={[fonts.gray800, { fontSize: 18 }]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            Starting Bid: {''}
            <MaterialCommunityIcons
              name="currency-rupee"
              size={18}
              color={variant === 'dark' ? 'white' : 'black'}
            >
              {''} {data.auctionItem.startingBid}
            </MaterialCommunityIcons>
          </Text>
        </View>
        <View style={[{ marginTop: 10, marginLeft: 30 }]}>
          <Text style={[fonts.gray800, { fontSize: 18 }]}>
            Time remaining: {''}
            <FontAwesome5
              name="stopwatch"
              color={variant === 'dark' ? 'white' : 'black'}
              size={18}
            >
              <Text style={[fonts.gray800, fonts.bold, { fontSize: 18 }]}>
                {''} {countdownText}
              </Text>
            </FontAwesome5>
          </Text>
        </View>
        <View
          style={[
            {
              width: '100%',
              paddingVertical: 10,
            },
          ]}
        >
          <View style={[{ marginLeft: 30 }]}>
            <Text
              style={[fonts.gray800, { fontSize: 18 }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              Current Bid: {''}
              <MaterialCommunityIcons
                name="currency-rupee"
                size={18}
                color={variant === 'dark' ? 'white' : 'black'}
              >
                {' '}
                {parseInt(data.auctionItem.currentBid) === 0
                  ? data.auctionItem.startingBid
                  : +data.auctionItem.currentBid}
              </MaterialCommunityIcons>
            </Text>
          </View>
          <View style={[{ marginLeft: 30, marginTop: 10 }]}>
            <Text
              style={[fonts.gray800, { fontSize: 18 }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              Your Bid:{' '}
              <MaterialCommunityIcons
                name="currency-rupee"
                size={18}
                color={variant === 'dark' ? 'white' : 'black'}
              ></MaterialCommunityIcons>
              {''} {userCurrentBid}
            </Text>
          </View>
        </View>
      </View>

      <View
        style={[
          {
            width: '80%',
            marginTop: 60,
            flexDirection: 'row',
            alignSelf: 'center',
            alignItems: 'flex-start',
          },
        ]}
      >
        <View
          style={[
            {
              width: '80%',
              alignItems: 'center',
              marginTop: 12,
              justifyContent: 'center',
            },
          ]}
        >
          {Field.map((a, index) => {
            return (
              <Controller
                key={a.key}
                control={control}
                name={a.key as any}
                render={({ field: { onChange, onBlur, value } }) => (
                  <View key={a.key + index}>
                    <TextField
                      error={errors[a.key as 'bid']?.message?.toString()}
                      handleChange={onChange}
                      onBlur={onBlur}
                      value={value}
                      key={a.key}
                      style={{ paddingHorizontal: 0, width: '100%' }}
                      placeholder={a.placeHolder}
                      keyboardType={a.keyboardType as KeyboardType}
                      icon={a.icon}
                    />
                  </View>
                )}
              />
            );
          })}
        </View>
        <View
          style={[
            { width: '20%', alignItems: 'center', justifyContent: 'center' },
          ]}
        >
          <ForwardButton onPress={onSubmit} loading={false} />
        </View>
      </View>
    </ScrollView>
  );
}
