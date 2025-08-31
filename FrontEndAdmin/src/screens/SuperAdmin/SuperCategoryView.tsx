import { View, Text, Image } from 'react-native';
import React, { useEffect, useState } from 'react';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/navigation/types';
import { Paths } from '@/navigation/paths';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useEditCategory, useGetCategory } from '@/queries/superAdmin.queries';
import { useStores } from '@/stores';
import { SafeScreen } from '@/components/templates';
import { useTheme } from '@/theme';
import RNBounceable from '@freakycoder/react-native-bounceable';
import { FlashList } from '@shopify/flash-list';
import FontAwesome5Icon from 'react-native-vector-icons/FontAwesome5';
import * as Yup from 'yup';

import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useTranslation } from 'react-i18next';
import { TextField } from '@/components/molecules';
import { toast } from '@backpackapp-io/react-native-toast';
type SuperCategoryViewScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  Paths.SuperCategoryView
>;
type SuperCategoryViewScreenRouteProp = RouteProp<
  RootStackParamList,
  Paths.SuperCategoryView
>;
export default function SuperCategoryView() {
  const navigation = useNavigation<SuperCategoryViewScreenNavigationProp>();
  const route = useRoute<SuperCategoryViewScreenRouteProp>();
  const { auth } = useStores();
  const {
    backgrounds,
    fonts,
    borders,
    layout,
    gutters,
    variant,
  } = useTheme();
  const [isEdit, setisEdit] = useState<boolean>(false);
  const { t } = useTranslation();
  const { mutateAsync, isPending } = useEditCategory();
  const id = route.params.id;
  const { data, isError, refetch } = useGetCategory({
    token: auth.token,
    id: id,
  });
  const Fields: Field[] = [
    {
      iconName: 'th-large',
      placeHolder: 'Category Name',
      keyboardType: 'default',
      key: 'category',
    },
  ];
  const validationLoginSchema = Yup.object({
    category: Yup.string()
      .trim()
      .required(t('inUse.name'))
      .min(3, t('inUse.nameLength'))
      .max(64, t('inUse.nameLength')),
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      category: '',
    },
    resolver: yupResolver(validationLoginSchema),
    mode: 'onChange',
  });

  useEffect(() => {
    if (data) {
      reset({
        category: data?.category.name,
      });
    }
  }, [reset, data]);
  const onSubmit = async (data: { category: string }) => {
    await mutateAsync({
      token: auth.token,
      id: id,
      name: data.category,
    });
    toast.success('Category Updated Successfully');
    refetch();
    setisEdit(false);
  };
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <RNBounceable
          disabled={isPending}
          onPress={async () => {
            if (isEdit) {
              await handleSubmit(onSubmit)();
            } else {
              setisEdit(true);
            }
          }}
          style={[
            gutters.marginRight_24,
            layout.justifyCenter,
            layout.itemsCenter,
          ]}
        >
          {isEdit ? (
            <Text style={[fonts.size_16, fonts.bold, fonts.gray800]}>Save</Text>
          ) : (
            <FontAwesome5Icon
              name="pen"
              size={15}
              color={variant === 'dark' ? 'white' : 'black'}
            />
          )}
        </RNBounceable>
      ),
    });
  }, [isEdit]);
  if (!data) {
    return (
      <SafeScreen noPadding>
        <Text>Loading...</Text>
      </SafeScreen>
    );
  }
  const renderProductCard = ({ item }: { item: any }) => {
    return (
      <RNBounceable
        onPress={() => {
          navigation.navigate(Paths.SuperItem, {
            id: item._id,
          });
        }}
        style={[
          backgrounds.skeleton,
          borders.rounded_16,
          gutters.padding_12,
          { width: '95%', marginTop: 20, height: 250 },
        ]}
      >
        <View
          style={[
            { height: '75%', overflow: 'hidden' },
            borders.rounded_16,
            layout.fullWidth,
          ]}
        >
          <Image
            resizeMode="stretch"
            source={{
              uri: item.avatar[0],
            }}
            style={[layout.fullHeight, layout.fullWidth]}
          />
        </View>
        <View
          style={[
            layout.flex_1,
            layout.justifyCenter,
            gutters.paddingBottom_12,
          ]}
        >
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            style={[
              gutters.marginTop_12,
              fonts.alignCenter,
              fonts.gray800,
              fonts.size_16,
              fonts.bold,
            ]}
          >
            {item.title}
          </Text>
        </View>
      </RNBounceable>
    );
  };
  return (
    <SafeScreen noPadding isError={isError} onResetError={refetch}>
      <View style={{ flex: 1, padding: 10 }}>
        {isEdit ? (
          <View
            style={{
              width: '100%',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 10,
            }}
          >
            {Fields.map((a, index) => {
              return (
                <Controller
                  control={control}
                  key={a.key}
                  name={a.key as never}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View key={a.key + index} style={[gutters.marginBottom_12]}>
                      <TextField
                        disable={isPending}
                        error={errors[a.key as 'category']?.message}
                        handleChange={onChange}
                        iconName={a.iconName}
                        key={a.key}
                        keyboardType={a.keyboardType}
                        onBlur={onBlur}
                        placeholder={a.placeHolder}
                        secure={a.secure}
                        value={value}
                      />
                    </View>
                  )}
                />
              );
            })}
          </View>
        ) : (
          <Text
            style={[
              fonts.gray800,
              fonts.size_40,
              fonts.bold,
              fonts.alignCenter,
              fonts.uppercase,
            ]}
          >
            {data.category.name}
          </Text>
        )}
        <Text
          style={[
            fonts.gray800,
            fonts.size_16,
            fonts.bold,
            fonts.alignCenter,
            fonts.uppercase,
            gutters.marginTop_12,
          ]}
        >
          Total Items: {data.category.items.length}
        </Text>

        <FlashList
          data={data.category.items}
          renderItem={renderProductCard}
          estimatedItemSize={100}
          keyExtractor={(item) => item._id.toString()}
          showsVerticalScrollIndicator={false}
          numColumns={2}
          ListEmptyComponent={
            <View
              style={[layout.flex_1, layout.itemsCenter, layout.justifyCenter]}
            >
              <Text style={[fonts.size_24, fonts.bold, fonts.gray800]}>
                No Items Found
              </Text>
            </View>
          }
          ListHeaderComponent={
            data.category.items.length > 0 ? (
              <View
                style={[
                  layout.itemsCenter,
                ]}
              >
                <Text
                  style={[
                    fonts.size_24,
                    fonts.bold,
                    fonts.gray800,
                    gutters.marginBottom_12,
                  ]}
                >
                  Items
                </Text>
              </View>
            ) : null
          }
          ListFooterComponent={
            data.category.items.length > 0 ? (
              <View
                style={[
                  layout.flex_1,
                  layout.itemsCenter,
                  layout.justifyCenter,
                  gutters.marginVertical_12,
                ]}
              >
                <Text
                  style={[
                    fonts.size_24,
                    fonts.bold,
                    fonts.gray800,
                    gutters.marginBottom_12,
                  ]}
                >
                  End of List
                </Text>
              </View>
            ) : null
          }
        />
      </View>
    </SafeScreen>
  );
}
