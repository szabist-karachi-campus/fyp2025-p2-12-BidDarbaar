import { StyleProp, Text, TextStyle, View, ViewStyle } from 'react-native';
import React from 'react';
import RNBounceable from '@freakycoder/react-native-bounceable';
import { useTheme } from '@/theme';
import FontAwesome5Icon from 'react-native-vector-icons/FontAwesome5';
import { ActivityIndicator } from 'react-native-paper';
type TProps = {
  title: string;
  onPress: () => void;
  containerStyle?: StyleProp<ViewStyle>;
  fontStyle?: StyleProp<TextStyle>;
  children?: React.ReactNode;
  right?: string | React.ReactNode;
  left?: string | React.ReactNode;
  iconColor?: string;
  loading?: boolean;
};

export default function Button({
  title,
  onPress,
  containerStyle,
  fontStyle,
  children,
  right,
  left,
  iconColor,
  loading,
}: TProps) {
  const { layout, borders, fonts, backgrounds, gutters, variant } = useTheme();
  return (
    <RNBounceable
      style={[
        { width: '100%', height: 50 },
        backgrounds.gray100,
        layout.justifyCenter,
        layout.itemsCenter,
        borders.w_1,
        borders.rounded_16,
        borders.gray800,
        gutters.marginBottom_12,
        containerStyle,
      ]}
      disabled={loading}
      onPress={onPress}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'dark' ? 'white' : 'black'} />
      ) : children ? (
        children
      ) : (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <View>
            {left && typeof left === 'string' ? (
              <FontAwesome5Icon
                name={left}
                size={20}
                color={
                  iconColor ? iconColor : variant === 'dark' ? 'white' : 'black'
                }
                style={{ marginRight: 10 }}
              />
            ) : (
              left
            )}
          </View>
          <Text style={[{ fontSize: 20 }, fonts.gray800, fontStyle]}>
            {title}
          </Text>
          <View>
            {right && typeof right === 'string' ? (
              <FontAwesome5Icon
                name={right}
                size={20}
                color={
                  iconColor ? iconColor : variant === 'dark' ? 'white' : 'black'
                }
                style={{ marginLeft: 10 }}
              />
            ) : (
              right
            )}
          </View>
        </View>
      )}
    </RNBounceable>
  );
}
