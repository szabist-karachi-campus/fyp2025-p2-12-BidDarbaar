import { useMutation, useQuery } from '@tanstack/react-query';
import { REACT_QUERY_KEYS } from '.';
import {
  assignAgent,
  registerAgent,
  getAvailableAgents,
  getAllOrders,
  getAuctionOrder,
  updateOrderStatus,
} from '../api/delivery';
import { useStores } from '@/stores';
import { queryClient } from '@/App';

export function useAssignAgent() {
  return useMutation({
    mutationKey: [REACT_QUERY_KEYS.deliveryQueries.assignAgent],
    mutationFn: (values: AssignAgentRequest) => assignAgent(values),
    onSuccess(data, variables) {
      queryClient.invalidateQueries({
        queryKey: [REACT_QUERY_KEYS.deliveryQueries.getAvailableAgents],
      });
      queryClient.invalidateQueries({
        queryKey: [REACT_QUERY_KEYS.deliveryQueries.getAllOrders],
      });
      queryClient.invalidateQueries({
        queryKey: [REACT_QUERY_KEYS.deliveryQueries.getAuctionOrder],
      });
    },
  });
}

export function useRegisterAgent() {
  return useMutation({
    mutationKey: [REACT_QUERY_KEYS.deliveryQueries.registerAgent],
    mutationFn: (values: registerAgentRequest) => registerAgent(values),
    onSuccess(data, variables) {
      queryClient.invalidateQueries({
        queryKey: [REACT_QUERY_KEYS.deliveryQueries.getAvailableAgents],
      });
    },
  });
}

export function useUpdateOrderStatus() {
  return useMutation({
    mutationKey: [REACT_QUERY_KEYS.deliveryQueries.orderStatus],
    mutationFn: (values: updateOrderStatusRequest) => updateOrderStatus(values),
    onSuccess(data) {
      queryClient.invalidateQueries({
        queryKey: [REACT_QUERY_KEYS.deliveryQueries.getAvailableAgents],
      });
      queryClient.invalidateQueries({
        queryKey: [REACT_QUERY_KEYS.deliveryQueries.getAllOrders],
      });
      queryClient.invalidateQueries({
        queryKey: [REACT_QUERY_KEYS.deliveryQueries.getAuctionOrder],
      });
    },
  });
}

export function useGetAvailableAgents() {
  const { auth } = useStores();
  const token = auth.token;
  return useQuery({
    queryKey: [REACT_QUERY_KEYS.deliveryQueries.getAvailableAgents],
    queryFn: () => getAvailableAgents(token),
  });
}
export function useGetAuctionOrder(values: getAuctionOrderRequest) {
  return useQuery({
    queryKey: [REACT_QUERY_KEYS.deliveryQueries.getAuctionOrder],
    queryFn: () => getAuctionOrder(values),
  });
}

export function useGetAllOrders(values: getAllOrdersRequest) {
  return useQuery({
    queryKey: [REACT_QUERY_KEYS.deliveryQueries.getAllOrders],
    queryFn: () => getAllOrders(values),
  });
}
