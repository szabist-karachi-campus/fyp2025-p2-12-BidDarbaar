import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { REACT_QUERY_KEYS } from '.';
import {
  createAuctionItems,
  editAuctionItems,
  deleteAuctionItems,
  auctionItemPicture,
  fetchAuctionItems,
  fetchAuctionItem,
} from '../api/items';
import { useStores } from '@/stores';
import { queryClient } from '@/App';

export function useCreateAuctionItems() {
  const { auth } = useStores();
  const token = auth.token;
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: [REACT_QUERY_KEYS.itemQueries.createAuctionItems],
    mutationFn: (values: auctionItemRequest) => createAuctionItems(values),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [REACT_QUERY_KEYS.itemQueries.fetchAuctionItems],
      });
    },
  });
}
export function useEditAuctionItems() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: [REACT_QUERY_KEYS.itemQueries.editAuctionItems],
    mutationFn: (values: editAuctionItemRequest) => editAuctionItems(values),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [REACT_QUERY_KEYS.itemQueries.fetchAuctionItems],
      });
      queryClient.invalidateQueries({
        queryKey: [REACT_QUERY_KEYS.itemQueries.fetchAuctionItem],
      });
    },
  });
}
export function useDeleteAuctionItems() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: [REACT_QUERY_KEYS.itemQueries.deleteAuctionItems],
    mutationFn: (values: deleteAuctionItemRequest) =>
      deleteAuctionItems(values),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [REACT_QUERY_KEYS.itemQueries.fetchAuctionItems],
      });
    },
  });
}
export function useAuctionItemPicture() {
  return useMutation({
    mutationKey: [REACT_QUERY_KEYS.itemQueries.auctionItemPicture],
    mutationFn: (values: AuctionItemPictureRequest) =>
      auctionItemPicture(values),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [REACT_QUERY_KEYS.itemQueries.fetchAuctionItems],
      });
      queryClient.invalidateQueries({
        queryKey: [REACT_QUERY_KEYS.itemQueries.fetchAuctionItem],
      });
    },
  });
}
export function useFetchAuctionItems(token: string) {
  return useQuery({
    queryKey: [REACT_QUERY_KEYS.itemQueries.fetchAuctionItems],
    queryFn: () => fetchAuctionItems(token),
    enabled: !!token,
  });
}

export function useFetchAuctionItem(values: useFetchAuctionItemRequestQuery) {
  return useQuery({
    queryKey: [REACT_QUERY_KEYS.itemQueries.fetchAuctionItem],
    queryFn: () => fetchAuctionItem(values),
    refetchInterval: 1000,
    enabled: !!values.Authorization && !!values.itemid,
  });
}
