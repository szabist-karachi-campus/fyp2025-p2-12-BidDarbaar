import { useTheme } from '@/theme';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';

const NoConnection = () => {
  const {
    colors,
    variant,
    changeTheme,
    layout,
    gutters,
    fonts,
    components,
    backgrounds,
  } = useTheme();
  const { t } = useTranslation(['noConnection']);

  return (
    <View style={styles.container}>
      <Icon name="wifi-off" size={200} color="red" style={styles.icon} />
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        style={[fonts.size_32, fonts.bold]}
      >
        {t('title')}
      </Text>
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        style={[fonts.size_40, fonts.size_16, gutters.marginTop_12]}
      >
        {t('subtitle')}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  icon: {
    marginBottom: 20,
  },
  titleText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  subText: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
  },
});

export default NoConnection;
