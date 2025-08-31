import { View, Text } from 'react-native';
import React from 'react';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import RNBounceable from '@freakycoder/react-native-bounceable';
import { useTheme } from '@/theme';
import { ActivityIndicator } from 'react-native-paper';

type Tprop = {
  onPress: () => void;
  loading: boolean;
  disabled?: boolean;
};

export default function ForwardButton({ onPress, loading, disabled }: Tprop) {
  const { layout, gutters, borders, variant, fonts } = useTheme();
  if (loading) {
    return (
      <ActivityIndicator
        style={{ marginTop: 12 }}
        size={50}
        animating={true}
        color={variant === 'dark' ? 'white' : 'black'}
      />
    );
  }
  return (
    <View
      style={[
        layout.justifyCenter,
        layout.fullWidth,
        gutters.marginTop_12,
        borders.roundedBottom_16,
        layout.itemsCenter,
      ]}
    >
      <RNBounceable disabled={disabled} onPress={onPress}>
        <FontAwesome5
          name="arrow-circle-right"
          size={50}
          color={variant === 'dark' ? 'white' : 'black'}
        />
      </RNBounceable>
    </View>
  );
}
