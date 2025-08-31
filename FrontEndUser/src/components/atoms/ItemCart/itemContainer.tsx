import { View, Text, StyleProp, ViewStyle } from 'react-native';
import React from 'react';
import RNBounceable from '@freakycoder/react-native-bounceable';
import { useTheme } from '@/theme';

type TProps = {
  children: React.ReactNode;
  onPress: () => void;
  isAd?: boolean;
  style?: StyleProp<ViewStyle>;
};

export default function itemContainer({
  children,
  onPress,
  isAd,
  style,
}: TProps) {
  const { gutters, borders } = useTheme();
  return (
    <RNBounceable
      onPress={onPress}
      style={[
        style,
        {
          width: '90%',
          alignSelf: 'center',
          overflow: 'hidden',
          marginTop: 20,
        },
        borders.rounded_16,
        isAd && {
          borderWidth: 1,
          borderColor: 'tomato',
        },
      ]}
    >
      {children}
    </RNBounceable>
  );
}
