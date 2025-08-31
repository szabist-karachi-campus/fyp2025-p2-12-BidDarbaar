import type { RootScreenProps } from '@/navigation/types';

import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Image, Text, View } from 'react-native';

import { useTheme } from '@/theme';
import { Paths } from '@/navigation/paths';

import { SafeScreen } from '@/components/templates';
import { useStores } from '@/stores';
import { logo, logoDark } from '../../../images';

function isSessionValid({
  loggedInDate,
  expireAt,
}: {
  loggedInDate: Date;
  expireAt: string;
}) {
  const loggedDate = new Date(loggedInDate);
  const num = parseInt(expireAt);
  const unit = expireAt.slice(-1);

  const expiryDate = new Date(loggedDate);

  switch (unit) {
    case 'd':
      expiryDate.setDate(loggedDate.getDate() + num);
      break;
    case 'm':
      expiryDate.setMonth(loggedDate.getMonth() + num);
      break;
    case 'y':
      expiryDate.setFullYear(loggedDate.getFullYear() + num);
      break;
    default:
      throw new Error("Invalid format. Use 'd', 'm', or 'y'.");
  }

  const currentDate = new Date();

  return currentDate <= expiryDate;
}
function Startup({ navigation }: RootScreenProps<Paths.Startup>) {
  const { layout, gutters, fonts, variant } = useTheme();
  const { t } = useTranslation();
  const { auth } = useStores();

  const { isSuccess, isFetching, isError } = useQuery({
    queryKey: ['startup'],
    queryFn: () => {
      return Promise.resolve(true);
    },
  });

  useEffect(() => {
    if (isSuccess) {
      console.log('auth token', auth.token);
      console.log('auth expireAt', auth.expiresAt);
      console.log('auth loggedInAt', auth.loggedInAt.toString());

      if (auth.token.length > 4) {
        if (
          isSessionValid({
            loggedInDate: auth.loggedInAt,
            expireAt: auth.expiresAt,
          })
        ) {
          navigation.reset({
            index: 0,
            routes: auth.superAdmin
              ? [{ name: Paths.SuperBottomTab }]
              : [{ name: Paths.BottomTab }],
          });
        } else {
          navigation.reset({
            index: 0,
            routes: [{ name: Paths.Login }],
          });
        }
      } else {
        navigation.reset({
          index: 0,
          routes: [{ name: Paths.Login }],
        });
      }
    }
  }, [isSuccess, navigation]);

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
          resizeMode={'contain'}
          style={{ height: 300, width: 300 }}
          source={variant === 'dark' ? logoDark : logo}
        />

        {isFetching && (
          <ActivityIndicator size="large" style={[gutters.marginVertical_24]} />
        )}
        {isError && (
          <Text style={[fonts.size_16, fonts.red500]}>{t('common_error')}</Text>
        )}
      </View>
    </SafeScreen>
  );
}

export default Startup;
