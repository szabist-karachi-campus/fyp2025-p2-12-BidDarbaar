import { View } from 'react-native';
import React from 'react';
import { useTheme } from '@/theme';

type IconBoxProps = {
  children: React.ReactNode;
};
export default function IconBox({ children }: IconBoxProps) {
  const { layout, borders } = useTheme();
  return (
    <View
      style={[
        {
          flex: 0.2,
        },
        layout.fullHeight,
        borders.gray800,
        borders.wRight_1,
        layout.justifyCenter,
        layout.itemsCenter,
      ]}
    >
      {children}
    </View>
  );
}
