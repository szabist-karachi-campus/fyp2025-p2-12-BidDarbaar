import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { REACT_QUERY_KEYS } from '.';
import {
  createAd,
  editAd,
  getActiveAds,
  getAd,
  getAdPerformance,
  getMinBid,
  isItemAdActive,
  trackView,
  getAuctionAds,
} from '../api/ads';
import { useStores } from '@/stores';

export function useCreateAd() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [REACT_QUERY_KEYS.adQueries.createAd],
    mutationFn: (values: createAdRequest) => createAd(values),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [REACT_QUERY_KEYS.adQueries.getActiveAds],
      });
      queryClient.invalidateQueries({
        queryKey: [REACT_QUERY_KEYS.adQueries.getAdPerformance],
      });
       queryClient.invalidateQueries({
        queryKey: [REACT_QUERY_KEYS.userQueries.getAnalytics],
      });
    },
  });
}
export function useIsItemAdActive(id: string) {
  return useQuery({
    queryKey: [REACT_QUERY_KEYS.adQueries.isItemAdActive, id],
    queryFn: () => isItemAdActive({ itemId: id }),
    enabled: !!id,
  });
}

export function useGetAdPerformance(values: getAdPerformanceRequest) {
  return useQuery({
    queryKey: [REACT_QUERY_KEYS.adQueries.getAdPerformance],
    queryFn: () => getAdPerformance(values),
    enabled: !!values.adId,
  });
}

export function useGetActiveAds() {
  return useQuery({
    queryKey: [REACT_QUERY_KEYS.adQueries.getActiveAds],
    queryFn: getActiveAds,
  });
}

export function useEditAd() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [REACT_QUERY_KEYS.adQueries.editAd],
    mutationFn: (values: editAdRequest) => editAd(values),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [REACT_QUERY_KEYS.adQueries.getActiveAds],
      });
      queryClient.invalidateQueries({
        queryKey: [REACT_QUERY_KEYS.adQueries.getAdPerformance],
      });
      queryClient.invalidateQueries({
        queryKey: [REACT_QUERY_KEYS.adQueries.getAd],
      });
      queryClient.invalidateQueries({
        queryKey: [REACT_QUERY_KEYS.adQueries.isItemAdActive],
      });
      queryClient.invalidateQueries({
        queryKey: [REACT_QUERY_KEYS.userQueries.getAnalytics],
      });
    },
  });
}

export function useTrackView() {
  const { auth } = useStores();
  const token = auth.token;
  return useMutation({
    mutationKey: [REACT_QUERY_KEYS.adQueries.getAdPerformance],
    mutationFn: (values: TrackViewRequest) => trackView(values),
    onSuccess: () => {
    },
  });
}

export function useGetMinBid() {
  return useQuery({
    queryKey: [REACT_QUERY_KEYS.adQueries.getMinBid],
    queryFn: getMinBid,
  });
}

export function useGetAd(id: string) {
  return useQuery({
    queryKey: [REACT_QUERY_KEYS.adQueries.getAd],
    queryFn: () => getAd(id),
    enabled: !!id,
  });
}

export function useAuctionHouseAds(token: string) {
  return useQuery({
    queryKey: [REACT_QUERY_KEYS.adQueries.getAuctionAds],
    queryFn: () => getAuctionAds(token),
    enabled: !!token,
  });
}
