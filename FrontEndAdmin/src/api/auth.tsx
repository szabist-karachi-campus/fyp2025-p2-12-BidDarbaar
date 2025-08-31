import Client from '../../client/index';

export async function auctionHouseLogin(values: loginRequest) {
  const data = await Client.post('/auction-house-sign-in', values);
  return data.data;
}
export async function auctionHouseSignUp(values: signUpRequest) {
  const data = await Client.post('/auction-house-sign-up', values);
  return data.data;
}
export async function verifyOtp(values: otpRequest) {
  const data = await Client.post('/verify-otp-admin', values);
  return data.data;
}
export async function forgotPassword(values: forgotPasswordRequest) {
  const data = await Client.post('/forgot-password-admin', values);
  return data.data;
}
export async function isResetTokenValid(values: isResetTokenValidRequest) {
  const data = await Client.post('/reset-password', values);
  return data.data;
}
export async function changePassword(values: changePasswordRequest) {
  const data = await Client.post('/change-password-admin', values);
  return data.data;
}
export async function auctionHouseUserSignUp(values: userSignUpRequest) {
  try {
    const data = await Client.post('/auction-house-user-sign-up', values, {
      headers: {
        Authorization: `jwt ${values.token}`,
        auctionHouseId: values.auctionHouseId,
      },
    });
    return data.data;
  } catch (error) {
    console.error('Error during user creation:', error);
  }
}

export async function auctionHouseUserLogin(values: userLoginRequest) {
  const data = await Client.post('/auction-house-user-sign-in', values);
  return data.data;
}
