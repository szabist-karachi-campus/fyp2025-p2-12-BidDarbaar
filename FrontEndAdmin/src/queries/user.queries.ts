import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { REACT_QUERY_KEYS } from '.';
import { deleteAuctionUser, getAnalytics, getUsers } from '@/api/user';

export function useGetAllUsers(values: getUsers) {
  return useQuery({
    queryKey: [REACT_QUERY_KEYS.userQueries.getAllUsers],
    queryFn: () => getUsers(values),
  });
}
export function useGetAnalytics(token: string) {
  return useQuery({
    queryKey: [REACT_QUERY_KEYS.userQueries.getAnalytics],
    queryFn: () => getAnalytics(token),
  });
}

export function useDeleteAuctionHouseUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: [REACT_QUERY_KEYS.userQueries.deleteAuctionUser],
    mutationFn: (values: deleteAuctionHouseUserRequest) =>
      deleteAuctionUser(values),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [REACT_QUERY_KEYS.userQueries.getAllUsers],
      });
    },
  });
}
