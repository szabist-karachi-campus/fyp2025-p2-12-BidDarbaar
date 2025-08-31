import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { REACT_QUERY_KEYS } from '.';
import {
  userLogin,
  userSignup,
  verifyOTP,
  forgotPassword,
  isResetTokenValid,
  changePassword,
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
export function useUserLogin() {
  const { auth } = useStores();
  return useMutation({
    mutationKey: [REACT_QUERY_KEYS.authQueries.userLogin],
    mutationFn: (values: loginRequest) => userLogin(values),
    onSuccess: (data) => {
      auth.set('token', data.token);
      auth.set('expiresAt', data.expiresAt);
    },
  });
}

export function useUserSignup() {
  return useMutation({
    mutationKey: [REACT_QUERY_KEYS.authQueries.userSignup],
    mutationFn: (values: signupRequest) => userSignup(values),
    onError: (error: any) => {
      const formattedError = new CustomError(
        error?.response?.data?.message || 'An unknown error occurred',
        error.message,
        error.stack,
      );
      throw formattedError;
    },
  });
}

export function useVerifyOTP() {
  return useMutation({
    mutationKey: [REACT_QUERY_KEYS.authQueries.verifyOTP],
    mutationFn: (values: otpRequest) => verifyOTP(values),
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
    mutationFn: (values: changePasswordRequestQuery) => changePassword(values),
  });
}
