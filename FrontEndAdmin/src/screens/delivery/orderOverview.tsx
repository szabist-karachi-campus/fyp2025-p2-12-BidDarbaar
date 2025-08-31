import {
  View,
  Text,
  Modal,
  TextInput,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '@/navigation/types';
import { StackNavigationProp } from '@react-navigation/stack';
import StepIndicator from 'react-native-step-indicator';
import { useTheme } from '@/theme';
import {
  useAssignAgent,
  useGetAuctionOrder,
  useGetAvailableAgents,
  useUpdateOrderStatus,
} from '@/queries/delivery.queries';
import { useStores } from '@/stores';
import Geocoder from 'react-native-geocoding';
import LottieView from 'lottie-react-native';
import RNBounceable from '@freakycoder/react-native-bounceable';
import FontAwesome5Icon from 'react-native-vector-icons/FontAwesome5';
import { Controller, set, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import { Paths } from '@/navigation/paths';
import { ActivityIndicator } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import { toast } from '@backpackapp-io/react-native-toast';
import {
  useGetChat,
  useStartThreadOrSendMessage,
} from '@/queries/message.queries';

type DeliveryScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  Paths.deliveryOverView
>;
Geocoder.init('AIzaSyCzlSWOrg3L9rIPymZihR2I6n9zS6HgueE');

type DeliveryRouteProp = RouteProp<
  RootStackParamList,
  Paths.deliveryOverView
> & {
  params: { id: string };
};

const validationDisputeSchema = Yup.object({
  title: Yup.string().trim().required('Title is required'),
  message: Yup.string()
    .trim()
    .required('Message is required')
    .min(3, 'Message must be greater than 3 letter'),
});

export default function Delivery() {
  const navigation = useNavigation<DeliveryScreenNavigationProp>();
  const route = useRoute<DeliveryRouteProp>();
  const { id } = route.params;
  const [disputeModalvisible, setDisputeModalVisible] = React.useState({
    visible: false,
    type: 'dispute',
  });

  const [visible, setVisible] = React.useState(false);
  const { auth, user } = useStores();
  const [address, SetAddress] = React.useState<string>('');
  const {
    data: agentsData,
    refetch: agentRefetch,
    isError: agentError,
  } = useGetAvailableAgents();
  const { data, isError, isFetching, refetch, error } = useGetAuctionOrder({
    token: auth.token,
    id: id,
  });
  const isPending = false;
  const { mutateAsync: assignAgent, isPending: assignAgentPending } =
    useAssignAgent();
  const {
    mutateAsync: updateStatusMutateAsync,
    isPending: updateStatusIsPending,
  } = useUpdateOrderStatus();
  const {
    data: disputeData,
    refetch: disputeRefetch,
    isFetching: disputeIsFetching,
  } = useGetChat({
    token: auth.token,
    itemId: id,
    context: auth.superAdmin ? 'AuctionHouse' : 'SuperAdmin',
  });
  const {
    data: auctionChatData,
    refetch: auctionChatRefetch,
    isFetching: auctionChatIsFetching,
  } = useGetChat({
    token: auth.token,
    itemId: id,
    context: 'User',
  });
  const { mutateAsync, isPending: sendingMesssage } =
    useStartThreadOrSendMessage();
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: '',
      message: '',
    },
    resolver: yupResolver(validationDisputeSchema),
    mode: 'onChange',
  });
  const [agents, setAgents] = useState<any[]>([]);
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
  const [selectedAgent, setSelectedAgent] = useState('');
  const [timeLeft, setTimeLeft] = useState<string>('Loading...');

  useEffect(() => {
    if (data) {
      getAddressFromCoords();
    }
  }, [data]);

  useEffect(() => {
    if (!data?.order?.updatedAt) return;

    const updatedAt = new Date(data.order.updatedAt);
    const deadline = new Date(updatedAt.getTime() + 15 * 24 * 60 * 60 * 1000); 

    const interval = setInterval(() => {
      const now = new Date();
      const diff = deadline.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft('Time expired');
        clearInterval(interval);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    }, 1000);

    return () => clearInterval(interval);
  }, [data?.order?.updatedAt]);
  const {
    layout,
    gutters,
    fonts,
    borders,
    navigationTheme,
    backgrounds,
    colors,
    variant,
  } = useTheme();
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
  useEffect(() => {
    if (agentsData) {
      setAgents(agentsData.agents);
    } else {
      setAgents([]);
    }
  }, [agentsData]);
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
    return (
      <View style={[layout.flex_1, { justifyContent: 'center' }]}>
        <Text style={[fonts.size_24, fonts.alignCenter, fonts.gray800]}>
          Error fetching data
        </Text>
      </View>
    );
  }

  console.info('Data fetched successfully:', data.order);
  const userId = data.order.userId._id;
  const onUserSubmit = handleSubmit(async (data) => {
    const values: startMessageRequest = {
      token: auth.token,
      message: data.message,
      title: data.title,
      itemId: id,
      receiverModel: 'User',
      receiverId: userId,
    };
    try {
      await mutateAsync(values);
      setDisputeModalVisible({
        visible: !disputeModalvisible.visible,
        type: 'dispute',
      });
      toast.success('Message Delivered successfully');
    } catch (error) {
      console.error('Error submitting dispute:', error);
      console.log('Form data:', error);
      toast.error('Error submitting form');
    }
  });
  const auctionHouseId = data.order.auctionHouseId._id;
  const onSubmit = handleSubmit(async (data) => {
    try {
      if (auth.superAdmin) {
        const values: startMessageRequest = {
          token: auth.token,
          message: data.message,
          title: data.title,
          itemId: id,
          receiverModel: 'AuctionHouse',
          receiverId: auctionHouseId,
        };
        await mutateAsync(values);
        setDisputeModalVisible({
          visible: !disputeModalvisible.visible,
          type: 'auction',
        });
        toast.success('Message Delivered successfully');
      } else {
        const values: startMessageRequest = {
          token: auth.token,
          message: data.message,
          title: data.title,
          itemId: id,
          receiverModel: 'SuperAdmin',
        };
        await mutateAsync(values);
        setDisputeModalVisible({
          visible: !disputeModalvisible.visible,
          type: 'dispute',
        });
        toast.success('Message Delivered successfully');
      }
    } catch (error) {
      console.error('Error submitting dispute:', error);
      toast.error('Error submitting form');
    }
  });

  return (
    <ScrollView
      contentContainerStyle={[layout.justifyBetween, { minHeight: '100%' }]}
    >
      <>
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
        </View>
        <View
          style={[
            { flex: 1, width: '100%', height: '100%', paddingTop: 20 },
            (data.order.status === 'cancelled' ||
              data.order.status === 'disput') && { alignItems: 'center' },
          ]}
        >
          {data.order.status === 'cancelled' ||
          data.order.status === 'disput' ? (
            <>
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
                style={{ width: '100%', flex: 1 }}
                source={
                  data.order.status === 'cancelled'
                    ? require('../../../assets/lottie/cancelOrder.json')
                    : require('../../../assets/lottie/dispute.json')
                }
                autoPlay
                loop
              />
            </>
          ) : (
            <StepIndicator
              stepCount={4}
              renderLabel={({
                position,
                stepStatus,
                label,
                currentPosition,
              }) => {
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
              direction="horizontal"
            />
          )}
          {data.order.status === 'delivered' && (
            <View
              style={[
                gutters.marginTop_32,
                borders.rounded_16,
                gutters.padding_16,
                {
                  backgroundColor: variant === 'dark' ? '#2C2C2E' : '#FFF8E1',
                  width: '90%',
                  alignSelf: 'center',
                },
              ]}
            >
              <Text style={[fonts.size_24, fonts.alignCenter, fonts.gray800]}>
                If user approves delivery or 15 days has been passed since
                delivery then you will be credited the money in your wallet
              </Text>
              <Text
                style={[
                  fonts.size_24,
                  fonts.alignCenter,
                  fonts.gray800,
                  gutters.marginTop_12,
                ]}
              >
                Time Left:
              </Text>
              <Text
                style={[
                  fonts.size_24,
                  fonts.alignCenter,
                  fonts.gray800,
                  gutters.marginTop_12,
                ]}
              >
                {timeLeft}
              </Text>
            </View>
          )}
        </View>
        <RNBounceable
          onPress={() => {
            if (disputeData?.thread) {
              navigation.navigate(Paths.Chat, {
                id: id,
                superAdmin: auth.superAdmin ? false : true,
                context: auth.superAdmin ? 'AuctionHouse' : 'SuperAdmin',
                receiverId: userId,
                name: auth.superAdmin
                  ? data.order.auctionHouseId.name
                  : 'Bid Darbaar',
                image:
                  data.order.userId.avatar ??
                  `https://ui-avatars.com/api/?name=${data.order.userId.firstName + '+' + data.order.userId.lastName}&background=cccccc&color=555555&rounded=true`,
              });
            } else {
              setDisputeModalVisible({ visible: true, type: 'auction' });
            }
          }}
          style={[
            gutters.padding_16,
            borders.rounded_16,
            layout.itemsCenter,
            gutters.marginBottom_24,
            gutters.marginTop_32,
            {
              backgroundColor: 'red',
              width: '90%',
              alignSelf: 'center',
            },
          ]}
        >
          <Text style={[fonts.bold, fonts.size_24, { color: 'white' }]}>
            {auth.superAdmin ? 'Contact Auction House' : 'Contact Bid Darbaar'}
          </Text>
        </RNBounceable>
        {data.order.status !== 'cancelled' && (
          <RNBounceable
            onPress={() => {
              if (auctionChatData?.thread) {
                navigation.navigate(Paths.Chat, {
                  id: id,
                  context: 'User',
                  receiverId: userId,
                  name:
                    data.order.userId.firstName +
                    ' ' +
                    data.order.userId.lastName,
                  image:
                    data.order.userId.avatar ??
                    `https://ui-avatars.com/api/?name=${data.order.userId.firstName + '+' + data.order.userId.lastName}&background=cccccc&color=555555&rounded=true`,
                });
              } else {
                setDisputeModalVisible({
                  visible: !disputeModalvisible.visible,
                  type: 'user',
                });
              }
            }}
            style={[
              gutters.padding_16,
              borders.rounded_16,
              layout.itemsCenter,
              gutters.marginBottom_24,
              {
                backgroundColor: '#1976D2',
                width: '90%',
                alignSelf: 'center',
              },
            ]}
          >
            <Text style={[fonts.bold, fonts.size_24, { color: 'white' }]}>
              Contact User
            </Text>
          </RNBounceable>
        )}
        {data.order.status !== 'cancelled' &&
          data.order.status !== 'delivered' && (
            <RNBounceable
              onPress={() => {
                if (data.order.status === 'pending') {
                  setVisible(true);
                } else if (data.order.status === 'assigned') {
                  Alert.alert(
                    'Update Status',
                    'Are you sure you want to update the status to In Transit?',
                    [
                      {
                        text: 'Cancel',
                        onPress: () => console.log('Cancel Pressed'),
                        style: 'cancel',
                      },
                      {
                        text: "Yes, I'm sure",
                        onPress: async () => {
                          try {
                            await updateStatusMutateAsync({
                              token: auth.token,
                              orderId: data.order._id,
                              status: 'in_transit',
                            });
                            toast.success('Order Status Updated Successfully');
                          } catch (error) {
                            console.error('Error updating status:', error);
                          }
                        },
                      },
                    ],
                    { cancelable: false },
                  );
                } else if (data.order.status === 'in_transit') {
                  Alert.alert(
                    'Update Status',
                    'Are you sure you want to update the status to delivered?',
                    [
                      {
                        text: 'Cancel',
                        onPress: () => console.log('Cancel Pressed'),
                        style: 'cancel',
                      },
                      {
                        text: "Yes, I'm sure",
                        onPress: async () => {
                          try {
                            await updateStatusMutateAsync({
                              token: auth.token,
                              orderId: data.order._id,
                              status: 'delivered',
                            });
                            toast.success('Order Status Updated Successfully');
                          } catch (error) {
                            console.error('Error updating status:', error);
                          }
                        },
                      },
                    ],
                    { cancelable: false },
                  );
                }
              }}
              style={[
                gutters.padding_16,
                borders.rounded_16,
                layout.itemsCenter,
                gutters.marginBottom_24,
                {
                  backgroundColor:
                    data.order.status === 'disput' ? '#1976D2' : 'tomato',
                  width: '90%',
                  alignSelf: 'center',
                },
              ]}
            >
              <Text style={[fonts.bold, fonts.size_24, { color: 'white' }]}>
                {data.order.status === 'pending'
                  ? 'Assign Agent'
                  : data.order.status === 'cancelled'
                    ? 'Contact Support'
                    : data.order.status === 'disput'
                      ? 'Contact Support'
                      : 'Update Status'}
              </Text>
            </RNBounceable>
          )}
      </>
      <Modal
        animationType="slide"
        transparent
        visible={visible}
        onRequestClose={() => {
          setVisible(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, backgrounds.gray800]}>
            <Text style={[styles.title]}>
              {data.order.status === 'assigned'
                ? 'Assign Agent'
                : 'Update Status'}
            </Text>

            <Picker
              selectedValue={selectedAgent}
              onValueChange={setSelectedAgent}
              style={fonts.gray800}
            >
              <Picker.Item label="Select an agent" value="" />
              {agents.map((agent) => (
                <Picker.Item
                  key={agent._id}
                  label={agent.name}
                  value={agent._id}
                />
              ))}
            </Picker>

            <View style={styles.buttonRow}>
              <RNBounceable
                disabled={assignAgentPending}
                onPress={() => {
                  setSelectedAgent('');
                  setVisible(false);
                }}
                style={[styles.button, { backgroundColor: colors.gray400 }]}
              >
                <Text style={{ color: 'white' }}>Cancel</Text>
              </RNBounceable>
              <RNBounceable
                disabled={assignAgentPending}
                onPress={async () => {
                  if (selectedAgent) {
                    try {
                      await assignAgent({
                        token: auth.token,
                        orderId: data.order._id,
                        agentId: selectedAgent,
                      });
                      toast.success('Agent Assigned Successfully');
                    } catch (error) {}

                    setSelectedAgent('');
                    setVisible(false);
                  }
                }}
                style={[styles.button, { backgroundColor: colors.skeleton }]}
              >
                <Text style={{ color: 'white' }}>Confirm</Text>
              </RNBounceable>
            </View>
          </View>
        </View>
      </Modal>
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
                {disputeModalvisible.type === 'user'
                  ? 'Contact User'
                  : auth.superAdmin
                    ? 'Contact Auction House'
                    : 'Contact Bid Darbaar'}
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
              Title
            </Text>
            <Controller
              control={control}
              name={'title'}
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

            {errors.title && (
              <Text style={{ color: 'red' }}>{errors.title.message}</Text>
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
                if (disputeModalvisible.type === 'user') {
                  await onUserSubmit();
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
                  Send Message
                </Text>
              )}
            </RNBounceable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    borderRadius: 16,
    padding: 20,
  },
  title: {
    fontSize: 20,
    marginBottom: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  button: {
    padding: 10,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 5,
  },
});
