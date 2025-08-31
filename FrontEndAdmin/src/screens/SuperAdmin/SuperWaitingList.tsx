import { View, Text, Alert } from 'react-native';
import React from 'react';
import { useTheme } from '@/theme';
import { FlashList } from '@shopify/flash-list';
import { ActivityIndicator } from 'react-native-paper';
import RNBounceable from '@freakycoder/react-native-bounceable';
import { SafeScreen } from '@/components/templates';
import {

  useGetWaitingList,
  useHandleAuctionHouseStatus,
} from '@/queries/superAdmin.queries';
import { useStores } from '@/stores';
import { toast } from '@backpackapp-io/react-native-toast';
export default function SuperWaitingList() {
  const { layout, variant, gutters, fonts } = useTheme();
  const { auth } = useStores();
  const { data, status, isError, refetch } = useGetWaitingList(auth.token);
 
  const {mutateAsync,isPending}=useHandleAuctionHouseStatus();
  const renderUsers = ({ item }: { item: AuctionHousesType }) => {
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
          <View style={[layout.row, layout.itemsCenter]}>
            <Text
              style={[
                fonts.size_32,
                fonts.bold,
                gutters.marginBottom_12,
                fonts.gray800,
              ]}
            >
              {item.name}
            </Text>
            <Text
              style={[
                fonts.size_12,
                fonts.bold,
                fonts.gray800,
                gutters.marginLeft_12,
              ]}
            >
              {item.verified ? '✅' : '❌'} verified
            </Text>
          </View>
         
        </View>
        <Text style={[fonts.gray800, fonts.size_24, gutters.marginBottom_12]}>
          📧 {item.email}
        </Text>
        <Text style={[fonts.gray800, fonts.size_24, gutters.marginBottom_12]}>
          📱 {item.phoneNumber}
        </Text>
        <View style={[layout.row, layout.justifyBetween, layout.itemsCenter]}>
          <Text style={[fonts.gray800, fonts.size_24]}>🪪 {item.ntn}</Text>
         
        </View>
        <View style={[layout.row,layout.justifyBetween,{height:50,marginTop:12}]} >
            <RNBounceable disabled={isPending} onPress={async ()=>{
                await handleSubmit(item.email,"APPROVE");
            }} style={{width:"45%",backgroundColor:"green",justifyContent:"center",alignItems:"center",borderRadius:10}}>
                {isPending?
                <ActivityIndicator size="small" color="white" />:
                <Text style={[fonts.bold,{color:"white"}]}>APPROVE</Text>}
            </RNBounceable>
            <RNBounceable
                disabled={isPending}
             onPress={async ()=>{
                await handleSubmit(item.email,"REJECT");
            }} 
             style={{width:"45%",backgroundColor:"red",justifyContent:"center",alignItems:"center",borderRadius:10}}>
                {isPending?
                <ActivityIndicator size="small" color="white" />
                :
                <Text style={[fonts.bold,{color:"white"}]}>REJECT</Text>
            }
            </RNBounceable>
        </View>
      </View>
    );
  };

  const onHandle=async(email:string,status:"APPROVE"|"REJECT")=>{
      await mutateAsync({
            token: auth.token,
            email: email,
            status: status,
        })
  }
  const handleSubmit = async (email:string,status:"APPROVE"|"REJECT") => {
        Alert.alert(
          `Are you sure you want to ${status} this auction house?`,
          '',
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
                text: 'OK',
                onPress: async () => {
                  try {
                    await onHandle(email,status);
                    toast.success(`Auction house ${status.toLowerCase()}d successfully!`);

                    } catch (error) {
                    toast.error(`Error ${status==="APPROVE"?"approving":"rejecting"} auction house`);
                  }
                }
            },
          ],
          { cancelable: true }
        );
      
  }
  return (
    <SafeScreen noPadding isError={isError} onResetError={refetch}>
      <View
        style={[
          layout.flex_1,
          layout.fullWidth,
          gutters.paddingHorizontal_12,
          gutters.paddingTop_12,
        ]}
      >
        <FlashList
          data={data?.waitingList}
          renderItem={renderUsers}
          estimatedItemSize={100}
          keyExtractor={(item) => item._id.toString()}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View
              style={[layout.flex_1, layout.itemsCenter, layout.justifyCenter]}
            >
              <Text style={[fonts.size_24, fonts.bold, fonts.gray800,fonts.alignCenter]}>
                No Auction Houses Found In Waiting List
              </Text>
            </View>
          }
          ListFooterComponent={
            status === 'pending' ? (
              <ActivityIndicator size="large" color="#0000ff" />
            ) : null
          }
        />
      </View>
    </SafeScreen>
  );
}
