import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { useTheme } from '@/theme';
import { useTranslation } from 'react-i18next';
import { Paths } from '@/navigation/paths';
import type { StackNavigationProp } from '@react-navigation/stack/lib/typescript/src/types';
import type { RootStackParamList } from '@/navigation/types';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import {
  useCreateAd,
  useEditAd,
  useGetAd,
  useGetMinBid,
  useIsItemAdActive,
  useGetAdPerformance,
} from '@/queries/ad.queries';
import { toast } from '@backpackapp-io/react-native-toast';
import { useStores } from '@/stores';
import { PieChart } from 'react-native-gifted-charts';
import * as Icons from '@/components/molecules/Icons';
import RNBounceable from '@freakycoder/react-native-bounceable';
import { ActivityIndicator } from 'react-native-paper';

type AdvertisementScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  Paths.Advertisement
>;

type AdvertisementScreenRouteProp = RouteProp<
  RootStackParamList,
  Paths.Advertisement
>;

export default function Advertisement() {
  const navigation = useNavigation<AdvertisementScreenNavigationProp>();
  const route = useRoute<AdvertisementScreenRouteProp>();
  const params = route.params ?? {};
  const id = 'id' in params ? params.id : undefined;
  const { layout, gutters, fonts, variant, borders } = useTheme();
  const { t } = useTranslation();
  const { auth } = useStores();
  const [budget, setBudget] = useState(0);
  const [bid, setBid] = useState(0);
  const [minBid, setMinBid] = useState(0);
  const { data, status } = useGetMinBid();
  const { mutateAsync: editAdMutateAsync, status: editAdStatus } = useEditAd();
  const {
    data: adData,
    status: adDataStatus,
    refetch: getAdRefetch,
  } = useGetAd(id!!);
  const {
    data: adPerformanceData,
    status: adPerformanceStatus,
    refetch: getAdPerformanceRefetch,
  } = useGetAdPerformance({ adId: adData?.ad?._id ?? '' });

  if (adDataStatus === 'success' && adData) {
    getAdPerformanceRefetch();
  }

  //@ts-ignore
  const {
    data: isAdActive,
    status: isAdActiveStatus,
    refetch: isAdActiveRefetch,
  } = useIsItemAdActive(id!!);
  const [loading, setLoading] = useState(false);
  const [adActive, setAdActive] = useState(false);
  const [totalClicks, setTotalClicks] = useState(0);
  const [agents, setAgents] = useState<any[]>([]);
  const [centerLabel, setCenterLabel] = useState({ name: 'IOS', value: 0 });
  useEffect(() => {
    if (id) {
      isAdActiveRefetch();
      getAdRefetch();
      getAdPerformanceRefetch();
    }
  }, [id]);
  useEffect(() => {
    if (isAdActiveStatus === 'success') {
      setAdActive(isAdActive.isActive);
    }
  }, [isAdActive, isAdActiveStatus]);

  const { mutateAsync, status: createAdStatus } = useCreateAd();
  const [pieData, setPieData] = useState<any>([
    {
      value: 0,
      color: '#009FFF',
      gradientCenterColor: '#006DFF',
      name: 'IOS',
    },
    {
      value: 0,
      color: '#93FCF8',
      gradientCenterColor: '#3BE9DE',
      name: 'Android',
    },
    {
      value: 1,
      color: '#BDB2FA',
      gradientCenterColor: '#8F80F3',
      name: 'Others',
    },
  ]);
  useEffect(() => {
    if (data) {
      setBid(data.averageBid);
      setMinBid(data.averageBid);
      setBudget(data.averageBid);
    }
  }, [data]);

  useEffect(() => {
    if (adPerformanceData) {
      setTotalClicks(adPerformanceData.clicks);
      setAgents(adPerformanceData.agents);
    }
  }, [adPerformanceData]);

  // // Ext// Calculate percentages and update pie chart data and center label
  useEffect(() => {
    if (
      adPerformanceData &&
      adPerformanceData.agents &&
      adPerformanceData.clicks > 0
    ) {
      let ios = 0;
      let android = 0;
      let others = 0;

      adPerformanceData.agents.forEach(
        (agent: { count: number; userAgent: string }) => {
          const percentage = (agent.count / adPerformanceData.clicks) * 100;
          if (agent.userAgent === 'ios') {
            ios = Math.round(percentage);
          } else if (agent.userAgent === 'android') {
            android = Math.round(percentage);
          } else {
            others += Math.round(percentage);
          }
        },
      );

      if (ios + android + others !== 100) {
        others = 100 - (ios + android);
      }

      const maxPercentage = Math.max(ios, android, others);
      let newCenterLabel = { name: 'IOS', value: ios };

      if (maxPercentage === android) {
        newCenterLabel = { name: 'Android', value: android };
      } else if (maxPercentage === others) {
        newCenterLabel = { name: 'Others', value: others };
      }
      setCenterLabel(newCenterLabel);
      setPieData([
        {
          value: ios,
          color: '#009FFF',
          gradientCenterColor: '#006DFF',
          name: 'IOS',
        },
        {
          value: android,
          color: '#93FCF8',
          gradientCenterColor: '#3BE9DE',
          name: 'Android',
        },
        {
          value: others,
          color: '#BDB2FA',
          gradientCenterColor: '#8F80F3',
          name: 'Others',
        },
      ]);
    }
  }, [adPerformanceData]);
  useEffect(() => {
    if (!adPerformanceData) {
      getAdPerformanceRefetch();
    }
  }, [adPerformanceData]);
  const renderDot = (color: string) => {
    return (
      <View
        style={{
          height: 10,
          width: 10,
          borderRadius: 5,
          backgroundColor: color,
          marginRight: 10,
        }}
      />
    );
  };

  const renderLegendComponent = () => {
    return (
      <>
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'center',
            marginBottom: 10,
            marginTop: 5,
          }}
        >
          {pieData.map(
            (
              item: {
                color: string;
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
                value:
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
              index: React.Key | null | undefined,
            ) => {
              return (
                <View
                  key={index}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    width: 120,
                    marginRight: index === 1 ? 0 : 20,
                    marginTop: index === 2 ? 20 : 0,
                  }}
                >
                  {renderDot(item.color)}
                  <Text style={{ color: 'white' }}>
                    {item.name}:{item.value}%
                  </Text>
                </View>
              );
            },
          )}
        </View>
      </>
    );
  };
  if (status === 'pending') {
    return (
      <ActivityIndicator
        animating={true}
        color={variant === 'dark' ? 'white' : 'black'}
        style={{ flex: 1 }}
      />
    );
  }
  const onSubmit = async () => {
    if (isAdActive.isActive) {
      const payload: editAdRequest = {
        token: auth.token,
        budget: budget,
        bidAmount: bid,
        // @ts-ignore
        itemId: id,
        isActive: true,
        remainingBudget: budget - totalClicks * bid,
      };
      if (payload.budget < payload.bidAmount) {
        toast.error(t('advertisement.budgetError'));
        return;
      }
      if (payload.bidAmount < minBid) {
        toast.error(t('advertisement.bidError'));
        return;
      }
      setLoading(true);
      try {
        console.log('Payload:', payload);
        const response = await editAdMutateAsync(payload);
        if (editAdStatus === 'success') {
          toast.success(response.data.message);
        } else if (editAdStatus === 'error') {
          toast.error(response.data.message);
        }
      } catch (error) {
        console.error('Error:', error);
        toast.error(t('advertisement.error'));
      } finally {
        setLoading(false);
      }
      return;
    }

    const payload: createAdRequest = {
      token: auth.token,
      budget: budget,
      bidAmount: bid,
      // @ts-ignore
      auctionItemId: id,
    };
    if (payload.budget < payload.bidAmount) {
      toast.error(t('advertisement.budgetError'));
      return;
    }
    if (payload.bidAmount < minBid) {
      toast.error(t('advertisement.bidError'));
      return;
    }
    setLoading(true);
    try {
      const response = await mutateAsync(payload);
      if (createAdStatus === 'success') {
        toast.success(response.data.message);
      } else if (createAdStatus === 'error') {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error(t('advertisement.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 50 }}>
      <View style={[layout.flex_1, layout.itemsCenter, layout.justifyCenter]}>
        <View
          style={[
            {
              margin: 20,
              padding: 16,
              borderRadius: 20,
              backgroundColor: '#232B5D',
              width: '85%',
            },
          ]}
        >
          {!adActive && (
            <View
              style={{
                flex: 1,
                position: 'absolute',
                backgroundColor: 'gray',
                opacity: 0.3,
                height: '108%',
                borderRadius: 20,
                zIndex: 10,
                width: '110%',
                alignItems: 'flex-end',
              }}
            >
              <Icons.FontAwesome5
                name="lock"
                size={50}
                color="black"
                style={{ marginRight: 20, marginTop: 20 }}
              />
            </View>
          )}
          <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
            Performance
          </Text>
          <View style={{ alignItems: 'center' }}>
            <PieChart
              data={pieData}
              isAnimated={true}
              animationDuration={600}
              donut
              showGradient
              sectionAutoFocus
              focusOnPress
              radius={145}
              innerRadius={60}
              onPress={(item: { name: any; value: any }) => {
                setCenterLabel({
                  name: item.name,
                  value: item.value,
                });
              }}
              innerCircleColor={'#232B5D'}
              centerLabelComponent={() => {
                return (
                  <View
                    style={{ justifyContent: 'center', alignItems: 'center' }}
                  >
                    <Text
                      style={{
                        fontSize: 22,
                        color: 'white',
                        fontWeight: 'bold',
                      }}
                    >
                      {centerLabel.value}%
                    </Text>
                    <Text style={{ fontSize: 14, color: 'white' }}>
                      {centerLabel.name}
                    </Text>
                  </View>
                );
              }}
            />
          </View>
          {renderLegendComponent()}
        </View>

        <View
          style={[
            layout.itemsCenter,
            {
              width: '85%',
              borderRadius: 20,
              backgroundColor: variant === 'dark' ? '#1f1f1f' : '#ffffff',
              borderColor: variant === 'dark' ? '#333' : '#ddd',
              borderWidth: 1,
              shadowColor: variant === 'dark' ? '#000' : '#ddd',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              elevation: 2,
            },
            gutters.padding_12,
          ]}
        >
          <View
            style={[
              layout.row,
              layout.justifyBetween,
              layout.itemsCenter,
              layout.fullWidth,
              borders.red500,
            ]}
          >
            <Text
              style={[fonts.gray800, fonts.size_16, gutters.marginVertical_12]}
            >
              Number of Clicks
            </Text>
            <Text
              style={[fonts.gray800, fonts.size_16, gutters.marginVertical_12]}
            >
              {totalClicks}
            </Text>
          </View>
          <View
            style={[
              layout.row,
              layout.justifyBetween,
              layout.itemsCenter,
              layout.fullWidth,
              borders.red500,
            ]}
          >
            <Text
              style={[fonts.gray800, fonts.size_16, gutters.marginVertical_12]}
            >
              Total Budget Assigned
            </Text>
            <Text
              style={[fonts.gray800, fonts.size_16, gutters.marginVertical_12]}
            >
              {adPerformanceData?.totalBudget ?? 0.0}
            </Text>
          </View>
          <View
            style={[
              layout.row,
              layout.justifyBetween,
              layout.itemsCenter,
              layout.fullWidth,
              borders.red500,
            ]}
          >
            <Text
              style={[fonts.gray800, fonts.size_16, gutters.marginVertical_12]}
            >
              Bid Amount Per Click
            </Text>
            <Text
              style={[fonts.gray800, fonts.size_16, gutters.marginVertical_12]}
            >
              {adPerformanceData?.ad?.bidAmount ?? 0}
            </Text>
          </View>
          <View
            style={[
              layout.row,
              layout.justifyBetween,
              layout.itemsCenter,
              layout.fullWidth,
              borders.red500,
            ]}
          >
            <Text
              style={[fonts.gray800, fonts.size_16, gutters.marginVertical_12]}
            >
              Remaining Budget
            </Text>
            <Text
              style={[fonts.gray800, fonts.size_16, gutters.marginVertical_12]}
            >
              {adPerformanceData?.ad?.budget ?? 0}
            </Text>
          </View>
          <View
            style={[
              layout.row,
              layout.justifyBetween,
              layout.itemsCenter,
              layout.fullWidth,
              borders.red500,
            ]}
          >
            <Text
              style={[fonts.gray800, fonts.size_16, gutters.marginVertical_12]}
            >
              Total Spent
            </Text>
            <Text
              style={[fonts.gray800, fonts.size_16, gutters.marginVertical_12]}
            >
              {adPerformanceData?.spent ?? 0}
            </Text>
          </View>
        </View>

        <View
          style={[
            layout.fullWidth,
            ,
            layout.itemsCenter,
            layout.justifyCenter,
            gutters.marginTop_16,
          ]}
        >
          <Text style={[fonts.gray800]}>Budget</Text>

          <View
            style={[
              gutters.marginVertical_16,
              layout.row,
              layout.justifyBetween,
              gutters.marginTop_16,
              {
                width: '80%',
                height: 70,
              },
            ]}
          >
            <RNBounceable
              disabled={budget === minBid}
              onPress={() => {
                if (budget == 0 || budget <= minBid) {
                  return;
                }
                setBudget(budget - 1);
              }}
              style={[
                borders.w_1,
                borders.rounded_16,
                ,
                layout.justifyCenter,
                layout.itemsCenter,
                {
                  width: '20%',
                  height: '90%',
                  borderColor: variant === 'dark' ? 'white' : 'black',
                  opacity: budget === minBid ? 0.5 : 1,
                },
              ]}
            >
              <Icons.FontAwesome5
                name="minus"
                size={25}
                color={variant === 'dark' ? 'white' : 'black'}
              />
            </RNBounceable>
            <View
              style={[
                borders.rounded_16,
                layout.justifyCenter,
                layout.itemsCenter,
                borders.w_1,
                {
                  width: '30%',
                  height: '90%',
                  borderColor: variant === 'dark' ? 'white' : 'black',
                },
              ]}
            >
              <TextInput
                placeholder="0"
                keyboardType="numeric"
                defaultValue={budget.toString()}
                onChange={(e) => {
                  const inputText = e.nativeEvent.text;
                  const parsedValue = parseInt(inputText, 10);
                  const newBudget =
                    isNaN(parsedValue) || inputText === '' ? 0 : parsedValue;
                  setBudget(newBudget);
                }}
                style={[
                  layout.fullWidth,
                  layout.fullHeight,
                  fonts.alignCenter,
                  {
                    color: variant === 'dark' ? 'white' : 'black',
                  },
                ]}
              />
            </View>
            <RNBounceable
              onPress={() => {
                setBudget(budget + 1);
              }}
              style={[
                borders.w_1,
                borders.rounded_16,
                layout.justifyCenter,
                layout.itemsCenter,
                {
                  width: '20%',
                  height: '90%',
                  borderColor: variant === 'dark' ? 'white' : 'black',
                },
              ]}
            >
              <Icons.FontAwesome5
                name="plus"
                size={25}
                color={variant === 'dark' ? 'white' : 'black'}
              />
            </RNBounceable>
          </View>
        </View>
        <View
          style={[layout.fullWidth, , layout.itemsCenter, layout.justifyCenter]}
        >
          <Text style={[fonts.gray800]}>Bid Amount</Text>
          {minBid !== 0 && (
            <Text
              style={[
                fonts.gray800,
                { opacity: 0.5, fontSize: 14, marginTop: 5 },
              ]}
            >
              Min. {minBid}
            </Text>
          )}
          <View
            style={[
              gutters.marginVertical_16,
              layout.row,
              layout.justifyBetween,
              gutters.marginTop_16,
              {
                width: '80%',
                height: 70,
              },
            ]}
          >
            <RNBounceable
              disabled={bid === minBid}
              onPress={() => {
                if (bid == 0 || bid <= minBid) {
                  return;
                }
                setBid(bid - 1);
              }}
              style={[
                borders.w_1,
                borders.rounded_16,
                ,
                layout.justifyCenter,
                layout.itemsCenter,
                {
                  width: '20%',
                  height: '90%',
                  borderColor: variant === 'dark' ? 'white' : 'black',
                  opacity: bid === minBid ? 0.5 : 1,
                },
              ]}
            >
              <Icons.FontAwesome5
                name="minus"
                size={25}
                color={variant === 'dark' ? 'white' : 'black'}
              />
            </RNBounceable>
            <View
              style={[
                borders.rounded_16,
                layout.justifyCenter,
                layout.itemsCenter,
                borders.w_1,
                {
                  width: '30%',
                  height: '90%',
                  borderColor: variant === 'dark' ? 'white' : 'black',
                },
              ]}
            >
              <TextInput
                placeholder="0"
                keyboardType="numeric"
                defaultValue={bid.toString()}
                onChange={(e) => {
                  const inputText = e.nativeEvent.text;
                  const parsedValue = parseInt(inputText, 10);
                  const newBid =
                    isNaN(parsedValue) || inputText === '' ? 0 : parsedValue;
                  if (newBid < minBid) {
                    toast.error(t('advertisement.bidError'));
                    setBid(minBid);
                    return;
                  }
                  setBid(newBid);
                }}
                style={[
                  layout.fullWidth,
                  layout.fullHeight,
                  fonts.alignCenter,
                  {
                    color: variant === 'dark' ? 'white' : 'black',
                  },
                ]}
              />
            </View>
            <RNBounceable
              onPress={() => {
                setBid(bid + 1);
              }}
              style={[
                borders.w_1,
                borders.rounded_16,
                layout.justifyCenter,
                layout.itemsCenter,
                {
                  width: '20%',
                  height: '90%',
                  borderColor: variant === 'dark' ? 'white' : 'black',
                },
              ]}
            >
              <Icons.FontAwesome5
                name="plus"
                size={25}
                color={variant === 'dark' ? 'white' : 'black'}
              />
            </RNBounceable>
          </View>
        </View>
        <Text
          style={[
            fonts.bold,
            fonts.size_24,
            fonts.gray800,
            gutters.marginBottom_12,
          ]}
        >
          {t('advertisement.boostHeading')}
        </Text>
        <View style={[layout.itemsCenter]}></View>
        <TouchableOpacity
          onPress={onSubmit}
          style={[
            layout.row,
            layout.itemsCenter,
            layout.justifyCenter,
            {
              backgroundColor: variant === 'dark' ? '#1E90FF' : '#007BFF',
              paddingVertical: 12,
              paddingHorizontal: 50,
              borderRadius: 8,
            },
          ]}
          disabled={loading}
        >
          <Text style={[fonts.bold, fonts.size_16, { color: '#FFFFFF' }]}>
            {loading
              ? t('advertisement.loading')
              : t('advertisement.boostButton')}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
