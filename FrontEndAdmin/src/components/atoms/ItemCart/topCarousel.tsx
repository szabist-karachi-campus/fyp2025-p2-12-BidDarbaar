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
        },
        layout.row,
        layout.justifyBetween,
        gutters.paddingHorizontal_16,
        layout.fullWidth,
        { top: 25 },
      ]}
    >
      {children}
    </View>
  );
}
