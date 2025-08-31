import { useMutation, useQuery } from '@tanstack/react-query';
import { REACT_QUERY_KEYS } from '.';
import { getAds, trackClick } from '@/api/adverts';

export function useGetAds() {
  return useQuery({
    queryKey: [REACT_QUERY_KEYS.advertQueries.getAds],
    queryFn: () => getAds(),
    enabled: true,
  });
}

export function useTrackClick() {
  return useMutation({
    mutationKey: [REACT_QUERY_KEYS.advertQueries.trackClick],
    mutationFn: (values: trackClickRequest) => trackClick(values),
  });
}
