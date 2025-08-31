import { View, Text } from 'react-native';
import React from 'react';
import FontAwesome5Icon from 'react-native-vector-icons/FontAwesome5';
import { useTheme } from '@/theme';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

type Tprops = {
  iconName: string;
};

export default function filter({ iconName }: Tprops) {
  const { gutters } = useTheme();
  return (
    <MaterialIcons
      name={iconName}
      size={40}
      color="white"
      style={[{ marginTop: 2 }]}
    />
  );
}
