import { View, Text, StyleSheet } from 'react-native';
import React from 'react';
import { useTheme } from '@/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type Tprops = {
  item: any;
  index: number;
  isSelected: boolean;
};

export default function itemDropDown({ item, index, isSelected }: Tprops) {
  const { navigationTheme, variant } = useTheme();
  return (
    <View
      style={{
        ...styles.dropdownItemStyle,
        backgroundColor: navigationTheme.colors.border,
        ...(isSelected && {}),
      }}
    >
      <Icon
        name={item.icon}
        style={styles.dropdownItemIconStyle}
        color={variant === 'dark' ? 'white' : 'black'}
      />
      <Text
        style={[
          styles.dropdownItemTxtStyle,
          { color: variant === 'dark' ? 'white' : 'black' },
        ]}
      >
        {item.title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  dropdownButtonStyle: {
    width: 200,
    height: 50,
    backgroundColor: '#E9ECEF',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  dropdownButtonTxtStyle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '500',
    color: '#151E26',
  },
  dropdownButtonArrowStyle: {
    fontSize: 28,
  },
  dropdownButtonIconStyle: {
    fontSize: 28,
    marginRight: 8,
  },
  dropdownMenuStyle: {
    backgroundColor: '#E9ECEF',
    borderRadius: 8,
  },
  dropdownItemStyle: {
    width: '100%',
    flexDirection: 'row',
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  dropdownItemTxtStyle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '500',
    color: '#151E26',
  },
  dropdownItemIconStyle: {
    fontSize: 28,
    marginRight: 8,
  },
});
