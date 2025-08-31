import {
  deleteAuctionItem,
  getAllAuctionHouses,
  getAllUsers,
  getCategory,
  getItem,
  getOneUser,
  createSuperAdmin,
  getSuperAdmin,
  getWaitingList,
  handleAuctionHouseStatus,
} from '@/api/superAdmin';
import { useStores } from '@/stores';
import { REACT_QUERY_KEYS } from '.';
import { useMutation, useQuery } from '@tanstack/react-query';
import { addCategory, editCategory } from '@/api/categories';
import { queryClient } from '@/App';

export function useGetAllAuctionHouses() {
  const { auth } = useStores();
  const token = auth.token;
  return useQuery({
    queryKey: [REACT_QUERY_KEYS.superAdminQueries.getAllAuctionHouses],
    queryFn: () => getAllAuctionHouses(token),
  });
}
export function useGetAllUsers() {
  const { auth } = useStores();
  const token = auth.token;
  return useQuery({
    queryKey: [REACT_QUERY_KEYS.superAdminQueries.getAllUsers],
    queryFn: () => getAllUsers(token),
  });
}

export function useDeleteAuctionHouse() {
  return useMutation({
    mutationKey: [REACT_QUERY_KEYS.superAdminQueries.deleteAuctionHouse],
    mutationFn: (values: deleteAuctionHouseRequest) =>
      deleteAuctionItem(values),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [REACT_QUERY_KEYS.superAdminQueries.getAllAuctionHouses],
      });
    },
  });
}

export function useGetOneUser() {
  return useMutation({
    mutationKey: [REACT_QUERY_KEYS.superAdminQueries.getOneUser],
    mutationFn: (values: getOneUserRequest) => getOneUser(values),
    onSuccess: () => {},
  });
}

export function useAddCategory() {
  return useMutation({
    mutationKey: [REACT_QUERY_KEYS.superAdminQueries.addCategory],
    mutationFn: (values: addCategoriesRequest) => addCategory(values),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [REACT_QUERY_KEYS.categoryQueries.getItemCategory],
      });
    },
  });
}
export function useEditCategory() {
  return useMutation({
    mutationKey: [REACT_QUERY_KEYS.superAdminQueries.editCategory],
    mutationFn: (values: editCategoryRequest) => editCategory(values),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [REACT_QUERY_KEYS.categoryQueries.getItemCategory],
      });
    },
  });
}

export function useGetCategory(values: getCategoryRequest) {
  return useQuery({
    queryKey: [REACT_QUERY_KEYS.superAdminQueries.getCategory],
    queryFn: () => getCategory(values),
  });
}
export function useGetItem(values: getItemRequest) {
  return useQuery({
    queryKey: [REACT_QUERY_KEYS.superAdminQueries.getItem],
    queryFn: () => getItem(values),
  });
}

export function useCreateSuperAdmin() {
  return useMutation({
    mutationKey: [REACT_QUERY_KEYS.superAdminQueries.createSuperAdmin],
    mutationFn: (values: createSuperAdminRequest) => createSuperAdmin(values),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [REACT_QUERY_KEYS.superAdminQueries.getSuperAdmin],
      });
    },
  });
}

export function useGetSuperAdmin(values: getSuperAdminRequest) {
  return useQuery({
    queryKey: [REACT_QUERY_KEYS.superAdminQueries.getSuperAdmin],
    queryFn: () => getSuperAdmin(values),
  });
}
export function useGetWaitingList(token: string) {
  return useQuery({
    queryKey: [REACT_QUERY_KEYS.superAdminQueries.getWaitingList],
    queryFn: () => getWaitingList(token),
    enabled: !!token,
    refetchInterval: 60000,
  });
}

export function useHandleAuctionHouseStatus() {
  return useMutation({
    mutationKey: [REACT_QUERY_KEYS.superAdminQueries.handleAuctionHouseStatus],
    mutationFn: (values: handleAuctionHouseStatusRequest) =>
      handleAuctionHouseStatus(values),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [REACT_QUERY_KEYS.superAdminQueries.getWaitingList],
      });
      queryClient.invalidateQueries({
        queryKey: [REACT_QUERY_KEYS.superAdminQueries.getAllAuctionHouses],
      });
    },
  });
}
