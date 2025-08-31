import { useMutation, useQuery } from '@tanstack/react-query';
import { REACT_QUERY_KEYS } from '.';
import { getItemCategory } from '../api/categories';
import { useStores } from '@/stores';

export function useGetItemCategory() {
  return useQuery({
    queryKey: [REACT_QUERY_KEYS.categoryQueries.getItemCategory],
    queryFn: () => getItemCategory(),
  });
}
