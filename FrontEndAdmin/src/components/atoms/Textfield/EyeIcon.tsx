import { View } from 'react-native';
import React from 'react';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { useTheme } from '@/theme';

type Tprop = {
  secure: boolean;
  setSecure: React.Dispatch<React.SetStateAction<boolean>>;
};
export default function EyeIcon({ secure, setSecure }: Tprop) {
  const { variant, layout } = useTheme();

  return (
    <View
      style={[
        {
          width: 50,
          height: 50,
        },
        layout.justifyCenter,
        layout.itemsCenter,
      ]}
    >
      <FontAwesome5
        onPress={() => setSecure(!secure)}
        name={!secure ? 'eye' : 'eye-slash'}
        color={variant === 'dark' ? 'white' : 'black'}
        size={25}
      />
    </View>
  );
}
