import {
  View,
  Text,
  Modal,
  ActivityIndicator,
} from 'react-native';
import React, { useState, useEffect } from 'react';
import { SafeScreen } from '@/components/templates';
import {
  useCreateSuperAdmin,
  useGetSuperAdmin,
} from '@/queries/superAdmin.queries';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@/theme';
import { FontAwesome5, TextField } from '@/components/molecules';
import RNBounceable from '@freakycoder/react-native-bounceable';
import { FlashList } from '@shopify/flash-list';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/navigation/types';
import { Paths } from '@/navigation/paths';
import { useStores } from '@/stores';
import { useTranslation } from 'react-i18next';
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import { toast } from '@backpackapp-io/react-native-toast';
import FontAwesome5Icon from 'react-native-vector-icons/FontAwesome5';

type SuperAdminCreateNavigationProp = StackNavigationProp<
  RootStackParamList,
  Paths.SuperAdminCreate
>;

export default function SuperUser() {
  const navigation = useNavigation<SuperAdminCreateNavigationProp>();
  const { backgrounds, fonts, borders, layout, gutters, variant } = useTheme();
  const { auth, superAdmin } = useStores();
  const { data, isError, status, refetch } = useGetSuperAdmin({
    token: auth.token,
  });
  const { mutateAsync, isPending } = useCreateSuperAdmin();
  const [loading, setLoading] = useState<boolean>(false);
  const { t } = useTranslation();
  const [isUserAdding, setIsUserAdding] = useState(false);

  const Fields: Field[] = [
    {
      iconName: 'user-alt',
      placeHolder: t('inUse.firstName'),
      key: 'firstName',
    },
    {
      iconName: 'user-alt',
      placeHolder: t('inUse.lastName'),
      key: 'lastName',
    },
    {
      iconName: 'at',
      placeHolder: t('textFieldLabel.email'),
      keyboardType: 'email-address',
      key: 'email',
    },

    {
      iconName: 'lock',
      placeHolder: t('textFieldLabel.password'),
      keyboardType: 'default',
      secure: true,
      key: 'password',
    },
    {
      iconName: 'lock',
      placeHolder: t('confirmPass'),
      keyboardType: 'default',
      secure: true,
      key: 'confirmPassword',
    },
  ];

  const superAdminCreateSchema = Yup.object({
    firstName: Yup.string()
      .trim()
      .required(t('inUse.firstName'))
      .min(3, t('inUse.nameLength'))
      .max(64, t('inUse.nameLength')),
    lastName: Yup.string()
      .trim()
      .required(t('inUse.firstName'))
      .min(3, t('inUse.nameLength'))
      .max(64, t('inUse.nameLength')),
    email: Yup.string()
      .transform((value) => value.toLowerCase().trim())
      .email(t('inUse.validEmail'))
      .required(t('inUse.emailReq')),
    password: Yup.string()
      .trim()
      .min(8, t('inUse.passLength'))
      .required(t('inUse.password')),
    confirmPassword: Yup.string()
      .trim()
      .required(t('inUse.confirmPass'))
      .oneOf([Yup.ref('password')], t('inUse.passMatch')),
  });

  const {
    control,
    handleSubmit,
    resetField,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    resolver: yupResolver(superAdminCreateSchema),
    mode: 'onChange',
  });

  const onSubmit = handleSubmit(async (data) => {
    const values: createSuperAdminRequest = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: data.password,
      confirmPassword: data.confirmPassword,
      token: auth.token,
    };
    try {
      const response = await mutateAsync(values);
      if (response) {
        toast.success('Items Added Successfully');

        setIsUserAdding(false);
        resetField('firstName');
        resetField('lastName');
        resetField('email');
        resetField('password');
        resetField('confirmPassword');
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

  const renderUserCard = (user: superAdmin) => {
    return (
      <RNBounceable
        style={{
          flex: 1,
          borderWidth: 0,
          borderColor: 'red',
          paddingHorizontal: 10,
        }}
      >
        <View
          style={[
            backgrounds.gray100,
            layout.row,
            layout.fullWidth,
            gutters.marginTop_24,
            borders.rounded_16,
            {
              height: 75,
            },
          ]}
        >
          <View
            style={[
              layout.justifyCenter,
              layout.itemsCenter,
              {
                flex: 0.7,
              },
            ]}
          ></View>
          <View
            style={[
              {
                flex: 2,
              },
              layout.justifyCenter,
              layout.itemsCenter,
            ]}
          >
            <Text style={[fonts.gray800, fonts.size_24]}>
              {user.firstName} {user.lastName}
            </Text>
            <Text style={[fonts.size_16, fonts.gray800]}>{user.email}</Text>
          </View>
          <View
            style={[
              layout.justifyCenter,
              layout.itemsCenter,
              {
                flex: 0.5,
              },
            ]}
          ></View>
        </View>
      </RNBounceable>
    );
  };
  return (
    <SafeScreen noPadding isError={isError} onResetError={refetch}>
      <FlashList
        data={data?.superAdmin}
        renderItem={({ item }: { item: superAdmin }) => renderUserCard(item)}
        estimatedItemSize={200}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
      />
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
                        error={
                          errors[
                            a.key as
                              | 'firstName'
                              | 'lastName'
                              | 'email'
                              | 'password'
                              | 'confirmPassword'
                          ]?.message
                        }
                        handleChange={onChange}
                        onBlur={onBlur}
                        value={value}
                        key={a.key}
                        placeholder={a.placeHolder}
                        keyboardType={a.keyboardType}
                        secure={a.secure}
                        iconName={a.iconName}
                        mask={a.mask}
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
                <Text style={[fonts.bold, { color: 'white' }]}>
                  Add Super Admin
                </Text>
              )}
            </RNBounceable>
          </View>
        </View>
      </Modal>
    </SafeScreen>
  );
}
