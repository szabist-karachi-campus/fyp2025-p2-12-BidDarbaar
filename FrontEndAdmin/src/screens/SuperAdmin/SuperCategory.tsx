import { View, Text, TextInput } from 'react-native';
import React, { useCallback, useEffect, useRef } from 'react';
import { SafeScreen } from '@/components/templates';
import { useTheme } from '@/theme';
import { FontAwesome5 } from '@/components/molecules';
import RNBounceable from '@freakycoder/react-native-bounceable';
import { FlashList } from '@shopify/flash-list';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/navigation/types';
import { Paths } from '@/navigation/paths';
import { useNavigation } from '@react-navigation/native';
import { useGetItemCategory } from '@/queries/categories.queries';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import FontAwesome5Icon from 'react-native-vector-icons/FontAwesome5';
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator } from 'react-native-paper';
import { useAddCategory } from '@/queries/superAdmin.queries';
import { useStores } from '@/stores';
import { toast } from '@backpackapp-io/react-native-toast';

type SuperUserNavigationProp = StackNavigationProp<
  RootStackParamList,
  Paths.SuperCategory
>;

export default function SuperCategory() {
  const { data, isError, status, refetch } = useGetItemCategory();
  const { auth } = useStores();
  const { mutateAsync, status: addCategoryStatus } = useAddCategory();
  const schema = Yup.object().shape({
    name: Yup.string()
      .trim()
      .required('Name is required')
      .min(3, 'Name must be at least 3 characters')
      .max(64, 'Name must be at most 64 characters'),
  });
  const {
    backgrounds,
    fonts,
    borders,
    layout,
    gutters,
    navigationTheme,
    variant,
  } = useTheme();

  const navigation = useNavigation<SuperUserNavigationProp>();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const handleSheetChanges = useCallback((index: number) => {
    console.log('handleSheetChanges', index);
  }, []);
  const openSheet = () => {
    bottomSheetRef.current?.snapToIndex(0);
  };

  const closeSheet = () => {
    bottomSheetRef.current?.close();
  };
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: '',
    },
  });

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <RNBounceable
          onPress={openSheet}
          style={[
            gutters.marginRight_16,
            { backgroundColor: 'tomato' },
            layout.row,
            borders.rounded_16,
            layout.justifyCenter,
            layout.itemsCenter,
            { width: 100, height: 30 },
          ]}
        >
          <FontAwesome5Icon
            name="plus"
            size={15}
            color={variant === 'dark' ? 'white' : 'black'}
          />
        </RNBounceable>
      ),
    });
  }, []);
  if (status === 'pending') {
    return (
      <SafeScreen noPadding>
        <Text>Loading...</Text>
      </SafeScreen>
    );
  }

  const renderCategoryCard = (category: category) => {
    return (
      <RNBounceable
        onPress={() => {
          navigation.navigate(Paths.SuperCategoryView, {
            id: category._id,
          });
        }}
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
            <Text style={[fonts.gray800, fonts.size_24]}>{category.name}</Text>
            <Text style={[fonts.size_16, fonts.gray800]}>
              items: {category.items.length}
            </Text>
          </View>
          <View
            style={[
              layout.justifyCenter,
              layout.itemsCenter,
              {
                flex: 0.5,
              },
            ]}
          >
            <FontAwesome5 name="chevron-right" size={30} color="white" />
          </View>
        </View>
      </RNBounceable>
    );
  };
  const onSubmit = async (data: any) => {
    await mutateAsync({
      token: auth.token,
      name: data.name,
    }).then((res) => {
      console.log(res);
      toast.success('Category added successfully');

      closeSheet();
    });
  };
  return (
    <SafeScreen noPadding isError={isError} onResetError={refetch}>
      <FlashList
        data={data?.categories}
        renderItem={({ item }: { item: category }) => renderCategoryCard(item)}
        estimatedItemSize={200}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
      />
      <BottomSheet
        index={-1}
        ref={bottomSheetRef}
        onChange={handleSheetChanges}
        backgroundStyle={{ backgroundColor: navigationTheme.colors.border }}
        handleIndicatorStyle={backgrounds.gray800}
        enablePanDownToClose={true}
        snapPoints={['35%']}
      >
        <BottomSheetView style={{ flex: 1 }}>
          <View style={{ flex: 1 }}>
            <Text
              style={[fonts.size_24, fonts.gray800, { alignSelf: 'center' }]}
            >
              Add Category
            </Text>
            <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    placeholder="Enter custom amount"
                    keyboardType="default"
                    onChangeText={onChange}
                    onBlur={onBlur}
                    value={value}
                    style={[
                      borders.w_1,
                      borders.rounded_4,
                      fonts.gray800,
                      gutters.padding_12,
                      gutters.marginTop_12,
                      {
                        borderColor: errors.name ? 'red' : 'tomato',
                      },
                    ]}
                  />
                )}
              />
              {errors.name && (
                <Text style={[gutters.marginTop_12, { color: 'red' }]}>
                  {errors.name.message}
                </Text>
              )}
            </View>
            <RNBounceable
              disabled={addCategoryStatus === 'pending'}
              onPress={handleSubmit(onSubmit)}
              style={[
                gutters.padding_16,
                borders.rounded_16,
                layout.itemsCenter,
                gutters.marginTop_24,
                gutters.marginHorizontal_24,
                {
                  backgroundColor: 'tomato',
                },
              ]}
            >
              {addCategoryStatus === 'pending' ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={[fonts.bold, { color: 'white' }]}>
                  ADD CATEGORY
                </Text>
              )}
            </RNBounceable>
          </View>
        </BottomSheetView>
      </BottomSheet>
    </SafeScreen>
  );
}
