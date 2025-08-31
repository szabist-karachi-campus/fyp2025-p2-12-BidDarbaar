import { View, Text } from 'react-native';
import React from 'react';
import { useTheme } from '@/theme';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

type TProps = {
  iconName?: string;
};

export default function Icon({ iconName }: TProps) {
  const { layout, borders, variant } = useTheme();
  return (
    <View
      style={[
        {},
        layout.fullHeight,
        borders.gray800,
        layout.justifyCenter,
        layout.itemsCenter,
      ]}
    >
      <FontAwesome5
        name={iconName ?? 'user'}
        size={20}
        color={variant === 'dark' ? 'white' : 'black'}
      />
    </View>
  );
}
