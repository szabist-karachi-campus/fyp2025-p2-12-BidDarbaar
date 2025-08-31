import {
  Text,
  View,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
} from 'react-native';
import React, { useEffect, useLayoutEffect, useState } from 'react';
import {
  useFetchAuctionItem,
  useDeleteAuctionItems,
} from '@/queries/item.queries';
import { useStores } from '@/stores';
import { useTheme } from '@/theme';
import RNBounceable from '@freakycoder/react-native-bounceable';
import type { RootStackParamList } from '@/navigation/types';
import { StackNavigationProp } from '@react-navigation/stack';
import { Paths } from '@/navigation/paths';
import { useSharedValue } from 'react-native-reanimated';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { logo } from '../../../images';
import Carousell from 'react-native-reanimated-carousel';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import * as Icons from '@/components/molecules/Icons';
import { launchImageLibrary } from 'react-native-image-picker';
import {
  useAuctionItemPicture,
  useEditAuctionItems,
} from '@/queries/item.queries';
import { ActivityIndicator } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import { Controller, useForm } from 'react-hook-form';
import RNDateTimePicker from '@react-native-community/datetimepicker';
import DropDownPicker from 'react-native-dropdown-picker';
import { useGetItemCategory } from '@/queries/categories.queries';
import { toast } from '@backpackapp-io/react-native-toast';
import { useIsItemAdActive } from '@/queries/ad.queries';

type ItemViewScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  Paths.ItemView
>;

