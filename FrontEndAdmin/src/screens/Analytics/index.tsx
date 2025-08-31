import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '@/theme';
import { useGetAnalytics } from '@/queries/user.queries';
import { useStores } from '@/stores';
import { ActivityIndicator } from 'react-native-paper';

const AnalyticsScreen = () => {
  const { auth } = useStores();
  const { data: analytics,isPending } = useGetAnalytics(auth.token);
  const { variant } = useTheme();

if(isPending||!analytics){
    return (
      <View style={{justifyContent:"center",flex:1,alignItems:"center",}}>
        <ActivityIndicator size="large" color={variant === 'dark' ? '#fff' : '#000'} />
        <Text style={{ color: variant === 'dark' ? '#fff' : '#000' ,marginTop:20}}>Loading...</Text>
      </View>
    );
  }
  const {
    totalRevenue,
    totalItemSold,
    totalItemsDelievered,
    orderCancelled,
    successRate,
    activeAds,
    adClicks,
    adSpent,
  } = analytics.data;

  const data = [
    {
      title: 'Total Revenue',
      icon: 'attach-money',
      value: `PKR ${totalRevenue?.toLocaleString() || 0}`,
      color: '#4CAF50',
    },
    {
      title: 'Orders',
      icon: 'inventory',
      value: `${totalItemSold || 0}`,
      color: '#1976D2',
    },
    {
      title: 'Delivered',
      icon: 'local-shipping',
      value: `${totalItemsDelievered || 0}`,
      color: '#388E3C',
    },
    {
      title: 'Cancelled',
      icon: 'cancel',
      value: `${orderCancelled || 0}`,
      color: '#D32F2F',
    },
    {
      title: 'Success Rate',
      icon: 'check-circle',
      value: `${(successRate || 0).toFixed(1)}%`,
      color: '#009688',
    },
    {
      title: 'Active Ads',
      icon: 'campaign',
      value: `${activeAds || 0}`,
      color: '#FFC107',
    },
    {
      title: 'Ad Clicks',
      icon: 'mouse',
      value: `${adClicks || 0}`,
      color: '#7B1FA2',
    },
    {
      title: 'Ad Spend',
      icon: 'monetization-on',
      value: `PKR ${adSpent?.toLocaleString() || 0}`,
      color: '#F57C00',
    },
  ];
  
  

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.grid}>
        {data.map((card, index) => (
          <View key={index} style={[styles.card, { backgroundColor: card.color }]}>
            <MaterialIcons name={card.icon} size={32} color="white" />
            <Text style={styles.cardTitle}>{card.title}</Text>
            <Text style={styles.cardValue}>{card.value}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

export default AnalyticsScreen;

const numColumns = 2;
const cardWidth = Dimensions.get('window').width / numColumns - 30;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
    paddingBottom: 40,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: cardWidth,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 14,
    color: '#fff',
    marginTop: 8,
  },
  cardValue: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
    marginTop: 4,
  },
});