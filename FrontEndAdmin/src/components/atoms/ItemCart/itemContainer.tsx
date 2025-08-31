import { View, Text } from 'react-native';
import React from 'react';
import RNBounceable from '@freakycoder/react-native-bounceable';
import { useTheme } from '@/theme';

type TProps = {
  children: React.ReactNode;
  onPress: () => void;
  isAd?: boolean;
};

export default function itemContainer({ children, onPress,isAd }: TProps) {
  const { gutters, borders } = useTheme();
  return (
    <RNBounceable
      onPress={onPress}
      style={[
        {
          width: '95%',
          alignSelf: 'center',
          overflow: 'hidden',
          
        },
        borders.rounded_16,

        isAd&&{
          borderWidth:1,borderColor:"#3B82F7",


        }
      ]}
    >
      {children}
    </RNBounceable>
  );
}
