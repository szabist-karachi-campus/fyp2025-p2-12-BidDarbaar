import { View, ViewStyle } from 'react-native';
import React from 'react';
import { useTheme } from '@/theme';

type TextInputBoxProps = {
  children: React.ReactNode;
};
export default function TextInputBox({ children, style }: TextInputBoxProps) {
  const { borders, gutters, layout } = useTheme();
  return (
    <View
      style={[
        borders.gray800,
        gutters.paddingHorizontal_12,
        layout.flex_1,
        layout.fullHeight,
        layout.row,
      ]}
    >
      {children}
    </View>
  );
}
