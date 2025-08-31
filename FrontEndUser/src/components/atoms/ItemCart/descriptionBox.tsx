import { useTheme } from '@/theme';
import React from 'react';
import { Text } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

type Tprop = {
  description: string;
  title: string;
};

export default function countDown({ description, title }: Tprop) {
  const { fonts, variant, borders } = useTheme();

  return (
    <LinearGradient
      colors={
        variant === 'dark'
          ? ['rgba(39, 39, 41, 0.6)', 'rgb(20, 20, 22)']
          : ['rgba(216, 216, 216, 0.6)', 'rgb(180, 180, 180)']
      }
      style={[
        {
          position: 'absolute',
          zIndex: 10000,
          bottom: 82,
          left: 5,
          padding: 6,
          width: '65%',
        },
        borders.rounded_16,
      ]}
    >
      <Text
        numberOfLines={1}
        style={[
          fonts.gray800,
          fonts.size_12,
          variant === 'default' && { color: '#000' },
          { textTransform: 'uppercase' },
          fonts.bold,
        ]}
      >
        {title}
      </Text>

      <Text
        numberOfLines={3}
        style={[
          fonts.gray800,
          fonts.size_12,
          variant === 'default' && { color: '#000' },
        ]}
      >
        {description}
      </Text>
    </LinearGradient>
  );
}
