import React, { useState, useLayoutEffect, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import {
  useFetchAuctionItems,
  useCreateAuctionItems,
  useAuctionItemPicture,
} from '@/queries/item.queries';
import { useGetItemCategory } from '@/queries/categories.queries';
import { useStores } from '@/stores';
import { useTheme } from '@/theme';
import RNBounceable from '@freakycoder/react-native-bounceable';
import { Carousel } from '@/components/molecules';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/navigation/types';
import { Paths } from '@/navigation/paths';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { toast } from '@backpackapp-io/react-native-toast';
import RNDateTimePicker from '@react-native-community/datetimepicker';
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import { useTranslation } from 'react-i18next';
import DropDownPicker from 'react-native-dropdown-picker';

type NewItemNavigationProp = StackNavigationProp<
  RootStackParamList,
  Paths.newItem
>;

export default function NewItem() {
  const { auth } = useStores();
  const { data, status, refetch, error } = useFetchAuctionItems(auth.token);
  const { data: categories, isLoading: categoriesLoading } =
    useGetItemCategory();
  const { layout, gutters, fonts, borders, navigationTheme, variant } =
    useTheme();
  const navigation = useNavigation<NewItemNavigationProp>();
  const { t } = useTranslation();
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [images, setImages] = useState<any[]>([]);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const { mutateAsync: createAuctionItem } = useCreateAuctionItems();

  const fields = [
    {
      placeHolder: t('items.title'),
      title: 'Title',
      keyboardType: 'default',
      key: 'title',
    },
    {
      placeHolder: t('items.description'),
      title: 'Description',
      keyboardType: 'default',
      key: 'description',
    },
    {
      placeHolder: t('items.StartingBid'),
      title: 'Starting Bid',
      keyboardType: 'number-pad',
      key: 'startBid',
    },
    {
      placeHolder: t('items.StartingBidTime'),
      title: 'Starting Bid Time',
      key: 'startTime',
    },
    {
      placeHolder: t('items.EndingBidTime'),
      title: 'Ending Bid Time',
      key: 'endTime',
    },
    {
      placeHolder: t('items.BiddingDate'),
      title: 'Bidding Date',
      key: 'bidDate',
    },
  ];

  const validationItemSchema = Yup.object({
    title: Yup.string()
      .trim()
      .required(t('items.Req.title'))
      .min(3, t('items.titleMin')),
    description: Yup.string()
      .trim()
      .required(t('items.Req.description'))
      .min(10, t('items.descriptionMin')),
    startBid: Yup.number()
      .required(t('items.Req.StartingBidTime'))
      .min(1, t('items.StartBidMin')),
    categories: Yup.array().required(t('items.Req.categories')),
    startTime: Yup.date().required(t('items.Req.StartingBidTime')),
    endTime: Yup.date().required(t('items.Req.EndingBidTime')),
    bidDate: Yup.date().required(t('items.Req.BiddingDate')),
  });
  const {
    control,
    handleSubmit,
    resetField,
    getValues,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: '',
      description: '',
      startBid: 0,
      categories: [],
      startTime: new Date(),
      endTime: new Date(),
      bidDate: new Date(),
    },
    resolver: yupResolver(validationItemSchema),
    mode: 'onChange',
  });

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <RNBounceable
          onPress={() => setIsAddingItem(!isAddingItem)}
          style={[gutters.marginRight_16]}
        >
          <FontAwesome5
            name={isAddingItem ? 'times' : 'plus'}
            size={20}
            color={variant === 'dark' ? 'white' : 'black'}
          />
        </RNBounceable>
      ),
    });
  }, [navigation, isAddingItem, variant]);

  function onItemPress(item: any): void {
    navigation.navigate(Paths.ItemView, { item: item });
  }

  const onSubmit = handleSubmit(async (data) => {
    const values: auctionItemRequest = {
      title: data.title,
      description: data.description,
      startingBid: data.startBid,
      BiddingStartTime: data.startTime,
      BiddingEndTime: data.endTime,
      token: auth.token,
      BiddingDate: data.bidDate,
      categories: data.categories,
    };
    try {
      const response = await createAuctionItem(values);
      if (response) {
        toast.success('Items Added Successfully');

        setIsAddingItem(false);
        resetField('title');
        resetField('description');
        resetField('startBid');
        resetField('categories');
        resetField('startTime');
        resetField('endTime');
        resetField('bidDate');
      }
    } catch (error) {
      toast.error('items.error');
    }
  });
  function getCurrentSelectedDate() {
    return getValues('bidDate');
  }
  useEffect(() => {
    if (categories) {
    }
  }, [categories]);
  if (status === 'pending') return <Text>Loading...</Text>;
  if (status === 'error') {
    refetch();
    return <Text>An error has occurred!</Text>;
  }
  return (
    <View style={{ flex: 1 }}>
      {isAddingItem ? (
        <ScrollView
          contentContainerStyle={[
            gutters.padding_16,
            categoryDropdownOpen && { paddingBottom: 150 },
          ]}
        >
          {fields.map((field) => {
            return (
              <Controller
                control={control}
                key={field.key}
                name={field.key as never}
                render={({ field: { onChange, onBlur, value } }) => {
                  if (field.key === 'bidDate') {
                    return (
                      <>
                        <Text
                          style={[
                            fonts.gray800,
                            gutters.marginVertical_12,
                            fonts.size_16,
                            fonts.alignCenter,
                          ]}
                        >
                          {field.title}
                        </Text>
                        <RNDateTimePicker
                          minimumDate={new Date()}
                          onChange={(e, newTime) => onChange(newTime)}
                          textColor="white"
                          placeholderText="white"
                          accentColor="white"
                          themeVariant={variant === 'dark' ? 'dark' : 'light'}
                          style={[
                            {
                              alignSelf: 'center',
                              marginBottom: 16,
                            },
                          ]}
                          value={value}
                        />
                        <Text style={{ color: 'red' }}>
                          {errors[field.key as keyof typeof errors]?.message}
                        </Text>
                      </>
                    );
                  }

                  if (field.key === 'startTime' || field.key === 'endTime') {
                    return (
                      <>
                        <Text
                          style={[
                            fonts.gray800,
                            gutters.marginVertical_12,
                            fonts.size_16,
                            fonts.alignCenter,
                          ]}
                        >
                          {field.title}
                        </Text>
                        <RNDateTimePicker
                          minimumDate={
                            getCurrentSelectedDate().toDateString() ===
                            new Date().toDateString()
                              ? new Date()
                              : undefined
                          }
                          mode="time"
                          onChange={(e, newTime) => onChange(newTime)}
                          textColor="white"
                          accentColor="white"
                          themeVariant={variant === 'dark' ? 'dark' : 'light'}
                          style={[
                            {
                              alignSelf: 'center',
                              marginBottom: 16,
                            },
                          ]}
                          value={value}
                        />
                        <Text style={{ color: 'red' }}>
                          {errors[field.key as keyof typeof errors]?.message}
                        </Text>
                      </>
                    );
                  }

                  return (
                    <>
                      <Text
                        style={[
                          fonts.gray800,
                          gutters.marginVertical_12,
                          fonts.size_16,
                        ]}
                      >
                        {field.title}
                      </Text>
                      <TextInput
                        placeholder={field.placeHolder}
                        placeholderTextColor="#999"
                        value={value}
                        onChangeText={onChange}
                        style={[
                          styles.input,
                          fonts.gray800,
                          {
                            backgroundColor: navigationTheme.colors.background,
                          },
                        ]}
                        textAlign="left"
                        textAlignVertical="center"
                      />
                      <Text style={{ color: 'red' }}>
                        {errors[field.key as keyof typeof errors]?.message}
                      </Text>
                    </>
                  );
                }}
              />
            );
          })}
          <Controller
            control={control}
            name="categories"
            render={({ field: { onChange, value } }) => (
              <>
                <Text
                  style={[
                    fonts.gray800,
                    gutters.marginVertical_12,
                    fonts.size_16,
                  ]}
                >
                  {t('items.categories')}
                </Text>

                <DropDownPicker
                  open={categoryDropdownOpen}
                  setOpen={setCategoryDropdownOpen}
                  value={value}
                  autoScroll
                  setValue={(callback) => {
                    const newValue = callback(value);
                    onChange(newValue);
                  }}
                  items={
                    categories?.categories?.map((cat: any) => ({
                      label: cat.name,
                      value: cat._id,
                    })) || []
                  }
                  multiple={true}
                  dropDownDirection="BOTTOM"
                  placeholder="Select Category"
                  mode="BADGE"
                  loading={categoriesLoading}
                  badgeColors="#007BFF"
                  badgeDotColors="#FFF"
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
                  }}
                  placeholderStyle={{
                    color: variant === 'dark' ? '#AAA' : '#999',
                  }}
                  arrowIconStyle={{
                    width: 20,
                    height: 20,
                  }}
                  listMessageTextStyle={{ color: 'red' }}
                  listMessageContainerStyle={{ backgroundColor: 'transparent' }}
                />
                <Text style={{ color: 'red' }}>
                  {errors.categories?.message}
                </Text>
              </>
            )}
          />

          <TouchableOpacity onPress={onSubmit} style={styles.addButton}>
            <Text style={styles.addButtonText}>Add Item</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <>
          <View
            style={[
              layout.flex_1,
              layout.col,
              layout.justifyCenter,
              { width: '95%', marginLeft: 10 },
            ]}
          >
            <FlashList
              data={data?.auctionItems.reverse() || [].reverse()}
              renderItem={({ item }: { item: any }) => (
                <Carousel
                  item={item}
                  onPress={() => onItemPress(item)}
                  isLiked={false}
                  setIsLiked={function (value: boolean): void {
                    throw new Error('Function not implemented.');
                  }}
                  budget={0}
                  bidAmount={0}
                />
              )}
              estimatedItemSize={200}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingBottom: 10,
              }}
              keyExtractor={(item: any) => item._id}
            />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: '#555',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: '#007BFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
