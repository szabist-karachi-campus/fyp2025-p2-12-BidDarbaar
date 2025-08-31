import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { CommonActions } from '@react-navigation/native';

import { useTheme } from '@/theme';
import { Brand } from '@/components/molecules';
import { SafeScreen } from '@/components/template';

import type { RootScreenProps } from '@/types/navigation';
import { logo, logoDark } from '../../../assets/images';
import { useStores } from '@/stores';

function Startup({ navigation }: RootScreenProps<'Startup'>) {
  const { layout, gutters, fonts, variant } = useTheme();
  const { t } = useTranslation(['startup']);
  const{auth}=useStores()
  const { isSuccess, isFetching, isError } = useQuery({
    queryKey: ['startup'],
    queryFn: () => {
      return Promise.resolve(true);
    },
  });
 
  useEffect(() => {
      if(auth.token&& !auth.isTokenExpired()){

        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'TabNavigator' }],
          }),
        );
      }else{

        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          }),
        );
      }
  }, []);
  
  return (
    <SafeScreen>
      <View
        style={[
          layout.flex_1,
          layout.col,
          layout.itemsCenter,
          layout.justifyCenter,
        ]}
      >
        <Image
          resizeMode="contain"
          src={variant === 'dark' ? logoDark : logo}
          style={{ height: 300, width: 300 }}
        />
        {isFetching && (
          <ActivityIndicator size="large" style={[gutters.marginVertical_24]} />
        )}
        {isError && (
          <Text style={[fonts.size_16, fonts.red500]}>
            {t('startup:error')}
          </Text>
        )}
      </View>
    </SafeScreen>
  );
}

export default Startup;
