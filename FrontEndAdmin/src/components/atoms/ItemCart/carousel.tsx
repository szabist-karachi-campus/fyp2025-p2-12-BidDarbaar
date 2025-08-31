import { useTheme } from '@/theme';
import React from 'react';
import { Image, Text, View, ViewStyle } from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import { logo } from '../../../../images';
import { useSharedValue } from 'react-native-reanimated';

type Tprop = {
  item: any;
  style?: ViewStyle;
};

export default function mainCarousel({ item, style }: Tprop) {
  const scrollOffsetValue = useSharedValue<number>(0);

  const { layout, borders } = useTheme();

  const emojisWithIcons = [
    { title: 'Automobile', icon: 'emoticon-happy-outline' },
    { title: 'Electronics', icon: 'emoticon-cool-outline' },
    { title: 'Crockery', icon: 'emoticon-lol-outline' },
    { title: 'sad', icon: 'emoticon-sad-outline' },
    { title: 'cry', icon: 'emoticon-cry-outline' },
    { title: 'angry', icon: 'emoticon-angry-outline' },
    { title: 'confused', icon: 'emoticon-confused-outline' },
    { title: 'excited', icon: 'emoticon-excited-outline' },
    { title: 'kiss', icon: 'emoticon-kiss-outline' },
    { title: 'devil', icon: 'emoticon-devil-outline' },
    { title: 'dead', icon: 'emoticon-dead-outline' },
    { title: 'wink', icon: 'emoticon-wink-outline' },
    { title: 'sick', icon: 'emoticon-sick-outline' },
    { title: 'frown', icon: 'emoticon-frown-outline' },
  ];

  return (
    <Carousel
      testID={'xxx'}
      loop={true}
      width={400}
      height={200}
      snapEnabled={true}
      pagingEnabled={true}
      autoPlayInterval={2000}
      data={item.avatar}
      defaultScrollOffsetValue={scrollOffsetValue}
      style={[{ width: '100%', marginTop: 20 }]}
      renderItem={({ item, index }) => (
        <View
          style={[
            layout.flex_1,
            layout.justifyCenter,
            style && style,
            borders.roundedTop_16,
            { overflow: 'hidden' },
          ]}
        >
          <Image
            style={[layout.fullHeight, layout.fullWidth]}
            source={item ? { uri: item } : logo}
            resizeMode="stretch"
          />
        </View>
      )}
    />
  );
}
