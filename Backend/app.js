const express = require('express');

const app = express();
const User = require('./models/user');
const userRouter = require('./routes/user');
const auctionHouseRouter = require('./routes/auctionHouse');
const deliveryRouter = require('./routes/delivery');
const adRouter = require('./routes/adRoutes');
const superAdminRouter = require('./routes/superAdmin');
const messagesRouter = require('./routes/messageRoutes');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const walletPaymentRoutes = require('./routes/walletpayments');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Wallet = require('./models/wallet');
const auctionHouse = require('./models/auctionHouse');
const { ApolloServer } = require('apollo-server-express');
const typeDefs = require('./graphql/schema');
const resolvers = require('./graphql/resolver');
require('./controllers/auctionCronJob');
require('dotenv').config();

require('./models/db');
// const admin = require('firebase-admin');
// const serviceAccount = require('./config/biddarbaarnew-firebase-adminsdk-fbsvc-600357c03b.json');

// const userApp = admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
// });

// const adminAppServiceAccount = require('./config/biddarbaaradmin-firebase-adminsdk-fbsvc-3627d09b87.json');
const AuctionHouseWallet = require('./models/auctionWallet');
const paymentHold = require('./models/paymentHold');
const { sendUserNotification, sendNotificationToAdminApp } = require('./utils/notifications');
// const adminApp = admin.initializeApp(
//   {
//     credential: admin.credential.cert(adminAppServiceAccount),
//   },
//   'adminApp', // Named instance for the admin app
// );

// const sendUserNotification = async (deviceToken, title, body) => {
//   try {
//     await userApp.messaging().send({
//       token: deviceToken,
//       notification: {
//         title: title,
//         body: body,
//       },
//       data: { key1: 'value1', key2: 'value2' }, // Optional data payload
//     });
//     console.log('Notification sent successfully');
//   } catch (error) {
//     console.error('Error sending notification:', error);
//   }
// };

// async function sendNotificationToAdminApp(deviceToken, title, body) {
//   try {
//     const message = {
//       token: deviceToken,
//       notification: {
//         title: title,
//         body: body,
//       },
//       data: {
//         click_action: 'FLUTTER_NOTIFICATION_CLICK',
//         type: 'admin_notification',
//       },
//     };

//     const response = await adminApp.messaging().send(message);
//     console.log('Notification sent to admin app:', response);
//   } catch (error) {
//     console.error('Error sending notification to admin app:', error);
//   }
// }
const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => ({ req }),
  formatError: (error) => {
    return {
      message: error.message,
      code: error.extensions?.code || 'SERVER_ERROR',
      status: error.extensions?.http?.status || 500,
    };
  },
});
async function startServer() {
  await apolloServer.start();
  apolloServer.applyMiddleware({ app, path: '/graphql' });
}
startServer();
app.post(
  '/wallet-payment-webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'];

    try {
      const event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET,
      );

      console.log('✅ Webhook received:', event.type);

      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        const userId = paymentIntent.metadata.userId;
        const amount = paymentIntent.amount/100;

        console.log('PaymentIntent:', paymentIntent);

        if (!userId || !amount) {
          console.error('❌ Missing userId or amount in metadata');
          return res.status(400).send('Missing userId or amount');
        }

        const wallet = await Wallet.findOneAndUpdate(
          { user: userId },
          { $inc: { balance: amount } },
          { new: true },
        );

        if (!wallet) {
          const createdWallet = await Wallet.create({
            user: userId,
            balance: amount,
            transactions: [
              {
                type: 'deposit_completed',
                amount,
                escrowTxId: paymentIntent.id,
                status: 'completed',
              },
            ],
          });
          const updatedUser = await User.findByIdAndUpdate(
            userId,
            { wallet: createdWallet._id },
            { new: true },
          );
          if (!updatedUser) {
            console.error('❌ User not found');
            return res.status(404).send('User not found');
          }
          console.log('✅ Wallet updated:', createdWallet);
          return res.status(201).send('✅ Wallet updated:');
        }

        console.log('✅ Wallet updated:', wallet);
      }

      res.status(200).send('Webhook processed');
    } catch (err) {
      console.error('❌ Webhook error:', err.message);
      res.status(500).send(`Webhook error: ${err.message}`);
    }
  },
);
app.post(
  '/auction-payment-webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'];

    try {
      const event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET_PAYMENT,
      );

      console.log('✅ Webhook received:', event.type);

      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        const userId = paymentIntent.metadata.userId;
        const amount = paymentIntent.amount;
        const holdId = paymentIntent.holdId;
        if (!userId || !amount) {
          console.error('❌ Missing userId or amount in metadata');
          return res
            .status(400)
            .send('Missing userId or amount or auctionHouseId');
        }

        const wallet = await Wallet.findOneAndUpdate(
          { user: userId },
          { $inc: { balance: -amount } },
          { new: true },
        );

        if (!wallet) {
          return res.status(404).send('Wallet not found');
        }
        const hold = await paymentHold.findById(holdId);
        if (!hold) {
          return res.status(404).send('Payment hold not found');
        }

        await paymentHold.findByIdAndUpdate(
          holdId,
          { status: 'completed', amountHeld: amount + hold.amountHeld },
          { new: true },
        );
        console.log('✅ Wallet updated:', wallet);
      }

      res.status(200).send('Webhook processed');
    } catch (err) {
      console.error('❌ Webhook error:', err.message);
      res.status(500).send(`Webhook error: ${err.message}`);
    }
  },
);
app.post(
  '/wallet-AuctionHouse-payment-webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'];

    try {
      const event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_AUCTIONHOUSE_WEBHOOK_SECRET,
      );

      console.log('✅ Webhook received:', event.type);

      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        const AuctionHouseId = paymentIntent.metadata.AuctionHouse;
        const amount = paymentIntent.amount;

        console.log('PaymentIntent:', paymentIntent);

        if (!AuctionHouseId || !amount) {
          console.error('❌ Missing AuctionHouseId or amount in metadata');
          console.error(
            'recieved data',
            AuctionHouseId,
            '  and amount:',
            amount,
          );
          return res.status(400).send('Missing AuctionHouseId or amount');
        }
        
        const wallet = await AuctionHouseWallet.findOneAndUpdate(
          { AuctionHouse: AuctionHouseId },
          { $inc: { balance: amount } },
          { new: true },
        );

        if (!wallet) {
          const createdWallet = await AuctionHouseWallet.create({
            AuctionHouse: AuctionHouseId,
            balance: amount,
            transactions: [
              {
                type: 'deposit_completed',
                amount,
                escrowTxId: paymentIntent.id,
                status: 'completed',
              },
            ],
          });

          const updatedAuctionHouse =
            await auctionHouse.AuctionHouse.findByIdAndUpdate(
              AuctionHouseId,
              { wallet: createdWallet._id },
              { new: true },
            );
          if (!updatedAuctionHouse) {
            console.error('❌ Auction House not found');
            return res.status(404).send('Auction House not found');
          }
          console.log('✅ Wallet updated:', createdWallet);
          return res.status(201).send('✅ Wallet updated:');
        }

        console.log('✅ Wallet updated:', wallet);
      }

      res.status(200).send('Webhook processed');
    } catch (err) {
      console.error('❌ Webhook error:', err.message);
      res.status(500).send(`Webhook error: ${err.message}`);
    }
  },
);

