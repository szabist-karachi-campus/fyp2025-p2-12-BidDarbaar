import { useMutation, useQuery } from '@tanstack/react-query';
import { REACT_QUERY_KEYS } from '.';
import {
  getChat,
  getChats,
  getUserAdminThread,
  startThreadOrSendMessage,
} from '@/api/message';
import { queryClient } from '@/App';

export function useStartThreadOrSendMessage() {
  return useMutation({
    mutationKey: [REACT_QUERY_KEYS.messageQueries.startThreadOrSendMessage],
    mutationFn: (values: startMessageRequest) =>
      startThreadOrSendMessage(values),
    onSuccess(data, values) {
      queryClient.invalidateQueries({
        queryKey: [REACT_QUERY_KEYS.messageQueries.getUserAdminThreads],
      });
      queryClient.invalidateQueries({
        queryKey: [REACT_QUERY_KEYS.messageQueries.getChats],
      });
      queryClient.invalidateQueries({
        queryKey: [
          REACT_QUERY_KEYS.messageQueries.getChat +
            values.itemId +
            values.receiverModel,
        ],
      });
    },
  });
}

export function useGetUserAdminThread() {
  return useQuery({
    queryKey: [REACT_QUERY_KEYS.messageQueries.getUserAdminThreads],
    queryFn: () => getUserAdminThread,
  });
}

export function useGetChats(token: string) {
  return useQuery({
    queryKey: [REACT_QUERY_KEYS.messageQueries.getChats],
    queryFn: () => getChats(token),
    enabled: !!token,

    refetchInterval: 6000,
  });
}
export function useGetChat(values: getChatRequest) {
  return useQuery({
    queryKey: [
      REACT_QUERY_KEYS.messageQueries.getChat + values.itemId,
      values.context,
    ],
    queryFn: () => getChat(values),
    enabled: !!values.token && !!values.itemId,
    refetchInterval: 6000,
  });
}
