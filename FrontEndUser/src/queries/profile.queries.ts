import { useMutation, useQuery } from '@tanstack/react-query';
import { REACT_QUERY_KEYS } from '.';
import {
  changeProfilePicture,
  editUserProfile,
  getUserProfile,
  getUserWallet,
  updateLocation,
} from '@/api/userProfile';
import { useStores } from '@/stores';
import { queryClient } from '@/App';

export function useGetUserProfile() {
  const { auth } = useStores();
  const token = auth.token;
  return useQuery({
    queryKey: [REACT_QUERY_KEYS.profileQueries.getUserProfile],
    queryFn: () => getUserProfile(token),
  });
}
export function useGetUserWallet() {
  const { auth } = useStores();
  const token = auth.token;
  return useQuery({
    queryKey: [REACT_QUERY_KEYS.profileQueries.getUserWallet],
    queryFn: () => getUserWallet(token),
  });
}

export function useChangeProfilePicture() {
  return useMutation({
    mutationKey: [REACT_QUERY_KEYS.authQueries.forgotPassword],
    mutationFn: (values: changeProfilePictureRequestQuery) =>
      changeProfilePicture(values),
    onSuccess(data) {
      queryClient.setQueryData(
        [REACT_QUERY_KEYS.profileQueries.getUserProfile],
        data,
      );
    },
  });
}

export function useEditUserProfile() {
  return useMutation({
    mutationKey: [REACT_QUERY_KEYS.authQueries.editUserProfile],
    mutationFn: (values: useEditUserProfileRequestQuery) => {
      return editUserProfile(values);
    },
    onSuccess(data) {
      queryClient.setQueryData(
        [REACT_QUERY_KEYS.profileQueries.getUserProfile],
        data,
      );
    },
  });
}
export function useUpdateLocation() {
  return useMutation({
    mutationKey: [REACT_QUERY_KEYS.profileQueries.updateLocation],
    mutationFn: (values: updateLocationRequest) => {
      return updateLocation(values);
    },
    onSuccess(data) {
      queryClient.setQueryData(
        [REACT_QUERY_KEYS.profileQueries.getUserProfile],
        data,
      );
    },
  });
}
