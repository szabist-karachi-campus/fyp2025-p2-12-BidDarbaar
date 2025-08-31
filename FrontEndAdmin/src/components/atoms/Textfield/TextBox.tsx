import { View } from 'react-native';
import React, { PropsWithChildren } from 'react';
import { useTheme } from '@/theme';
type TextBoxProps = {
  children: React.ReactNode;
};
export default function TextBox({ children }: TextBoxProps) {
  const { layout, borders } = useTheme();
  return (
    <View
      style={[
        {
          height: 50,
          width: '80%',
        },
        borders.gray800,
        borders.rounded_16,
        borders.w_1,
        layout.row,
      ]}
    >
      {children}
    </View>
  );
}
