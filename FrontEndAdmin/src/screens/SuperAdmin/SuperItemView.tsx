import { View, Text, ScrollView, Image } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useTheme } from '@/theme';
import Carousell from 'react-native-reanimated-carousel';
import { useTranslation } from 'react-i18next';
import { useSharedValue } from 'react-native-reanimated';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/navigation/types';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { Paths } from '@/navigation/paths';
import { useGetItem } from '@/queries/superAdmin.queries';
import { useStores } from '@/stores';
import { SafeScreen } from '@/components/templates';
import { logo } from '../../../images';

type SuperItemViewScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  Paths.SuperItem
>;
type SuperItemViewScreenRouteProp = RouteProp<
  RootStackParamList,
  Paths.SuperItem
>;

export default function SuperItemView() {
  const {
    layout,
    gutters,
    fonts,
    borders,
    variant,
    navigationTheme,
  } = useTheme();
  const { auth } = useStores();
  const navigation = useNavigation<SuperItemViewScreenNavigationProp>();
  const route = useRoute<SuperItemViewScreenRouteProp>();
  const id = route.params.id;
  const { data, isError, refetch, status } = useGetItem({
    token: auth.token,
    itemid: id,
  });
  const { t } = useTranslation();
  const [currentTime, setCurrentTime] = useState(new Date());
  const scrollOffsetValue = useSharedValue<number>(0);
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12 || 12;

    return `${hours}:${minutes} ${ampm}`;
  };

  const formatShortDate = (isoString: string) => {
    const date = new Date(isoString);

    const day = date.getDate();
    const suffix =
      day === 1 || day === 21 || day === 31
        ? 'st'
        : day === 2 || day === 22
          ? 'nd'
          : day === 3 || day === 23
            ? 'rd'
            : 'th';

    const month = date.toLocaleString('en-US', { month: 'short' });

    const year = date.getFullYear().toString().slice(-2);
    return `${day}${suffix} ${month} '${year}`;
  };
  const [ended, setEnded] = useState<boolean>(false);
  const [images, setImages] = useState<any[]>([]);

  useEffect(() => {
    if (data) {
      setEnded(new Date(data?.auctionItems?.BiddingEndTime) < currentTime);
    }
  }, [data]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (status === 'pending') {
    return <Text>Loading...</Text>;
  }
  if (status === 'error') {
    refetch();

    return <Text style={{ marginTop: 100 }}>Error...</Text>;
  }

  const carouselData = [
    ...(data?.auctionItems?.avatar || []),
    ...images.map((img) => img.uri),
  ];
  if (!data) {
    return (
      <View
        style={[
          layout.fullWidth,
          layout.itemsCenter,
          layout.justifyCenter,
          { marginTop: 10 },
        ]}
      >
        <Text>Loading...</Text>
      </View>
    );
  }
  return (
    <SafeScreen noPadding isError={isError} onResetError={refetch}>
      <ScrollView
        contentContainerStyle={{ flex: 1, flexGrow: 1, paddingBottom: 50 }}
      >
        <View
          style={[
            layout.itemsCenter,
            layout.justifyCenter,
            {
              height: '38%',
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
            data={carouselData}
            defaultScrollOffsetValue={scrollOffsetValue}
            style={[
              { height: '100%', flex: 1 },
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
                    {index + 1} / {data?.auctionItems?.avatar?.length}
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
              paddingBottom: 5,
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
              {data?.auctionItems?.title}
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
            {data?.auctionItems?.categories.map(
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
                  {data?.auctionItems?.categories.length === index + 1
                    ? ''
                    : ' - '}
                </Text>
              ),
            )}
          </View>
        </View>
        <View
          style={[
            {
              height: 100,
              backgroundColor: navigationTheme.colors.border,
              overflow: 'hidden',
              borderBottomEndRadius: 16,
              width: '90%',
              alignSelf: 'center',
            },
            borders.roundedBottom_16,
          ]}
        >
          <View
            style={[
              {
                flex: 1,
                flexDirection: 'row',
                marginTop: 10,
                marginLeft: 30,
              },
            ]}
          >
            <View style={[{ flex: 1, flexDirection: 'row' }]}>
              <MaterialCommunityIcons
                name="currency-rupee"
                size={22}
                color={variant === 'dark' ? 'white' : 'black'}
              >
                <Text
                  style={[fonts.gray800, fonts.bold, { fontSize: 22 }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {' ' + data?.auctionItems?.startingBid}
                </Text>
              </MaterialCommunityIcons>
            </View>
            <View style={[{ flex: 1 }]}>
              <FontAwesome5
                name="hourglass-start"
                color={variant === 'dark' ? 'white' : 'black'}
                size={22}
              >
                <Text style={[fonts.gray800, fonts.bold, { fontSize: 22 }]}>
                  {'   '}
                  {formatTime(data?.auctionItems?.BiddingStartTime)}{' '}
                </Text>
              </FontAwesome5>
            </View>
          </View>

          <View
            style={[
              {
                width: '100%',
                flexDirection: 'row',
                paddingVertical: 20,
              },
            ]}
          >
            <View style={[{ flex: 1, marginLeft: 30 }]}>
              <FontAwesome5
                name="calendar-alt"
                color={variant === 'dark' ? 'white' : 'black'}
                size={22}
              >
                <Text style={[fonts.gray800, fonts.bold, { fontSize: 22 }]}>
                  {' '}
                  {formatShortDate(data?.auctionItems?.BiddingDate)}
                </Text>
              </FontAwesome5>
            </View>
            <View style={{ flex: 1 }}>
              <FontAwesome5
                name="hourglass-end"
                color={variant === 'dark' ? 'white' : 'black'}
                size={22}
              >
                <Text style={[fonts.gray800, fonts.bold, { fontSize: 22 }]}>
                  {'   '}
                  {formatTime(data?.auctionItems?.BiddingEndTime)}{' '}
                </Text>
              </FontAwesome5>
            </View>
          </View>
        </View>
        <View
          style={[
            borders.rounded_16,
            {
              borderWidth: 1,
              width: '90%',
              height: 100,
              alignSelf: 'center',

              backgroundColor: navigationTheme.colors.border,
              marginTop: 10,
              justifyContent: 'center',
              alignItems: 'center',
            },
          ]}
        >
          <Text style={[fonts.gray800, fonts.bold, fonts.size_16]}>
            {ended ? 'Winner' : 'Current Bidder'}:
            {data?.auctionItems?.currentBidder
              ? data?.auctionItems?.currentBidder?.firstName +
                ' ' +
                data.auctionItems?.currentBidder?.lastName
              : ' No bidder'}{' '}
            {} {}
          </Text>
          <Text style={[fonts.gray800, fonts.bold, fonts.size_16]}>
            Bid Amount: {data?.auctionItems?.currentBid}
          </Text>
        </View>
        <View
          style={[
            {
              width: '90%',
              marginHorizontal: '5%',

              backgroundColor: navigationTheme.colors.border,
              height: '26%',
              marginTop: 10,
            },
            gutters.padding_12,
            borders.rounded_16,
          ]}
        >
          <ScrollView>
            <Text style={[fonts.gray400, fonts.size_16]}>
              {data?.auctionItems?.description}
            </Text>
          </ScrollView>
        </View>
      </ScrollView>
    </SafeScreen>
  );
}
