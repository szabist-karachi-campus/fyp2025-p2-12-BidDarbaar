import { View, Text, StyleProp, ViewStyle } from 'react-native';
import React from 'react';
import {
  BottomCarousel,
  BottomCarouselContainer,
  Carousel,
  CarouselContainer,
  Countdown,
  DescriptionBox,
  FavoriteButton,
  TopCarousel,
} from '@/components/atoms';
import useTheme from '@/theme/hooks/useTheme';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Ionicons from 'react-native-vector-icons/Ionicons';

type Tprops = {
  isLiked: boolean;
  setIsLiked?: () => void;
  item: any;
  style?: StyleProp<ViewStyle>;
  onPress: () => void;
  isAd?: boolean;
  wonItem?: {
    status: string;
    winDate: string;
  };
};

export default function index({
  item,
  isLiked,
  setIsLiked,
  onPress,
  isAd,
  wonItem,
  style,
}: Tprops) {
  const { layout, gutters, borders, variant, colors, navigationTheme, fonts } =
    useTheme();

  return (
    <CarouselContainer style={style} isAd={isAd} onPress={onPress}>
      <TopCarousel>
        <Countdown
          wonItem={wonItem}
          timeLeft={{
            BiddingDate: item.BiddingDate,
            BiddingStartTime: item.BiddingStartTime,
            BiddingEndTime: item.BiddingEndTime,
          }}
        />
        {isAd && (
          <View
            style={[
              {
                backgroundColor: 'tomato',
                right: 50,
              },
              borders.rounded_16,
              layout.justifyCenter,
              gutters.paddingHorizontal_12,
            ]}
          >
            <Text style={[fonts.bold, { color: 'white', fontSize: 12 }]}>
              <Ionicons
                name="star"
                color={variant === 'dark' ? 'white' : 'black'}
                size={12}
              />
              {'  '}Featured
            </Text>
          </View>
        )}
        {!wonItem && (
          <FavoriteButton setIsLiked={setIsLiked} isLiked={isLiked} />
        )}
      </TopCarousel>
      <DescriptionBox title={item.title} description={item.description} />
      <Carousel item={item} />
      <BottomCarouselContainer>
        <BottomCarousel wonItem={wonItem} data={item} />
      </BottomCarouselContainer>
    </CarouselContainer>
  );
}
