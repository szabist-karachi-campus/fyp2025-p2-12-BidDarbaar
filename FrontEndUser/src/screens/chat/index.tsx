import { useStores } from '@/stores';
import { RootStackParamList } from '@/types/navigation';
import { toast } from '@backpackapp-io/react-native-toast';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import {
  useGetChat,
  useStartThreadOrSendMessage,
} from '@/queries/messages.queries';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import RNBounceable from '@freakycoder/react-native-bounceable';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Avatar } from 'react-native-paper';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { logo } from '../../../assets/images';
import { queryClient } from '@/App';
import { REACT_QUERY_KEYS } from '@/queries';

type ChatScreenScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'ChatScreen'
>;
type ChatScreenRouteProp = RouteProp<RootStackParamList, 'ChatScreen'>;

const ChatScreen = () => {
  const route = useRoute<ChatScreenRouteProp>();
  const id = route.params.id;
  const { auth } = useStores();
  const navigation = useNavigation<ChatScreenScreenNavigationProp>();

  const { mutateAsync, isPending } = useStartThreadOrSendMessage();

  const image = route.params?.image;
  const name = route.params?.name;
  const itemId = route.params?.id;
  const isSuperAdmin = route.params.superAdmin;
  const context = route.params.context;
  const receiverId = route.params?.receiverId;

  const { data, isLoading, isError } = useGetChat({
    token: auth.token,
    itemId: itemId,
    context,
  });
  const flatListRef = useRef<FlatList>(null);

  function formatTo12HourTime(isoString: string): string {
    const date = new Date(isoString);
    const options: Intl.DateTimeFormatOptions = {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    };
    return date.toLocaleTimeString(undefined, options);
  }
  const [inputText, setInputText] = useState('');
  const [localMessages, setLocalMessages] = useState<any[]>([]);
  const sendMessage = async () => {
    if (!inputText.trim()) return;

    try {
      if (context === 'SuperAdmin') {
        await mutateAsync({
          token: auth.token,
          message: inputText.trim(),
          title: data.thread.title,
          receiverModel: 'SuperAdmin',
          itemId: id,
        });
        queryClient.invalidateQueries({
          queryKey: [
            REACT_QUERY_KEYS.messageQueries.getChat + id,
            'SuperAdmin',
          ],
        });
      } else {
        await mutateAsync({
          token: auth.token,
          message: inputText.trim(),
          title: data.thread.title,
          receiverModel: 'AuctionHouse',
          receiverId: receiverId,
          itemId: id,
        });
        queryClient.invalidateQueries({
          queryKey: [
            REACT_QUERY_KEYS.messageQueries.getChat + id,
            'AuctionHouse',
          ],
        });
      }
      toast.success('Message sent successfully!');
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    } catch (error) {
      console.error('Error sending message:', error);
    }

    setInputText('');
  };
  function getDateSeparator(dateString: string): string {
    const messageDate = new Date(dateString);
    const now = new Date();

    const diffTime = now.getTime() - messageDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) {
      return messageDate.toLocaleDateString(undefined, { weekday: 'long' }); // e.g., Monday
    }

    return messageDate.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <View
          style={{
            flexDirection: 'row',
            gap: 15,
            marginRight: 20,
            justifyContent: 'center',
          }}
        >
          <RNBounceable onPress={() => navigation.goBack()}>
            <Ionicons
              name="chevron-back"
              size={25}
              style={{ marginTop: 5, fontWeight: 'bold' }}
              color="white"
            />
          </RNBounceable>
          <RNBounceable style={{}}>
            <Avatar.Image
              source={
                isSuperAdmin
                  ? logo
                  : {
                      uri: image,
                    }
              }
              size={40}
              style={{ backgroundColor: 'white' }}
            />
          </RNBounceable>
        </View>
      ),
      headerTitle: name,
    });
  }, [navigation]);
  const renderItem = ({ item }: { item: any }) => {
    console.log('item', item);
    if (item.type === 'separator') {
      return (
        <View style={styles.separatorContainer}>
          <Text style={styles.separatorText}>{item.label}</Text>
        </View>
      );
    }
    const isMyMessage = item.senderModel === 'User' ? true : false;
    const time = formatTo12HourTime(item.timestamp);
    return (
      <View
        style={[
          styles.messageBubble,
          isMyMessage ? styles.myMessage : styles.theirMessage,
        ]}
      >
        <Text style={[styles.messageText, isMyMessage && { color: 'white' }]}>
          {item.message}
        </Text>
        <Text style={[styles.messageTime, isMyMessage && { color: 'white' }]}>
          {time}
        </Text>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Error fetching data</Text>
      </View>
    );
  }

  console.log('data', data);

  let rawChat = data.thread.chats || [];

  const chatWithSeparators = [];
  let lastDate = '';

  for (let msg of rawChat) {
    const msgDate = new Date(msg.timestamp).toDateString();

    if (msgDate !== lastDate) {
      chatWithSeparators.push({
        id: `separator-${msgDate}`,
        type: 'separator',
        label: getDateSeparator(msg.timestamp),
      });
      lastDate = msgDate;
    }

    chatWithSeparators.push({ ...msg, type: 'message' });
  }
  return (
    <KeyboardAwareScrollView contentContainerStyle={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <FlatList
          ref={flatListRef}
          data={chatWithSeparators}
          keyExtractor={(item) => Math.random().toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.messageList}
          inverted
        />

        <View
          style={[
            styles.inputContainer,
            { marginHorizontal: 10, marginBottom: 20 },
          ]}
        >
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message"
            style={styles.input}
          />
          <RNBounceable disabled={isPending} onPress={sendMessage}>
            <Icon name="send" size={24} color="#1976D2" />
          </RNBounceable>
        </View>
      </View>
    </KeyboardAwareScrollView>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EFEFEF',
  },
  messageList: {
    padding: 10,
    flexDirection: 'column-reverse',
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 15,
    marginVertical: 5,
    borderRadius: 25,
    paddingTop: 15,
  },
  myMessage: {
    backgroundColor: '#1976D2',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 0,
  },
  theirMessage: {
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 0,
  },
  messageText: {
    fontSize: 16,
  },
  messageTime: {
    fontSize: 10,
    color: '#666',
    alignSelf: 'flex-end',
    marginTop: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 10,
    borderTopWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    borderRadius: 1000,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 10,
  },
  separatorContainer: {
    alignItems: 'center',
    marginVertical: 10,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: 'white',
    padding: 10,
    paddingHorizontal: 20,
    borderRadius: 1000,
    backgroundColor: '#1976D2',
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ccc',
    marginHorizontal: 10,
  },
  separatorText: {
    fontSize: 12,
    color: 'white',
    fontWeight: 'bold',
  },
});
