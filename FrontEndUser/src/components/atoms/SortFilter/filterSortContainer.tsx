import { View, Text } from 'react-native';
import React from 'react';
import useTheme from '@/theme/hooks/useTheme';

type Tprops = {
  children: React.ReactNode;
};

export default function filterSortContainer({ children }: Tprops) {
  const { layout, navigationTheme, borders, gutters } = useTheme();
  return (
    <View
      style={[
        layout.fullWidth,
        { height: 50 },
        { backgroundColor: navigationTheme.colors.border },
        { flexDirection: 'row' },
        borders.rounded_16,
        gutters.marginTop_12,
      ]}
    >
      {children}
    </View>
  );
}
