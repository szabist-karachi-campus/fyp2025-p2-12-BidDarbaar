import React, { useLayoutEffect, useState } from 'react';
import DropDownPicker from 'react-native-dropdown-picker';
import { View, Text, ScrollView, FlatList, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { TextField } from '@/components/molecules';
import RNBounceable from '@freakycoder/react-native-bounceable';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import ForwardButton from '@/components/molecules/ForwardButton';
import { toast } from '@backpackapp-io/react-native-toast';
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import { SafeScreen } from '@/components/templates';
import { RootStackParamList } from '@/navigation/types';
import { useAuctionHouseUserSignUp } from '@/queries/auth.queries';
import { Paths } from '@/navigation/paths';
import { useStores } from '@/stores';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import {
  useGetAllUsers,
  useDeleteAuctionHouseUser,
} from '@/queries/user.queries';
import { User } from '@/hooks/domain/user/schema';
import * as Icons from '@/components/molecules/Icons';
import { ActivityIndicator } from 'react-native-paper';

type SignupScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  Paths.Signup
>;

export default function Signup() {
  const { t } = useTranslation();
  const { auth, user: userStore } = useStores();
  const navigation = useNavigation<SignupScreenNavigationProp>();
  const { layout, gutters, fonts, variant } = useTheme();
  const { data, refetch } = useGetAllUsers({
    token: auth.token,
    auctionHouseId:
      userStore.userType === 'auctionHouse'
        ? userStore.user.id
        : userStore.user.auctionHouseId,
  });
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const { mutate: deleteUser, status } = useDeleteAuctionHouseUser();
  const isDeleting = status === 'pending';
  const { mutateAsync } = useAuctionHouseUserSignUp();

  const [jobTitleOpen, setJobTitleOpen] = useState(false);
  const [jobTitleValue, setJobTitleValue] = useState(null);

  const Fields: Field[] = [
    {
      iconName: 'user-alt',
      placeHolder: t('inUse.name'),
      key: 'name',
    },
    {
      iconName: 'at',
      placeHolder: t('textFieldLabel.email'),
      keyboardType: 'email-address',
      key: 'email',
    },
    {
      iconName: 'phone',
      placeHolder: t('name.phoneNum'),
      keyboardType: 'phone-pad',
      key: 'phoneNumber',
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

  const validationSignupSchema = Yup.object({
    name: Yup.string()
      .trim()
      .required(t('inUse.name'))
      .min(3, t('inUse.nameLength'))
      .max(64, t('inUse.nameLength')),
    email: Yup.string()
      .transform((value) => value.toLowerCase().trim())
      .email(t('inUse.validEmail'))
      .required(t('inUse.emailReq')),
    phoneNumber: Yup.string()
      .trim()
      .required(t('inUse.phoneReq'))
      .min(10, t('inUse.phoneLength'))
      .matches(/^(\+92|03)\d{9}$/, t('inUse.phoneFormat')),
    password: Yup.string()
      .trim()
      .min(8, t('inUse.passLength'))
      .required(t('inUse.password')),
    confirmPassword: Yup.string()
      .trim()
      .required(t('inUse.confirmPass'))
      .oneOf([Yup.ref('password')], t('inUse.passMatch')),
    jobTitle: Yup.string()
      .required(t('inUse.jobTitleRequired'))
      .oneOf(['admin', 'sales', 'lister'], t('inUse.invalidJobTitle')),
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      phoneNumber: '',
      password: '',
      confirmPassword: '',
      jobTitle: '',
    },
    resolver: yupResolver(validationSignupSchema),
    mode: 'onChange',
  });

  const onSubmit = handleSubmit(async (data: any) => {
    setLoading(true);
    const payload: userSignUpRequest = {
      token: auth.token,
      auctionHouseId:
        userStore.userType === 'auctionHouse'
          ? userStore.user.id
          : userStore.user.auctionHouseId,
      email: data.email,
      name: data.name,
      phoneNumber: data.phoneNumber,
      password: data.password,
      confirmPassword: data.confirmPassword,
      jobTitle: data.jobTitle,
    };
    try {
      await mutateAsync(payload);
      toast.success('User created successfully!');
      await refetch();
      setShowCreateForm(false);
    } catch (error) {
      Alert.alert('Error', 'User already exists');
    } finally {
      setLoading(false);
    }
  });

  const handleDeleteUser = (email: string) => {
    const payload: deleteAuctionHouseUserRequest = {
      token: auth.token,
      auctionHouseId:
        userStore.userType === 'auctionHouse'
          ? userStore.user.id
          : userStore.user.auctionHouseId,
      email: email,
    };
    console.log('Delete User Payload:', payload);
    deleteUser(payload, {
      onSuccess: () => {
        toast.success('User deleted successfully!');
        refetch();
      },
      onError: (error) => {
        console.error('Delete user error:', error);
        Alert.alert('Error', 'Failed to delete user');
      },
    });
    console.log('Delete User Response:', payload);
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <RNBounceable
          onPress={() => setShowCreateForm(!showCreateForm)}
          style={[gutters.marginRight_16]}
        >
          <FontAwesome5
            name={loading ? 'times' : 'plus'}
            size={20}
            color={variant === 'dark' ? 'white' : 'black'}
          />
        </RNBounceable>
      ),
    });
  }, [navigation, loading, variant, showCreateForm]);

  const UserCard = ({
    user,
    onDelete,
  }: {
    user: User;
    onDelete: () => void;
  }) => {
    return (
      <View
        style={[
          layout.fullWidth,
          gutters.marginBottom_12,
          gutters.padding_32,
          { borderRadius: 25 },
          {
            backgroundColor: variant === 'dark' ? '#1f1f1f' : '#ffffff',
            borderColor: variant === 'dark' ? '#333' : '#ddd',
            borderWidth: 1,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
          },
        ]}
      >
        <View style={[layout.row, layout.itemsCenter, layout.justifyBetween]}>
          <Text
            style={[
              fonts.size_32,
              fonts.bold,
              gutters.marginBottom_12,
              fonts.gray800,
            ]}
          >
            {user.name}
          </Text>
          <RNBounceable onPress={onDelete} disabled={isDeleting}>
            <Icons.FontAwesome5
              name="trash"
              size={20}
              color={isDeleting ? 'gray' : 'red'}
            />
          </RNBounceable>
        </View>
        <Text style={[fonts.gray800, fonts.size_24, gutters.marginBottom_12]}>
          📧 {user.email}
        </Text>
        <Text style={[fonts.gray800, fonts.size_24, gutters.marginBottom_12]}>
          📱 {user.phoneNumber}
        </Text>
        <Text style={[fonts.gray800, fonts.size_24]}>
          💼 {user.jobTitle?.charAt(0).toUpperCase() + user.jobTitle?.slice(1)}
        </Text>
      </View>
    );
  };

  const renderUsers = ({ item }: { item: User }) => {
    return (
      <UserCard user={item} onDelete={() => handleDeleteUser(item.email)} />
    );
  };

  return (
    <SafeScreen edges={['left', 'right', 'bottom']}>
      <View style={[layout.flex_1, layout.fullWidth]}>
        {showCreateForm ? (
          <View
            style={[
              gutters.marginTop_32,
              gutters.padding_12,
              layout.fullWidth,
              layout.itemsCenter,
              layout.justifyCenter,
            ]}
          >
            <View style={[layout.itemsCenter]}>
              {Fields.map((a, index) => (
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
                              | 'email'
                              | 'password'
                              | 'name'
                              | 'phoneNumber'
                              | 'confirmPassword'
                          ]?.message
                        }
                        handleChange={onChange}
                        onBlur={onBlur}
                        value={value}
                        placeholder={a.placeHolder}
                        keyboardType={a.keyboardType}
                        secure={a.secure}
                        iconName={a.iconName}
                        mask={a.mask}
                      />
                    </View>
                  )}
                />
              ))}

              <Controller
                control={control}
                name="jobTitle"
                render={({ field: { onChange, value } }) => (
                  <View style={[gutters.marginBottom_12, { width: '80%' }]}>
                    <DropDownPicker
                      open={jobTitleOpen}
                      setOpen={setJobTitleOpen}
                      value={value || jobTitleValue}
                      setValue={(callback) => {
                        const newValue = callback(value);
                        onChange(newValue);
                        setJobTitleValue(newValue);
                      }}
                      items={[
                        { label: 'Admin', value: 'admin' },
                        { label: 'Sales', value: 'sales' },
                        { label: 'Lister', value: 'lister' },
                      ]}
                      placeholder="Select Job Title"
                      dropDownDirection="BOTTOM"
                      style={{
                        backgroundColor: variant === 'dark' ? '#333' : '#FFF',
                        borderColor: variant === 'dark' ? '#555' : '#DDD',
                        marginBottom: 16,
                      }}
                      textStyle={{
                        color: variant === 'dark' ? '#FFF' : '#000',
                      }}
                      dropDownContainerStyle={{
                        backgroundColor: variant === 'dark' ? '#444' : '#FFF',
                        borderColor: variant === 'dark' ? '#555' : '#DDD',
                        borderWidth: 5,
                      }}
                      placeholderStyle={{
                        color: variant === 'dark' ? '#AAA' : '#999',
                      }}
                    />
                    <Text style={{ color: 'red', marginTop: 4 }}>
                      {errors.jobTitle?.message}
                    </Text>
                  </View>
                )}
              />

              <ForwardButton
                style={{ zIndex: -10 }}
                loading={loading}
                onPress={onSubmit}
              />
            </View>
          </View>
        ) : (
          <>
            {isDeleting && (
              <View
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.35)',
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  zIndex: 10,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <ActivityIndicator
                  animating={true}
                  size="large"
                  color={variant === 'dark' ? 'white' : 'black'}
                />
              </View>
            )}
            <FlatList
              data={data?.users}
              keyExtractor={(item) => item.id?.toString()}
              renderItem={renderUsers}
              contentContainerStyle={{
                paddingHorizontal: 16,
                paddingBottom: 16,
              }}
              showsVerticalScrollIndicator={false}
              style={{ marginTop: 32, paddingTop: 0 }}
            />
          </>
        )}
      </View>
    </SafeScreen>
  );
}
