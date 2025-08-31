const serviceAccount = require('.././config/biddarbaarnew-firebase-adminsdk-fbsvc-600357c03b.json');



const adminAppServiceAccount = require('.././config/biddarbaaradmin-firebase-adminsdk-fbsvc-3627d09b87.json');
const admin = require('firebase-admin');

const userApp = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const adminApp = admin.initializeApp(
    {
      credential: admin.credential.cert(adminAppServiceAccount),
    },
    'adminApp',
  );

const sendUserNotification = async (deviceToken, title, body) => {
  try {
    await userApp.messaging().send({
      token: deviceToken,
      notification: { title, body },
      data: { key1: 'value1', key2: 'value2' },
    });
    console.log('Notification sent to user successfully');
  } catch (error) {
    console.error('Error sending user notification:', error);
  }
};

const sendNotificationToAdminApp = async (deviceToken, title, body) => {
  try {
    const message = {
      token: deviceToken,
      notification: { title, body },
      data: {
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
        type: 'admin_notification',
      },
    };

    const response = await adminApp.messaging().send(message);
    console.log('Notification sent to admin app:', response);
  } catch (error) {
    console.error('Error sending admin notification:', error);
  }
};

module.exports = {
  sendUserNotification,
  sendNotificationToAdminApp,
};