// app.use(bodyParser.json());
app.use(express.json());
app.use(walletPaymentRoutes);
app.use(userRouter);

app.use(auctionHouseRouter);
app.use(adRouter);
app.use(deliveryRouter);
app.use(superAdminRouter);
app.use(messagesRouter);

app.post('/send-user-notification', async (req, res) => {
  const { title, body } = req.body;
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const userId = decoded.userId;
  if (!userId) {
    return res
      .status(400)
      .json({ success: false, message: 'User ID is required!' });
  }
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  const deviceToken = user.deviceToken;
  if (!deviceToken) {
    return res.status(404).json({ message: 'Device token not found' });
  }

  if (!title || !body) {
    return res
      .status(400)
      .json({ error: 'Device token, title, and body are required' });
  }

  try {
    await sendUserNotification(deviceToken, title, body);
    res.status(200).json({ message: 'Notification sent successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

app.post('/send-admin-notification', async (req, res) => {
  const { title, body } = req.body;
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (!title || !body) {
    return res
      .status(400)
      .json({ error: 'Device token, title, and body are required' });
  }
  let deviceToken;
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const auctionHouseId = decoded.auctionHouseId;
  if (!auctionHouseId) {
    return res
      .status(400)
      .json({ success: false, message: 'Auction House ID is required!' });
  }

  let tempAuctionHouse =
    await auctionHouse.AuctionHouse.findById(auctionHouseId);
  if (tempAuctionHouse) {
    deviceToken = tempAuctionHouse.deviceToken;
  }
  if (!tempAuctionHouse) {
    const tempAuctionHouseUser =
      await auctionHouse.AuctionHouseUser.findById(auctionHouseId);
    if (!tempAuctionHouseUser) {
      return res.status(404).json({ message: 'Auction House not found' });
    }
    deviceToken = tempAuctionHouseUser.deviceToken;
    if (!deviceToken) {
      return res.status(404).json({ message: 'Device token not found' });
    }
  }

  try {
    await sendNotificationToAdminApp(deviceToken, title, body);
    res.status(200).json({ message: 'Notification sent successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

app.get('/test', (req, res) => {
  res.send('Hello World');
});

app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  const name = err.name || 'Error';
  const stack = err.stack || '';

  res.status(status).json({
    status,
    message,
    name,
    stack,
  });
});
app.listen(8000, () => {
  console.log('Server is running on port 8000');
});

app.get('/', (req, res) => {
  res.send('<h1 style="color: red;">Hello World </h1>');
  console.log(
    `GraphQL endpoint: http://localhost:${8000}${apolloServer.graphqlPath}`,
  );
});

app.get("/complete", (req, res) => {
  res.send(`
    <html>
      <body style="font-family: sans-serif; text-align: center; padding-top: 100px;">
        <h2>✅ Stripe onboarding complete!</h2>
        <p>You can now return to the app.</p>
      </body>
    </html>
  `);
});
app.get("/reauth", (req, res) => {
  res.send(`
    <html>
      <body style="font-family: sans-serif; text-align: center; padding-top: 100px;">
        <h2>❗ Onboarding incomplete</h2>
        <p>You can restart the setup from the app.</p>
      </body>
    </html>
  `);
});