export default function ItemView() {
  const {
    layout,
    gutters,
    fonts,
    borders,
    variant,
    changeTheme,
    navigationTheme,
  } = useTheme();
  const { auth, user } = useStores();
  const token = auth.token;
  const [images, setImages] = useState<any[]>([]);
  const { mutateAsync: EditAuctionItem, status: editItemStatus } =
    useEditAuctionItems();
  const [isEditing, setIsEditing] = useState(false);
  const navigation = useNavigation<ItemViewScreenNavigationProp>();
  const [imageuploading, setImageUploading] = useState(false);
  const route = useRoute<RouteProp<RootStackParamList, Paths.ItemView>>();
  const { mutateAsync: UploadAuctionItemPicture } = useAuctionItemPicture();
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const { data: categories, isLoading: categoriesLoading } =
    useGetItemCategory();
  const { mutateAsync: DeleteAuctionItems, status: deleteItemStatus } =
    useDeleteAuctionItems();

  const { item } = route.params;
  const { t } = useTranslation();
  const [currentTime, setCurrentTime] = useState(new Date());

  const { data, status, refetch, error } = useFetchAuctionItem({
    Authorization: token,
    itemid: item._id,
  });
  const {
    data: isAdActive,
    status: isAdActiveStatus,
    refetch: isAdActiveRefetch,
  } = useIsItemAdActive(data?.auctionItems?._id);

  useEffect(() => {
    if (data) {
      isAdActiveRefetch();
    }
  }, [data]);

  const scrollOffsetValue = useSharedValue<number>(0);

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
      .required(t('items.Req.StartingBid'))
      .min(1, t('items.StartBidMin')),
    categories: Yup.array().required(t('items.Req.categories')),
    startTime: Yup.date().required(t('items.Req.StartingBidTime')),
    endTime: Yup.date().required(t('items.Req.EndingBidTime')),
    bidDate: Yup.date().required(t('items.Req.BiddingDate')),
  });

  useEffect(() => {
    if (data?.auctionItems) {
      const initialCategories = (data?.auctionItems?.categories || [])
        .map((cat: any) => cat?._id)
        .filter(Boolean);

      reset({
        title: data?.auctionItems?.title,
        description: data?.auctionItems?.description,
        startBid: data?.auctionItems?.startingBid,
        categories: initialCategories,
        startTime: new Date(data?.auctionItems?.BiddingStartTime),
        endTime: new Date(data?.auctionItems?.BiddingEndTime),
        bidDate: new Date(data?.auctionItems?.BiddingDate),
      });
      resetField('categories', data.auctionItems.categories);
    }
  }, [data]);
  const {
    control,
    handleSubmit,
    resetField,
    reset,
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

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12 || 12;

    return `${hours}:${minutes} ${ampm}`;
  };

  const formatShortDate = (isoString: string) => {
    const date = new Date(isoString);

    const day = date.getDate();
    const suffix =
      day === 1 || day === 21 || day === 31
        ? 'st'
        : day === 2 || day === 22
          ? 'nd'
          : day === 3 || day === 23
            ? 'rd'
            : 'th';

    const month = date.toLocaleString('en-US', { month: 'short' });

    const year = date.getFullYear().toString().slice(-2);
    const getCountdownTime = (targetDate: Date) => {
      const now = new Date().getTime();
      const distance = new Date(targetDate).getTime() - now;

      if (distance > 0) {
        const hours = Math.floor(
          (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
        );
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        return {
          hours: hours.toString().padStart(2, '0'),
          minutes: minutes.toString().padStart(2, '0'),
          seconds: seconds.toString().padStart(2, '0'),
        };
      } else {
        return {
          hours: '00',
          minutes: '00',
          seconds: '00',
        };
      }
    };
    return `${day}${suffix} ${month} ${year}`;
  };

  const handleImageUpload = async () => {
    if (imageuploading) {
      return;
    }
    setImageUploading(true);
    launchImageLibrary(
      { mediaType: 'photo', selectionLimit: 5 },
      async (response) => {
        if (response.didCancel) {
          setImageUploading(false);
        } else if (response.errorCode) {
          setImageUploading(false);
        } else if (response.assets && response.assets.length > 0) {
          const selectedImages = response.assets.map((asset) => {
            const type =
              asset.type === 'image/jpg'
                ? 'image/jpeg'
                : asset.type || 'image/jpeg';
            const name =
              asset.fileName || `image_${Date.now()}.${type.split('/')[1]}`;

            return {
              uri: asset.uri,
              type,
              name,
            };
          });
          const values = {
            images: selectedImages,
            token: auth.token,
            itemId: item._id,
          };
          console.log('images values', values);
          await UploadAuctionItemPicture(values);
          setImages(selectedImages);
          setImageUploading(false);
        }
      },
    );
  };

  const [ended, setEnded] = useState<boolean>(false);
  useEffect(() => {
    if (data) {
      setEnded(new Date(data?.auctionItems?.BiddingEndTime) < currentTime);
    }
  }, [data]);
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        ended || user.jobTitle === 'sales' ? null : (
          <RNBounceable
            onPress={() => {
              if (imageuploading) {
                return;
              }
              setIsEditing(!isEditing);
            }}
            style={[gutters.marginRight_16]}
          >
            {isEditing ? (
              <Icons.Entypo
                name={'cross'}
                size={30}
                color={variant === 'dark' ? 'white' : 'black'}
              />
            ) : (
              <Icons.FontAwesome5
                name={'user-edit'}
                size={20}
                color={variant === 'dark' ? 'white' : 'black'}
              />
            )}
          </RNBounceable>
        ),
    });
  }, [navigation, isEditing, variant, ended]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const onSubmit = handleSubmit(async (data: any) => {
    const values: editAuctionItemRequest = {
      title: data.title,
      description: data.description,
      startingBid: data.startBid,
      BiddingStartTime: data.startTime,
      BiddingEndTime: data.endTime,
      BiddingDate: data.bidDate,
      token: auth.token,
      itemId: item._id,
      categories: data.categories,
    };

    console.log('values', values);
    try {
      const response = await EditAuctionItem(values);
      if (response) {
        toast.success('Items Added Successfully');
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error editing auction item:', error);
      toast.error('Failed to edit item');
    }
  });

  if (status === 'pending') {
    return <Text>Loading...</Text>;
  }
  if (status === 'error') {
    refetch();

    return <Text style={{ marginTop: 100 }}>Error...</Text>;
  }

  const carouselData = [
    ...(data?.auctionItems?.avatar || []),
    ...images.map((img) => img.uri),
  ];

  const deleteItem = async () => {
    try {
      const response = await DeleteAuctionItems({
        itemId: item._id,
        token: auth.token,
      });

      if (response) {
        toast.success('Item Deleted Successfully');

        navigation.goBack();
      }
    } catch (error) {
      console.error('Error deleting auction item:', error);
      toast.error('Failed to delete item');
    }
  };
  const handleDelteItem = async () => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        { text: 'OK', onPress: () => deleteItem() },
      ],
      { cancelable: false },
    );
  };

  const renderEditingForm = () => {
    return (
      <ScrollView contentContainerStyle={[gutters.padding_16]}>
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
                        ]}
                      >
                        {field.title}
                      </Text>
                      <RNDateTimePicker
                        disabled={
                          editItemStatus === 'pending'
                            ? true
                            : false || deleteItemStatus === 'pending'
                              ? true
                              : false
                        }
                        minimumDate={new Date()}
                        onChange={(e, newTime) => onChange(newTime)}
                        textColor="white"
                        placeholderText="white"
                        accentColor="white"
                        themeVariant={variant === 'dark' ? 'dark' : 'light'}
                        style={[
                          {
                            alignSelf: 'flex-start',
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
                        ]}
                      >
                        {field.title}
                      </Text>
                      <RNDateTimePicker
                        disabled={
                          editItemStatus === 'pending'
                            ? true
                            : false || deleteItemStatus === 'pending'
                              ? true
                              : false
                        }
                        minimumDate={new Date()}
                        mode="time"
                        onChange={(e, newTime) => onChange(newTime)}
                        textColor="white"
                        accentColor="white"
                        themeVariant={variant === 'dark' ? 'dark' : 'light'}
                        style={[
                          {
                            alignSelf: 'flex-start',
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
                      editable={
                        editItemStatus === 'pending'
                          ? false
                          : true || deleteItemStatus === 'pending'
                            ? false
                            : true
                      }
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
                disabled={
                  editItemStatus === 'pending'
                    ? true
                    : false || deleteItemStatus === 'pending'
                      ? true
                      : false
                }
                open={categoryDropdownOpen}
                setOpen={setCategoryDropdownOpen}
                value={Array.isArray(value) ? value.filter(Boolean) : []}
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
                dropDownDirection="AUTO"
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
              <Text style={{ color: 'red' }}>{errors.categories?.message}</Text>
            </>
          )}
        />

        <TouchableOpacity
          disabled={editItemStatus === 'pending' ? true : false}
          onPress={onSubmit}
          style={styles.addButton2}
        >
          <Text style={styles.addButtonText}>Edit Item</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };
  return (
    <>
      {isEditing ? (
        <>{renderEditingForm()}</>
      ) : (
        <ScrollView
          contentContainerStyle={{ flex: 1, flexGrow: 1, paddingBottom: 50 }}
        >
          <View
            style={[
              layout.itemsCenter,
              layout.justifyCenter,
              {
                height: '38%',
                marginLeft: 20,
                width: '90%',
              },
            ]}
          >
            {imageuploading && (
              <ActivityIndicator
                size="large"
                color="blue"
                style={[
                  {
                    position: 'absolute',
                    alignSelf: 'center',
                    top: '19%',
                    zIndex: 1000,
                  },
                ]}
              />
            )}
            <Carousell
              testID={'xxx'}
              loop={false}
              width={380}
              height={250}
              snapEnabled={true}
              pagingEnabled={true}
              data={carouselData}
              defaultScrollOffsetValue={scrollOffsetValue}
              style={[
                { height: '100%', flex: 1 },
                layout.itemsCenter,
                borders.rounded_16,
              ]}
              renderItem={({ item, index }) => (
                <View
                  style={[
                    layout.flex_1,
                    layout.justifyCenter,
                    { width: '100%', height: '100%' },
                  ]}
                >
                  <Image
                    style={[
                      { height: '95%', overflow: 'hidden' },
                      layout.fullWidth,
                      borders.rounded_16,
                    ]}
                    source={item ? { uri: item } : logo}
                    resizeMode="stretch"
                  />

                  <View
                    style={[
                      {
                        position: 'absolute',
                        zIndex: 1000,
                        bottom: 20,
                        left: 20,
                        padding: 5,
                        paddingHorizontal: 10,
                      },
                      {
                        backgroundColor: navigationTheme.colors.border,
                        borderRadius: 2,
                      },
                    ]}
                  >
                    <Text style={[fonts.gray800]}>
                      {index + 1} / {data?.auctionItems?.avatar?.length}
                    </Text>
                  </View>
                </View>
              )}
            />
          </View>

          <View
            style={[
              {
                maxHeight: 100,
                width: '90%',
                flexDirection: 'column',
                backgroundColor: navigationTheme.colors.border,
                alignSelf: 'center',
                paddingBottom: 5,
              },
              borders.roundedTop_16,
            ]}
          >
            <View
              style={[
                {
                  width: '100%',
                  flexDirection: 'row',
                  marginTop: 8,
                },
                layout.itemsCenter,
                layout.justifyCenter,
              ]}
            >
              <Text
                style={[
                  fonts.bold,
                  fonts.capitalize,
                  fonts.gray800,

                  { fontSize: 28 },
                ]}
              >
                {data?.auctionItems?.title}
              </Text>
            </View>

            <View
              style={[
                {
                  marginTop: 5,
                  width: '90%',
                  alignSelf: 'center',
                  flexDirection: 'row',
                },
                layout.itemsCenter,
                layout.justifyCenter,
              ]}
            >
              {data?.auctionItems?.categories.map(
                (
                  category: {
                    name:
                      | string
                      | number
                      | boolean
                      | React.ReactElement<
                          any,
                          string | React.JSXElementConstructor<any>
                        >
                      | Iterable<React.ReactNode>
                      | React.ReactPortal
                      | null
                      | undefined;
                  },
                  index: number,
                ) => (
                  <Text
                    style={[
                      fonts.gray400,
                      fonts.capitalize,
                      fonts.bold,
                      fonts.size_16,
                    ]}
                    numberOfLines={2}
                    adjustsFontSizeToFit
                  >
                    {category.name}
                    {data?.auctionItems?.categories.length === index + 1
                      ? ''
                      : ' - '}
                  </Text>
                ),
              )}
            </View>
          </View>
          <View
            style={[
              {
                height: 100,
                backgroundColor: navigationTheme.colors.border,
                overflow: 'hidden',
                borderBottomEndRadius: 16,
                width: '90%',
                alignSelf: 'center',
              },
              borders.roundedBottom_16,
            ]}
          >
            <View
              style={[
                {
                  flex: 1,
                  flexDirection: 'row',
                  marginTop: 10,
                  marginLeft: 30,
                },
              ]}
            >
              <View style={[{ flex: 1, flexDirection: 'row' }]}>
                <MaterialCommunityIcons
                  name="currency-rupee"
                  size={22}
                  color={variant === 'dark' ? 'white' : 'black'}
                >
                  <Text
                    style={[fonts.gray800, fonts.bold, { fontSize: 22 }]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {' ' + data?.auctionItems?.startingBid}
                  </Text>
                </MaterialCommunityIcons>
              </View>
              <View style={[{ flex: 1 }]}>
                <FontAwesome5
                  name="hourglass-start"
                  color={variant === 'dark' ? 'white' : 'black'}
                  size={22}
                >
                  <Text style={[fonts.gray800, fonts.bold, { fontSize: 22 }]}>
                    {'   '}
                    {formatTime(data?.auctionItems?.BiddingStartTime)}{' '}
                  </Text>
                </FontAwesome5>
              </View>
            </View>

            <View
              style={[
                {
                  width: '100%',
                  flexDirection: 'row',
                  paddingVertical: 20,
                },
              ]}
            >
              <View style={[{ flex: 1, marginLeft: 30 }]}>
                <FontAwesome5
                  name="calendar-alt"
                  color={variant === 'dark' ? 'white' : 'black'}
                  size={22}
                >
                  <Text style={[fonts.gray800, fonts.bold, { fontSize: 22 }]}>
                    {' '}
                    {formatShortDate(data?.auctionItems?.BiddingDate)}
                  </Text>
                </FontAwesome5>
              </View>
              <View style={{ flex: 1 }}>
                <FontAwesome5
                  name="hourglass-end"
                  color={variant === 'dark' ? 'white' : 'black'}
                  size={22}
                >
                  <Text style={[fonts.gray800, fonts.bold, { fontSize: 22 }]}>
                    {'   '}
                    {formatTime(data?.auctionItems?.BiddingEndTime)}{' '}
                  </Text>
                </FontAwesome5>
              </View>
            </View>
          </View>
          <View
            style={[
              borders.rounded_16,
              {
                borderWidth: 1,
                width: '90%',
                height: 100,
                alignSelf: 'center',

                backgroundColor: navigationTheme.colors.border,
                marginTop: 10,
                justifyContent: 'center',
                alignItems: 'center',
              },
            ]}
          >
            <Text style={[fonts.gray800, fonts.bold, fonts.size_16]}>
              {ended ? 'Winner' : 'Current Bidder'}:
              {data?.auctionItems?.currentBidder
                ? data?.auctionItems?.currentBidder?.firstName +
                  ' ' +
                  data?.auctionItems?.currentBidder?.lastName
                : ' No bidder'}{' '}
              {} {}
            </Text>
            <Text style={[fonts.gray800, fonts.bold, fonts.size_16]}>
              Bid Amount: {data?.auctionItems?.currentBid}
            </Text>
          </View>
          <View
            style={[
              {
                width: '90%',
                marginHorizontal: '5%',

                backgroundColor: navigationTheme.colors.border,
                height: '26%',
                marginTop: 10,
              },
              gutters.padding_12,
              borders.rounded_16,
            ]}
          >
            <ScrollView>
              <Text style={[fonts.gray400, fonts.size_16]}>
                {data?.auctionItems?.description}
              </Text>
            </ScrollView>
          </View>
          <View
            style={{
              position: 'absolute',
              bottom: 20,
              zIndex: 10,
              flexDirection: 'row',
              justifyContent:
                user.jobTitle === 'sales' ? 'center' : 'space-between',
              flex: 1,
              width: '100%',
              paddingHorizontal: 30,
            }}
          >
            {!ended && user.jobTitle !== 'sales' && (
              <RNBounceable
                onPress={handleDelteItem}
                style={{
                  backgroundColor: '#FF5733',
                  padding: 16,
                  borderRadius: 50,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FontAwesome5 name="trash" size={24} color="white" />
              </RNBounceable>
            )}
            {!ended &&
              (user.jobTitle !== 'lister' ||
                user.userType === 'auctionHouse' ||
                // @ts-expect-error
                user.jobTitle === 'admin') && (
                <RNBounceable
                  disabled={isAdActiveStatus === 'pending' ? true : false}
                  onPress={() =>
                    navigation.navigate(Paths.Advertisement, { id: item._id })
                  }
                  style={[
                    {
                      backgroundColor:
                        isAdActiveStatus === 'pending' ? 'gray' : 'orange',
                      padding: 16,
                      borderRadius: 5,
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingHorizontal: 40,
                    },
                  ]}
                >
                  {isAdActiveStatus === 'pending' ? (
                    <ActivityIndicator animating={true} color="white" />
                  ) : (
                    <Text
                      style={[
                        { color: 'white', fontSize: 23, fontWeight: 'bold' },
                      ]}
                    >
                      <FontAwesome5
                        name={isAdActive?.isActive ? 'chart-line' : 'bolt'}
                        size={24}
                        color="white"
                      />{' '}
                      {isAdActive?.isActive ? 'Analytics' : 'Boost'}
                    </Text>
                  )}
                </RNBounceable>
              )}
            {!ended && user.jobTitle !== 'sales' && (
              <RNBounceable
                onPress={handleImageUpload}
                style={{
                  backgroundColor: '#3B82F7',
                  padding: 16,
                  borderRadius: 50,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FontAwesome5 name="camera" size={24} color="white" />
              </RNBounceable>
            )}
          </View>
        </ScrollView>
      )}
    </>
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
  addButton2: {
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
