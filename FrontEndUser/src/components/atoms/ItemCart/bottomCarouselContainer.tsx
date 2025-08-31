import { View, Text } from 'react-native';
import React from 'react';
import { useTheme } from '@/theme';

type Tprops = {
  children: React.ReactNode;
};

export default function bottomCarouselContainer({ children }: Tprops) {
  const { layout, navigationTheme } = useTheme();

  return (
    <View
      style={[
        {
          height: 80,
          backgroundColor: navigationTheme.colors.border,
          paddingHorizontal: 20,
        },
        layout.row,
        layout.justifyCenter,
        layout.fullWidth,
      ]}
    >
      {children}
    </View>
  );
}
