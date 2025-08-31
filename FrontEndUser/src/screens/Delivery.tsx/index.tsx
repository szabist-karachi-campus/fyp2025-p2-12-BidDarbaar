import { View, Text, Modal, TextInput } from 'react-native';
import React, { useEffect } from 'react';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '@/types/navigation';
import { StackNavigationProp } from '@react-navigation/stack';
import StepIndicator from 'react-native-step-indicator';
import { useTheme } from '@/theme';
import { useGetOrder } from '@/queries/payment.queries';
import { useStores } from '@/stores';
import Geocoder from 'react-native-geocoding';
import LottieView from 'lottie-react-native';
import RNBounceable from '@freakycoder/react-native-bounceable';
import FontAwesome5Icon from 'react-native-vector-icons/FontAwesome5';
import { Controller, set, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import {
  useGetChat,
  useStartThreadOrSendMessage,
} from '@/queries/messages.queries';
import { toast } from '@backpackapp-io/react-native-toast';
import { ActivityIndicator } from 'react-native-paper';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { queryClient } from '@/App';
import { REACT_QUERY_KEYS } from '@/queries';
type DeliveryScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Delivery'
>;
Geocoder.init('AIzaSyCzlSWOrg3L9rIPymZihR2I6n9zS6HgueE');

type DeliveryRouteProp = RouteProp<RootStackParamList, 'Delivery'>;
const validationDisputeSchema = Yup.object({
  reason: Yup.string().trim().required('Reason is required'),
  message: Yup.string()
    .trim()
    .required('Message is required')
    .min(3, 'Message must be greater than 3 letter'),
});
export default function Delivery() {
  const navigation = useNavigation<DeliveryScreenNavigationProp>();
  const route = useRoute<DeliveryRouteProp>();
  const { id } = route.params;
  const predefinedReasons = [
    'Order not received',
    'Money-related issue',
    'Other',
  ];

  const { auth } = useStores();
  const [address, SetAddress] = React.useState<string>('');
  const [disputeModalvisible, setDisputeModalVisible] = React.useState({
    visible: false,
    type: 'dispute',
  });
  const {
    data: disputeData,
    refetch: disputeRefetch,
    isFetching: disputeIsFetching,
  } = useGetChat({
    token: auth.token,
    itemId: id,
    context: 'SuperAdmin',
  });
  const {
    data: auctionChatData,
    refetch: auctionChatRefetch,
    isFetching: auctionChatIsFetching,
  } = useGetChat({
    token: auth.token,
    itemId: id,
    context: 'AuctionHouse',
  });
  const { mutateAsync, isPending } = useStartThreadOrSendMessage();
  const { data, isError, isFetching, refetch } = useGetOrder({
    token: auth.token,
    id: id,
  });
  const getAddressFromCoords = async () => {
    try {
      const response = await Geocoder.from(
        data.order.location.xAxis,
        data.order.location.yAxis,
      );
      const address = response.results[0].formatted_address;
      SetAddress(address);
    } catch (error) {
      console.error('Geocoding error:', error);
    }
  };

  useEffect(() => {
    if (data) {
      getAddressFromCoords();
    }
  }, [data]);
  const { layout, gutters, fonts, borders, navigationTheme, backgrounds } =
    useTheme();
  const labels = ['Order Pending', 'Agent Assigned', 'In Transit', 'Delivered'];
  const customStyles = {
    stepIndicatorSize: 25,
    currentStepIndicatorSize: 40,
    separatorStrokeWidth: 2,
    currentStepStrokeWidth: 3,
    stepStrokeCurrentColor: 'green',
    stepStrokeWidth: 3,
    stepStrokeFinishedColor: '#ffffff',
    stepStrokeUnFinishedColor: '#aaaaaa',
    separatorFinishedColor: 'green',
    separatorUnFinishedColor: '#aaaaaa',
    stepIndicatorFinishedColor: 'green',
    stepIndicatorUnFinishedColor: '#ffffff',
    stepIndicatorCurrentColor: '#ffffff',
    stepIndicatorLabelFontSize: 13,
    currentStepIndicatorLabelFontSize: 13,
    stepIndicatorLabelCurrentColor: '#fe7013',
    stepIndicatorLabelFinishedColor: '#ffffff',
    stepIndicatorLabelUnFinishedColor: '#aaaaaa',
    labelColor: '#999999',
    labelSize: 24,
    currentStepLabelColor: '#fe7013',
  };
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      reason: '',
      message: '',
    },
    resolver: yupResolver(validationDisputeSchema),
    mode: 'onChange',
  });
  if (isFetching) {
    return (
      <View style={[layout.flex_1, { justifyContent: 'center' }]}>
        <Text style={[fonts.size_24, fonts.alignCenter, fonts.gray800]}>
          Loading...
        </Text>
      </View>
    );
  }
  if (isError) {
    refetch();
    return (
      <View style={[layout.flex_1, { justifyContent: 'center' }]}>
        <Text style={[fonts.size_24, fonts.alignCenter, fonts.gray800]}>
          Error fetching data
        </Text>
      </View>
    );
  }
  const onSubmit = handleSubmit(async (data: any) => {
    try {
      await mutateAsync({
        token: auth.token,
        message: data.message,
        title: data.reason,
        receiverModel: 'SuperAdmin',
        itemId: id,
      });
      queryClient.invalidateQueries({
        queryKey: [REACT_QUERY_KEYS.messageQueries.getChat + id, 'SuperAdmin'],
      });
      toast.success('Dispute registered successfully');
      setDisputeModalVisible({ visible: false, type: 'dispute' });
      disputeRefetch();
    } catch (error) {
      toast.error('Error registering dispute');
    }
  });
  console.log('disputeData yehi hai', data.order);
  const auctionHouseId = data.order.auctionHouseId;
  const onSubmitAuction = handleSubmit(async (data: any) => {
    try {
      console.log('tanstack data', data);
      await mutateAsync({
        token: auth.token,
        message: data.message,
        title: data.reason,
        receiverModel: 'AuctionHouse',
        receiverId: auctionHouseId,
        itemId: id,
      });
      queryClient.invalidateQueries({
        queryKey: [
          REACT_QUERY_KEYS.messageQueries.getChat + id,
          'AuctionHouse',
        ],
      });
      toast.success('Dispute registered successfully');
      setDisputeModalVisible({ visible: false, type: 'dispute' });
      disputeRefetch();
    } catch (error) {
      toast.error('Error registering dispute');
      console.error('Error registering dispute:', error);
    }
  });
  const updatedAt = new Date(data.order.updatedAt);
  const fifteenDaysLater = new Date(updatedAt);
  fifteenDaysLater.setDate(fifteenDaysLater.getDate() + 15);

  const now = new Date();
  console.log('Updated At:', disputeData?.thread);

  if (now >= fifteenDaysLater) {
    console.log('15 days have passed since order was delivered');
  } else {
    console.log('15 days have NOT yet passed');
  }
  return (
    <View style={[layout.flex_1]}>
      <View
        style={[
          { width: '90%', alignSelf: 'center' },
          gutters.paddingVertical_16,
          borders.rounded_16,
          backgrounds.gray100,
          gutters.marginTop_24,
        ]}
      >
        <Text style={[fonts.size_24, fonts.alignCenter, fonts.gray800]}>
          Delivery
        </Text>
        <Text
          style={[
            gutters.marginTop_24,
            fonts.size_16,
            fonts.alignCenter,
            fonts.gray800,
          ]}
        >
          Order ID: {data.order._id}
        </Text>
        <Text
          numberOfLines={2}
          adjustsFontSizeToFit
          style={[
            gutters.marginTop_24,
            fonts.size_16,
            fonts.alignCenter,
            fonts.gray800,
          ]}
        >
          Delivery Address: {address}
        </Text>
        <Text
          style={[
            gutters.marginTop_24,
            fonts.size_16,
            fonts.alignCenter,
            fonts.gray800,
          ]}
        >
          Created Date: {new Date(data.order.createdAt).toLocaleDateString()}
        </Text>
        <Text
          style={[
            fonts.alignCenter,
            gutters.marginTop_24,
            { width: '50%', alignSelf: 'center', opacity: 0.5, color: 'red' },
          ]}
        >
          Order will be marked completed if 15 days are passed after delivered
          order status.File dispute before that
        </Text>
      </View>

      <View style={{ flex: 1, alignItems: 'center' }}>
        {data.order.status === 'cancelled' ? (
          <>
            <Text
              style={[
                fonts.alignCenter,
                { color: 'red' },
                fonts.size_24,
                gutters.marginTop_16,
              ]}
            >
              Order was cancelled and payment refunded
            </Text>
            <LottieView
              style={{ width: '100%', flex: 1 }}
              source={require('../../../assets/lottie/cancelOrder.json')}
              autoPlay
              loop
            />
          </>
        ) :data.order.status==="disput"?
        
        <View style={[{width:"90%",alignSelf:"center",flex:1}]}>
        <Text
                style={[
                  fonts.alignCenter,
                  data.order.status === 'cancelled' && { color: 'red' },
                  data.order.status === 'disput' && { color: '#1976D2' },
                  fonts.size_24,
                  gutters.marginTop_16,

                ]}
              >
                {data.order.status === 'cancelled'
                  ? 'Order was cancelled and payment refunded'
                  : 'Order is in dispute.Please contact support'}
              </Text>
              <LottieView
                style={{ width: '50%',flex:1,alignSelf:"center" }}
                source={require('../../../assets/lottie/dispute.json')}
                autoPlay
                loop
              />
        </View>
        : (
          <StepIndicator
            stepCount={4}
            renderLabel={({ position, stepStatus, label, currentPosition }) => {
              return (
                <Text
                  style={{
                    color:
                      stepStatus === 'finished'
                        ? 'green'
                        : currentPosition === position
                        ? '#fe7013'
                        : '#999999',
                    fontSize: 24,
                  }}
                >
                  {label}
                </Text>
              );
            }}
            customStyles={customStyles}
            currentPosition={
              data.order.status === 'pending'
                ? 0
                : data.order.status === 'assigned'
                ? 2
                : data.order.status === 'in_transit'
                ? 3
                : 4
            }
            labels={labels}
            direction="vertical"
          />
        )}
      </View>
      <RNBounceable
        onPress={() => {
          if (auctionChatData?.thread) {
            navigation.navigate('ChatScreen', {
              id: id,
              context: 'AuctionHouse',
              receiverId: data.order.auctionHouseId,
              name: data.order.auctionHouseId.name,
              image:data.order.auctionHouseId.avatar?? `https://ui-avatars.com/api/?name=${
                data.order.auctionHouseId.name.split(' ')[0] +
                '+' +
                (data.order.auctionHouseId.name.split(' ')[1] ||
                  data.order.auctionHouseId.name.split(' ')[0])
              }&background=cccccc&color=555555&rounded=true`,
            });
          } else {
            setDisputeModalVisible({ visible: true, type: 'auction' });
          }
        }}
        style={{
          backgroundColor: '#1976D2',
          width: 65,
          height: 65,
          position: 'absolute',
          bottom: 20,
          right: 20,
          borderRadius: 100,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Ionicons name="chatbox-ellipses" size={30} color="#F1F1F1" />
      </RNBounceable>
      {now <= fifteenDaysLater && (
        <RNBounceable
          onPress={() => {
            if (disputeData?.thread) {
              navigation.navigate('ChatScreen', {
                id: id,
                name: 'Bid Darbaar',
                superAdmin: true,
                context: 'SuperAdmin',
              });
            } else {
              setDisputeModalVisible({ visible: true, type: 'dispute' });
            }
          }}
          style={{
            backgroundColor: 'red',
            width: 65,
            height: 65,
            position: 'absolute',
            bottom: 20,
            left: 20,
            borderRadius: 100,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <FontAwesome5Icon
            name="exclamation-circle"
            size={30}
            color="#F1F1F1"
          />
        </RNBounceable>
      )}
      <Modal
        transparent
        visible={disputeModalvisible.visible}
        animationType="slide"
      >
        <View
          style={[
            layout.flex_1,
            layout.justifyCenter,
            gutters.padding_16,
            {
              backgroundColor: 'rgba(0,0,0,0.5)',
            },
          ]}
        >
          <View
            style={[
              borders.rounded_16,
              gutters.padding_16,
              {
                backgroundColor: '#fff',
                elevation: 5,
              },
            ]}
          >
            <View
              style={[
                layout.row,
                layout.justifyBetween,
                layout.itemsCenter,
                gutters.marginBottom_12,
              ]}
            >
              <Text style={fonts.size_16}>
                {disputeModalvisible.type === 'auction'
                  ? 'Contact Auction House'
                  : 'Register a Dispute'}
              </Text>
              <RNBounceable
                onPress={() => {
                  setDisputeModalVisible({
                    visible: !disputeModalvisible.visible,
                    type: 'dispute',
                  });
                }}
              >
                <FontAwesome5Icon name="times" size={20} color="#333" />
              </RNBounceable>
            </View>

            <Text
              style={[
                gutters.marginTop_12,
                gutters.marginBottom_12,
                disputeModalvisible.type === 'auction' && {
                  fontWeight: 'bold',
                },
              ]}
            >
              {disputeModalvisible.type === 'auction'
                ? 'Title'
                : 'Select a Reason:'}
            </Text>
            {disputeModalvisible.type === 'auction' ? (
              <Controller
                control={control}
                name={'reason'}
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    placeholder="Title"
                    value={value}
                    onChangeText={onChange}
                    style={[
                      borders.w_1,
                      borders.rounded_4,
                      gutters.padding_12,
                      gutters.marginBottom_16,
                      {
                        borderColor: '#ddd',
                        textAlignVertical: 'top',
                      },
                    ]}
                  />
                )}
              />
            ) : (
              <>
                {predefinedReasons.map((reason, index) => (
                  <Controller
                    key={index}
                    control={control}
                    name={'reason'}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <RNBounceable
                        key={reason}
                        style={[
                          layout.row,
                          {
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginBottom: 8,
                          },
                        ]}
                        onPress={() => setValue('reason', reason)}
                      >
                        <View
                          style={[
                            borders.rounded_16,
                            gutters.marginRight_12,
                            {
                              height: 18,
                              width: 18,
                              borderWidth: 2,
                              borderColor: '#999',
                            },
                            watch('reason') === reason && {
                              backgroundColor: '#1976D2',
                              borderColor: '#1976D2',
                            },
                          ]}
                        />
                        <Text
                          style={[
                            fonts.size_16,
                            {
                              color: '#333',
                            },
                          ]}
                        >
                          {reason}
                        </Text>
                      </RNBounceable>
                    )}
                  />
                ))}
              </>
            )}

            {errors.reason && (
              <Text style={{ color: 'red' }}>{errors.reason.message}</Text>
            )}

            <Text
              style={[
                gutters.marginTop_12,
                gutters.marginBottom_12,
                fonts.bold,
              ]}
            >
              Message:
            </Text>
            <Controller
              control={control}
              name={'message'}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  multiline
                  numberOfLines={4}
                  placeholder="Describe the issue..."
                  value={value}
                  onChangeText={onChange}
                  style={[
                    borders.w_1,
                    borders.rounded_4,
                    gutters.padding_12,
                    gutters.marginBottom_16,
                    {
                      borderColor: '#ddd',
                      minHeight: 80,
                      textAlignVertical: 'top',
                    },
                  ]}
                />
              )}
            />
            {errors.message && (
              <Text style={[gutters.marginBottom_12, { color: 'red' }]}>
                {errors.message.message}
              </Text>
            )}

            <RNBounceable
              disabled={isPending}
              style={[
                gutters.padding_12,
                borders.rounded_4,
                layout.itemsCenter,
                {
                  backgroundColor: '#1976D2',
                },
              ]}
              onPress={async () => {
                if (disputeModalvisible.type === 'auction') {
                  onSubmitAuction();
                } else {
                  onSubmit();
                }
              }}
            >
              {isPending ? (
                <ActivityIndicator
                  animating={true}
                  color="#fff"
                  style={[gutters.marginVertical_12]}
                  size="small"
                />
              ) : (
                <Text
                  style={[
                    fonts.size_16,
                    {
                      color: '#fff',
                      fontWeight: '600',
                    },
                  ]}
                >
                  {disputeModalvisible.type === 'auction'
                    ? 'Contact Auction House'
                    : 'Submit Dispute'}
                </Text>
              )}
            </RNBounceable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
