import { View, Text, ScrollView, ActivityIndicator, Modal } from 'react-native';
import React, { useEffect, useState } from 'react';
import { RootStackParamList } from '@/navigation/types';
import { StackNavigationProp } from '@react-navigation/stack';
import { Paths } from '@/navigation/paths';
import { useNavigation } from '@react-navigation/native';
import {
  useGetAllOrders,
  useRegisterAgent,
} from '@/queries/delivery.queries';
import { useStores } from '@/stores';
import { useTheme } from '@/theme';
import RNBounceable from '@freakycoder/react-native-bounceable';
import FontAwesome5Icon from 'react-native-vector-icons/FontAwesome5';
import * as Yup from 'yup';
import { useTranslation } from 'react-i18next';
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { toast } from '@backpackapp-io/react-native-toast';
import { FontAwesome5, TextField } from '@/components/molecules';
type DeliveryScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  Paths.delivery
>;

export default function Delivery() {
  const navigation = useNavigation<DeliveryScreenNavigationProp>();
  const { auth } = useStores();
  const { t } = useTranslation();
  const { data, isError, isFetching, refetch } = useGetAllOrders({
    token: auth.token,
  });
  const { mutateAsync, isPending } = useRegisterAgent();
  const [isUserAdding, setIsUserAdding] = useState(false);

  const {
    layout,
    gutters,
    fonts,
    borders,
    variant,
  } = useTheme();
  const validationSignupSchema = Yup.object({
    name: Yup.string()
      .trim()
      .required(t('inUse.name'))
      .min(3, t('inUse.nameLength'))
      .max(64, t('inUse.nameLength')),

    phoneNumber: Yup.string()
      .trim()
      .required(t('inUse.phoneReq'))
      .min(10, t('inUse.phoneLength'))
      .matches(/^(\+92|03)\d{9}$/, t('inUse.phoneFormat')),
  });
  const Fields = [
    {
      iconName: 'user-alt',
      placeHolder: 'name',
      key: 'name',
    },
    {
      iconName: 'phone',
      placeHolder: 'Phone Number',
      keyboardType: 'phone-pad',
      key: 'phoneNumber',
    },
  ];
  const {
    control,
    handleSubmit,
    resetField,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      phoneNumber: '',
    },
    resolver: yupResolver(validationSignupSchema),
    mode: 'onChange',
  });

  const onSubmit = handleSubmit(async (data) => {
    try {
      const response = await mutateAsync({
        token: auth.token,
        name: data.name,
        phone: data.phoneNumber,
      });
      if (response) {
        toast.success('Items Added Successfully');

        setIsUserAdding(false);
        resetField('name');
        resetField('phoneNumber');
      }
      setIsUserAdding(false);
    } catch (error) {
      toast.error('error creating user');
    }
  });
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <RNBounceable
          onPress={async () => {
            setIsUserAdding(!isUserAdding);
          }}
          style={[gutters.marginRight_24, layout.justifyCenter]}
        >
          {isUserAdding ? (
            <Text style={[fonts.gray800]}>CANCEL</Text>
          ) : (
            <FontAwesome5Icon
              name={'plus'}
              size={25}
              color={variant === 'dark' ? 'white' : 'black'}
            />
          )}
        </RNBounceable>
      ),
    });
  }, [isUserAdding]);
  if (isFetching) {
    return (
      <View style={[layout.flex_1, layout.itemsCenter]}>
        <Text style={[fonts.size_24, fonts.alignCenter, fonts.gray800]}>
          Loading...
        </Text>
      </View>
    );
  }
  console.log('data', data);

  if (isError) {
    refetch();
    return (
      <View style={[layout.flex_1, layout.itemsCenter]}>
        <Text style={[fonts.size_24, fonts.red500]}>Error fetching data</Text>
      </View>
    );
  }
  let orders = data?.orders.reverse() || [];
  return (
    <ScrollView style={[gutters.paddingHorizontal_16, gutters.marginTop_12]}>
      {orders.map(
        (order: any) => (
          console.log('order', order),
          (
            <RNBounceable
              onPress={() => {
                navigation.navigate(Paths.deliveryOverView, {
                  id: order.auctionItem,
                });
              }}
              key={order._id}
              style={[
                {
                  backgroundColor: variant === 'dark' ? '#1f1f1f' : '#ffffff',
                  borderColor: variant === 'dark' ? '#333' : '#ddd',
                  borderWidth: 1,
                  shadowColor: variant === 'dark' ? '#000' : '#ddd',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.25,
                  shadowRadius: 3.84,
                  elevation: 2,
                },
                gutters.padding_16,
                gutters.marginBottom_16,
                borders.rounded_16,
              ]}
            >
              <Text style={[{ fontSize: 18 }, fonts.bold, fonts.gray800]}>
                🚚 Order ID: {order._id}
              </Text>

              <View style={gutters.marginTop_16}>
                <Text style={[fonts.gray400, fonts.size_16]}>
                  📦 Status: {order.status}
                </Text>
                <Text style={[fonts.gray400, fonts.size_16, { marginTop: 8 }]}>
                  🛒 Auction Item: {order.auctionItem?.name}{' '}
                </Text>
                <Text style={[fonts.gray400, fonts.size_16, { marginTop: 8 }]}>
                  👤 Assigned Agent:{' '}
                  {order.assignedAgent ? order.assignedAgent : 'None'}
                </Text>
                <Text style={[fonts.gray400, fonts.size_16, { marginTop: 8 }]}>
                  🕒 Created At:{' '}
                  {new Date(order.createdAt).toLocaleString('en-US')}
                </Text>
              </View>
            </RNBounceable>
          )
        ),
      )}
      <Modal
        visible={isUserAdding}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setIsUserAdding(!isUserAdding);
        }}
      >
        <View
          style={[
            { backgroundColor: 'rgba(0,0,0,0.5)', flex: 1 },
            layout.fullWidth,
            layout.itemsCenter,
            layout.justifyCenter,
          ]}
        >
          <View
            style={{
              width: '90%',
              backgroundColor: 'black',
              borderRadius: 16,
              alignItems: 'center',
              paddingVertical: 20,
            }}
          >
            <View style={{ width: '100%', alignItems: 'center' }}>
              <Text
                style={[
                  fonts.gray800,
                  fonts.size_24,
                  gutters.marginVertical_24,
                ]}
              >
                ADD USER
              </Text>
              <FontAwesome5
                onPress={() => {
                  setIsUserAdding(!isUserAdding);
                }}
                name="times"
                size={25}
                color="white"
                style={{ position: 'absolute', right: 20, top: 20 }}
              />
            </View>
            {Fields.map((a, index) => {
              if (data === 'superAdmin') {
                return null;
              }
              return (
                <Controller
                  key={a.key}
                  control={control}
                  name={a.key as any}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View key={a.key + index} style={[gutters.marginBottom_12]}>
                      <TextField
                        error={errors[a.key as 'name' | 'phoneNumber']?.message}
                        handleChange={onChange}
                        onBlur={onBlur}
                        value={value}
                        key={a.key}
                        placeholder={a.placeHolder}
                        keyboardType={'default'}
                        iconName={a.iconName}
                      />
                    </View>
                  )}
                />
              );
            })}
            <RNBounceable
              disabled={isPending}
              onPress={onSubmit}
              style={[
                gutters.padding_16,
                borders.rounded_16,
                layout.itemsCenter,
                gutters.marginTop_24,
                {
                  backgroundColor: 'tomato',
                },
              ]}
            >
              {isPending ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={[fonts.bold, { color: 'white' }]}>Add Agent</Text>
              )}
            </RNBounceable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
