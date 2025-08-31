import { useMutation, useQuery } from '@tanstack/react-query';
import { REACT_QUERY_KEYS } from '.';
import {
  fetchAuctionItem,
  fetchAuctionItems,
  fetchCategories,
  fetchFavoriteAuctionItems,
  fetchWonAuctionItems,
  toggleFavourite,
} from '@/api/items';
import { queryClient } from '@/App';

export function useFetchAuctionItems(token: string) {
  return useQuery({
    queryKey: [REACT_QUERY_KEYS.listingQueries.getAuctionItems],
    queryFn: () => fetchAuctionItems(token),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
}
export function useFetchWonAuctionItems(token: string) {
  return useQuery({
    queryKey: [REACT_QUERY_KEYS.listingQueries.getWonAuctionItem],
    queryFn: () => fetchWonAuctionItems(token),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
}

export function useFetchAuctionItem(values: useFetchAuctionItemRequestQuery) {
  return useQuery({
    queryKey: [REACT_QUERY_KEYS.listingQueries.getAuctionItem],
    queryFn: () => fetchAuctionItem(values),
    enabled: !!values.token && !!values.itemId,
  });
}

export function useFetchFavoriteAuctionItems(token: string) {
  return useQuery({
    queryKey: [REACT_QUERY_KEYS.listingQueries.getFavoriteAuctionItems],
    queryFn: () => fetchFavoriteAuctionItems(token),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
}

export function useToggleFavourites() {
  return useMutation({
    mutationKey: [REACT_QUERY_KEYS.listingQueries.toggleFavourite],
    mutationFn: (values: toggleFavouriteRequest) => {
      return toggleFavourite(values);
    },
    onSuccess(data) {
      queryClient.invalidateQueries({
        queryKey: [REACT_QUERY_KEYS.listingQueries.getFavoriteAuctionItems],
      });
    },
  });
}

export function useFetchCategories() {
  return useQuery({
    queryKey: [REACT_QUERY_KEYS.listingQueries.getCategories],
    queryFn: fetchCategories,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
}
