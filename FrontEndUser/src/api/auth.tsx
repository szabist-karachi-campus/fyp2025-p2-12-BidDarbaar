import Client from '../../client/index';

export async function userLogin(values: loginRequest) {
  const data = await Client.post('/sign-in', values);
  return data.data;
}

export async function userSignup(values: signupRequest) {
  const data = await Client.post('/sign-up', values);
  return data.data;
}

export async function verifyOTP(values: otpRequest) {
  const data = await Client.post('/verify-otp', values);
  return data.data;
}
export async function forgotPassword(values: forgotPasswordRequest) {
  const data = await Client.post('/forgot-password', values);
  return data.data;
}
export async function isResetTokenValid(values: isResetTokenValidRequest) {
  const data = await Client.post('/reset-password', values);
  return data.data;
}

export async function changePassword(values: changePasswordRequestQuery) {
  const data = await Client.post('/change-password', values);
  return data.data;
}
