import { View, Text } from 'react-native';
import React from 'react';
import RNBounceable from '@freakycoder/react-native-bounceable';
import { useTheme } from '@/theme';

type Tprops = {
  children: React.ReactNode;
  selectedItem?: any;
  isOpened?: boolean;
};

export default function filterContainer({
  children,
  selectedItem,
  isOpened,
}: Tprops) {
  const { layout, borders } = useTheme();
  return (
    <RNBounceable style={[layout.flex_1, layout.itemsCenter]}>
      {children}
    </RNBounceable>
  );
}
