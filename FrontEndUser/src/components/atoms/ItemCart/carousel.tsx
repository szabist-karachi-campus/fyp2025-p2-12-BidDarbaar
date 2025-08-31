import { useTheme } from '@/theme';
import React from 'react';
import { Image, Text, View, ViewStyle } from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import { logo } from '../../../../assets/images';
import { useSharedValue } from 'react-native-reanimated';

type Tprop = {
  item: any;
  style?: ViewStyle;
};

export default function mainCarousel({ item, style }: Tprop) {
  const scrollOffsetValue = useSharedValue<number>(0);

  const { layout } = useTheme();
  console.log('item', item);
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
      style={[{ width: '100%' }]}
      renderItem={({ item, index }) => (
        <View style={[layout.flex_1, layout.justifyCenter, style && style]}>
          <Image
            style={[layout.fullHeight, layout.fullWidth]}
            source={item ? { uri: item } : logo}
            resizeMode="cover"
          />
        </View>
      )}
    />
  );
}
