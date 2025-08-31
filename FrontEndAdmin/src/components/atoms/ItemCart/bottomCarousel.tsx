import { useTheme } from '@/theme';
import React, { Component } from 'react';
import { Text, View } from 'react-native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

type Tprop = {
  data: any;
};

export default function bottomCarousel({ data }: Tprop) {
  const { fonts, navigationTheme, layout, gutters, variant, borders } =
    useTheme();
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

    return `${day}${suffix} ${month} ${year}`;
  };
  return (
    <View
      style={[
        {
          height: 100,
        },
        layout.row,
        layout.justifyCenter,
        layout.fullWidth,
      ]}
    >
      <View style={[layout.flex_1, { width: '100%' }]}>
        <View style={[{ flexDirection: 'row', marginTop: 10 }]}>
          <MaterialCommunityIcons
            name="currency-rupee"
            size={20}
            color={variant === 'dark' ? 'white' : 'black'}
          >
            <Text
              style={[fonts.gray800, fonts.bold, { fontSize: 20 }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {data.startingBid}
            </Text>
          </MaterialCommunityIcons>
        </View>
        <View style={[{ flexDirection: 'row', marginTop: 10 }]}>
          <FontAwesome5
            name="calendar-alt"
            color={variant === 'dark' ? 'white' : 'black'}
            size={20}
          >
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={[fonts.gray800, fonts.bold, { fontSize: 20 }]}
            >
              {' '}
              {formatShortDate(data.BiddingDate)}
            </Text>
          </FontAwesome5>
        </View>
      </View>

      <View style={[layout.flex_1, { width: '100%', marginLeft: 10 }]}>
        <View style={[{ flexDirection: 'row', marginTop: 10 }]}>
          <FontAwesome5
            name="hourglass-start"
            color={variant === 'dark' ? 'white' : 'black'}
            size={20}
          >
            <Text style={[fonts.gray800, fonts.bold, { fontSize: 20 }]}>
              {'   '}
              {formatTime(data.BiddingStartTime)}{' '}
            </Text>
          </FontAwesome5>
        </View>
        <View style={[{ flexDirection: 'row', marginTop: 10 }]}>
          <FontAwesome5
            name="hourglass-end"
            color={variant === 'dark' ? 'white' : 'black'}
            size={20}
          >
            <Text style={[fonts.gray800, fonts.bold, { fontSize: 20 }]}>
              {'   '}
              {formatTime(data.BiddingEndTime)}{' '}
            </Text>
          </FontAwesome5>
        </View>
      </View>
    </View>
  );
}
