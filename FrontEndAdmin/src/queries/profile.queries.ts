import { useMutation, useQuery } from '@tanstack/react-query';
import { REACT_QUERY_KEYS } from '.';
import {
  changeProfilePicture,
  getAuctionHouseProfile,
  editAuctionHouseProfile,
} from '@/api/userProfile';
import { useStores } from '@/stores';
import { queryClient } from '@/App';

export function useGetAuctionHouseProfile() {
  const { auth } = useStores();
  const token = auth.token;
  return useQuery({
    queryKey: [REACT_QUERY_KEYS.AuctionProfileQueries.getAuctionHouseProfile],
    queryFn: () => getAuctionHouseProfile(token),
  });
}

export function useChangeProfilePicture() {
  return useMutation({
    mutationKey: [REACT_QUERY_KEYS.authQueries.forgotPassword],
    mutationFn: (values: changeAuctionHouseProfilePictureRequest) =>
      changeProfilePicture(values),
    onSuccess(data) {
      queryClient.setQueryData(
        [REACT_QUERY_KEYS.AuctionProfileQueries.getAuctionHouseProfile],
        data,
      );
    },
  });
}

export function useEditAuctionHouseProfile() {
  return useMutation({
    mutationKey: [REACT_QUERY_KEYS.authQueries.editAuctionHouseProfile],
    mutationFn: (values: editAuctionHouseProfileRequest) => {
      return editAuctionHouseProfile(values);
    },
    onSuccess(data) {
      queryClient.setQueryData(
        [REACT_QUERY_KEYS.AuctionProfileQueries.getAuctionHouseProfile],
        data,
      );
    },
  });
}
