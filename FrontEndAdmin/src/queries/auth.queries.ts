import { useMutation } from '@tanstack/react-query';
import { REACT_QUERY_KEYS } from '.';
import {
  auctionHouseLogin,
  auctionHouseSignUp,
  verifyOtp,
  forgotPassword,
  changePassword,
  isResetTokenValid,
  auctionHouseUserSignUp,
  auctionHouseUserLogin,
} from '../api/auth';
import { useStores } from '@/stores';

class CustomError extends Error {
  constructor(message: string, name: string, stack?: string) {
    super(message);
    this.name = name;
    if (stack) {
      this.stack = stack;
    }
  }
}
export function useAuctionHouseLogin() {
  const { auth, user } = useStores();
  return useMutation({
    mutationKey: [REACT_QUERY_KEYS.authQueries.userLogin],
    mutationFn: (values: loginRequest) => auctionHouseLogin(values),
    onSuccess: (data) => {
      auth.setMany({ token: data.token, expiresAt: data.expiresAt });
    },
  });
}

export function useAuctionHouseSignUp() {
  return useMutation({
    mutationKey: [REACT_QUERY_KEYS.authQueries.userLogin],
    mutationFn: (values: signUpRequest) => auctionHouseSignUp(values),
  });
}
export function useVerifyOTP() {
  return useMutation({
    mutationKey: [REACT_QUERY_KEYS.authQueries.verifyOTP],
    mutationFn: (values: otpRequest) => verifyOtp(values),
  });
}
export function useForgotPassword() {
  return useMutation({
    mutationKey: [REACT_QUERY_KEYS.authQueries.forgotPassword],
    mutationFn: (values: forgotPasswordRequest) => forgotPassword(values),
  });
}
export function useIsResetTokenValid() {
  return useMutation({
    mutationKey: [REACT_QUERY_KEYS.authQueries.isResetTokenValid],
    mutationFn: (values: isResetTokenValidRequest) => isResetTokenValid(values),
  });
}
export function useChangePassword() {
  return useMutation({
    mutationKey: [REACT_QUERY_KEYS.authQueries.changePassword],
    mutationFn: (values: changePasswordRequest) => changePassword(values),
  });
}
export function useAuctionHouseUserSignUp() {
  return useMutation({
    mutationKey: [REACT_QUERY_KEYS.authQueries.auctionUserSignUp],
    mutationFn: (values: userSignUpRequest) => auctionHouseUserSignUp(values),
  });
}
export function useAuctionHouseUserLogin() {
  return useMutation({
    mutationKey: [REACT_QUERY_KEYS.authQueries.auctionUserLogin],
    mutationFn: (values: loginRequest) => auctionHouseUserLogin(values),
  });
}
