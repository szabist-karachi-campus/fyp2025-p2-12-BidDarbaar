import { View, Text } from 'react-native';
import React from 'react';
import { useTheme } from '@/theme';

type Tprops = {
  children: React.ReactNode;
};

export default function topCarousel({ children }: Tprops) {
  const { layout, gutters } = useTheme();
  return (
    <View
      style={[
        {
          position: 'absolute',
          zIndex: 1000,
          minHeight: 25,
        },
        layout.row,
        layout.justifyBetween,
        gutters.paddingHorizontal_16,
        gutters.marginTop_16,
        layout.fullWidth,
      ]}
    >
      {children}
    </View>
  );
}
