const User = require('../models/user');
const jwt = require('jsonwebtoken');
const cloudinaryUser = require('../helper/imageUpload');
const {
  generateOTP,
  generateEmailTemplate,
  generateWelcomeEmailTemplate,
  mailtransport,
  generatePasswordResetTemplate,
  generateResetPasswordSuccessfullyEmailTemplate,
} = require('../utils/nodeMailer');
const VerificationToken = require('../models/verificationToken');
const AuctionItem = require('../models/auctionItem');

const { isValidObjectId } = require('mongoose');
const bcrypt = require('bcryptjs');
const Wallet = require('../models/wallet');

const expiresIn = '1d';
const generateAndSendOTP = async (email, type) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error('User not found!');
  }

  const isVerificationToken = await VerificationToken.findOne({ owner: email });
  if (isVerificationToken) {
    await VerificationToken.deleteOne({ owner: email });
  }

  const OTP = generateOTP();
  const verificationToken = new VerificationToken({
    owner: email,
    token: OTP,
  });
  await verificationToken.save();
  console.log('OTP:', OTP);

  const emailSubject =
    type === 'reset' ? 'Reset your password' : 'Verify your email account';
  const emailTemplate =
    type === 'reset'
      ? generatePasswordResetTemplate(OTP, user.firstName, user.lastName)
      : generateEmailTemplate(OTP);

  await mailtransport().sendMail({
    from: 'bidDarbaar@email.com',
    to: user.email,
    subject: emailSubject,
    html: emailTemplate,
  });

  return user;
};

exports.createUser = async (req, res, next) => {
  try {
    const { firstName, lastName, email, phoneNumber, password, location } =
      req.body;
    console.log('location', location);
    const isNewUser = await User.isThisEmailInUse(email);
    const tisNewUser = await User.isThisPhoneInUse(phoneNumber);

    if (!isNewUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }
    if (!tisNewUser) {
      return res.status(400).json({ message: 'Phone number already in use' });
    }

    const user = new User({
      firstName,
      lastName,
      email,
      phoneNumber,
      password,
      verified: false,
      location,
    });

    await user.save();
    const userWallet = new Wallet({
      user: user._id,
      balance: 0,
      transactions: [],
    });
    await userWallet.save();
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { wallet: userWallet._id },
      { new: true },
    );
    if (!updatedUser) {
      return res.status(404).json({ message: 'Failed to update user' });
    }

    mailtransport().sendMail({
      from: 'bidDarbaar@email.com',
      to: user.email,
      subject: 'Welcome to BidDarbaar',
      html: generateWelcomeEmailTemplate(
        user.email,
        user.firstName,
        user.lastName,
      ),
    });

    await generateAndSendOTP(email, 'verify');

    res.status(201).json({
      success: true,
      message: 'User registered successfully and OTP sent to your email',
      user: user,
    });
  } catch (error) {
    next(error);
  }
};

exports.sendOTP = async (req, res, next) => {
  try {
    const { email, type } = req.body;
    const user = await generateAndSendOTP(email, type);
    return res.status(200).json({
      success: true,
      message: 'OTP sent to your email',
      user,
    });
  } catch (error) {
    if (error.message === 'User not found!') {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
};
exports.verifyOTP = async (req, res, next) => {
  try {
    const { email, otp, type } = req.body;
    console.log('email', email);
    console.log('otp', otp);
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    if (!otp) {
      return res.status(400).json({ message: 'OTP is required' });
    }
    const verificationToken = await VerificationToken.findOne({ owner: email });
    if (!verificationToken) {
      return res
        .status(400)
        .json({ message: 'OTP has expired or does not exist' });
    }
    const isValid = await bcrypt.compare(otp, verificationToken.token);
    if (!isValid) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }
    if (type === 'reset') {
    } else {
      const newUser = await User.findByIdAndUpdate(
        user._id,
        { verified: true },
        { new: true },
      );
      user = newUser;
    }

    await VerificationToken.deleteOne({ owner: email });
    return res.status(201).json({
      success: true,
      message: 'Verified OTP successfully',
      user: user,
    });
  } catch (error) {
    console.log('Error in verifyOTP', error.message);
    next(error);
  }
};

exports.userSignIn = async (req, res) => {
  const { email, password, deviceToken } = req.body;
  const user = await User.findOne({ email });
  if (!user)
    return res.status(401).json({ success: false, message: 'User not found!' });
  const isMatch = await user.comparePassword(password);
  if (!isMatch)
    return res
      .status(400)
      .json({ success: false, message: 'Invalid password' });
  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: expiresIn,
  });
  if (deviceToken) {
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { deviceToken: deviceToken },
      { new: true },
    );
    if (!updatedUser) {
      return res.status(404).json({ message: 'Failed to update user' });
    }
    console.log('Device token updated successfully');
  }
  return res.json({
    success: true,
    user,
    message: 'User signed in!',
    token,
    expiresAt: expiresIn,
  });
};

exports.resetPassword = async (req, res) => {
  try {
    const { password, email } = req.body;

    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ message: 'User not found!' });

    const isSamePassword = await user.comparePassword(password);
    if (isSamePassword)
      return res
        .status(400)
        .json({ message: 'New password must be different!' });

    if (password.trim().length < 8 || password.trim().length > 20)
      return res
        .status(400)
        .json({ message: 'Password must be 8-20 characters long!' });

    user.password = password.trim();
    await user.save();

    await VerificationToken.findOneAndDelete({ owner: email });

    const { firstName, lastName } = user;
    mailtransport().sendMail({
      from: 'security@email.com',
      to: user.email,
      subject: 'Password resetted successfully',
      html: generateResetPasswordSuccessfullyEmailTemplate(firstName, lastName),
    });

    res.json({ success: true, message: 'Password Reset Successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while processing the request',
    });
  }
};

exports.getUserProfile = async (req, res) => {
  const authHeader = req.headers['authorization'];
  console.log('authHeader', authHeader);
  if (!authHeader) {
    return res
      .status(401)
      .json({ success: false, message: 'unauthorized access!' });
  }
  const token = authHeader.split(' ')[1];
  console.log('token', token);
  try {
    if (!token)
      return res.status(403).json({ success: false, message: 'Token missing' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;
    console.log('userId', userId);
    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: 'User ID is required!' });
    }
    const tempUser = await User.findById(userId).populate('wallet');
    if (!tempUser) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found!' });
    }
    res.json({ success: true, user: tempUser });
  } catch (error) {
    return res
      .status(401)
      .json({ success: false, message: 'Invalid token', error: error.message });
  }
};

exports.uploadProfilePicture = async (req, res) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res
      .status(401)
      .json({ success: false, message: 'unauthorized access!' });
  }

  const token = authHeader.split(' ')[1];
  if (!token)
    return res.status(403).json({ success: false, message: 'Token missing' });
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const userId = decoded.userId;
  if (!userId) {
    return res
      .status(400)
      .json({ success: false, message: 'User ID is required!' });
  }
  const tempUser = await User.findById(userId);
  if (!tempUser) {
    return res.status(404).json({ success: false, message: 'User not found!' });
  }
  try {
    const result = await cloudinaryUser.cloudinaryUser.uploader.upload(
      req.file.path,
      {
        public_id: `${userId}_profile`,
      },
    );

    const updatedUserId = await User.findByIdAndUpdate(
      userId,
      { avatar: result.url },
      { new: true },
    );

    res.status(201).json({
      success: true,
      message: 'Your profile Picture has updated!',
      user: updatedUserId,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: 'server error, try after some time' });
    console.log('Error while uploading profile image', error.message);
  }
};

exports.editUserProfile = async (req, res) => {
  const authHeader = req.headers['authorization'];
  const { email, phoneNumber, firstName, lastName } = req.body;
  console.log('Last name ', lastName);
  let verified = true;
  if (!authHeader) {
    return res
      .status(401)
      .json({ success: false, message: 'unauthorized access!' });
  }

  const token = authHeader.split(' ')[1];

  if (!token)
    return res.status(403).json({ success: false, message: 'Token missing' });
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const userId = decoded.userId;
  if (!userId) {
    return res
      .status(400)
      .json({ success: false, message: 'User ID is required!' });
  }
  const tempUser = await User.findById(userId);

  if (
    email === tempUser.email &&
    phoneNumber === tempUser.phoneNumber &&
    tempUser.firstName === firstName &&
    tempUser.lastName === lastName
  ) {
    console.log('No changes made');
    return res.status(400).json({ message: 'No changes made' });
  }

  if (firstName !== tempUser.firstName || lastName !== tempUser.lastName) {
  } else if (email === tempUser.email) {
    const phoneCheck = await User.isThisPhoneInUse(phoneNumber);
    if (!phoneCheck) {
      return res.status(400).json({ message: 'Phone number already in use' });
    }
  } else if (phoneNumber === tempUser.phoneNumber) {
    const emailCheck = await User.isThisEmailInUse(email);

    if (!emailCheck) {
      return res.status(400).json({ message: 'Email already in use' });
    }
    verified = false;
  }
  console.log('tempUser', tempUser);
  if (!tempUser) {
    return res.status(404).json({ success: false, message: 'User not found!' });
  }
  try {
    const updatedUserId = await User.findByIdAndUpdate(
      userId,
      {
        email: email,
        phoneNumber: phoneNumber,
        firstName: firstName,
        lastName: lastName,
        verified: verified,
      },
      { new: true },
    );
    res.status(201).json({
      success: true,
      message: 'Your Profile has been updated!',
      user: updatedUserId,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: 'server error, try after some time' });
    console.log('Error while updating your profile', error.message);
  }
};

exports.getAllAuctionItems = async (req, res) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res
      .status(401)
      .json({ success: false, message: 'unauthorized access!' });
  }

  const token = authHeader.split(' ')[1];
  if (!token)
    return res.status(403).json({ success: false, message: 'Token missing' });
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const userId = decoded.userId;
  if (!userId) {
    return res
      .status(400)
      .json({ success: false, message: 'User ID is required!' });
  }
  const tempUser = await User.findById(userId);
  if (!tempUser) {
    return res.status(404).json({ success: false, message: 'User not found!' });
  }
  const auctionItems = await AuctionItem.find().populate('categories');

  if (auctionItems.status === 'completed') {
    res.status(400).json({ message: 'Auction Bid is completed' });
  }
  const filteredAuctionItems = auctionItems.filter(
    (item) => !item.boosted && item.status !== 'completed',
  );

  res.status(201).json({
    success: true,
    message: 'Your Profile has been updated!',
    auctionItems: filteredAuctionItems,
  });
};

exports.fetchAuctionItem = async (req, res) => {
  const itemId = req.headers['itemid'];
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  try {
    console.log('itemId', itemId);

    const auctionItem = await AuctionItem.findById(itemId)
      .populate({
        path: 'categories',
        select: 'name -_id',
      })
      .populate({
        path: 'currentBidder',
        select: 'firstName lastName', 
      });

    if (!auctionItem) {
      return res.status(404).json({ message: 'Auction Item not found!' });
    }

    if (!token) {
      return res.status(401).json({
        message: 'Token not provided',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('decoded', decoded);

    const userId = decoded.userId;
    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: 'User ID is required!' });
    }

    const tempUser = await User.findById(userId);
    if (!tempUser) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found!' });
    }

    return res.status(200).json({
      message: 'Auction Item Fetched Successfully',
      auctionItem,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to fetch auction items',
      error: error.message,
    });
  }
};

exports.getWonAuctionItems = async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader)
      return res.status(401).json({ success: false, message: 'Unauthorized' });

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const tempUser = await User.findById(decoded.userId);
    if (!tempUser)
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });
    const user = await User.findById(decoded.userId)
      .populate({
        path: 'wonItems.itemId',
        populate: [
          { path: 'categories', model: 'AuctionCategories' },
          { path: 'auctionHouseId', model: 'AuctionHouse' },
          {
            path: 'bids.bidderId',
            model: 'User',
            select: 'firstName lastName',
          },
        ],
      })
      .lean();

    if (!user)
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });
    console.log('user', user);

    const formattedItems = user.wonItems.map((wonItem) => ({
      ...wonItem.itemId,
      winDate: wonItem.winDate,
      status: wonItem.status,
    }));
    console.log('yeh raha user ka data:', user.formattedItems);
    res.status(200).json({
      success: true,
      wonItems: formattedItems,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
    console.log('Error in getWonAuctionItems', error.message);
  }
};

exports.addFavoriteItem = async (req, res) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res
      .status(401)
      .json({ success: false, message: 'unauthorized access!' });
  }
  const token = authHeader.split(' ')[1];
  if (!token)
    return res.status(403).json({ success: false, message: 'Token missing' });
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const userId = decoded.userId;
  if (!userId) {
    return res
      .status(400)
      .json({ success: false, message: 'User ID is required!' });
  }
  const tempUser = await User.findById(userId);
  if (!tempUser) {
    return res.status(404).json({ success: false, message: 'User not found!' });
  }
  const { itemId } = req.body;
  if (!itemId) {
    return res.status(400).json({ message: 'Item ID is required' });
  }
  const auctionItem = await AuctionItem.findById(itemId);
  if (!auctionItem) {
    return res.status(404).json({ message: 'Auction item not found' });
  }
  const isAlreadyFavorite = tempUser.favoriteItems.find(
    (item) => item.itemId.toString() === itemId,
  );
  if (isAlreadyFavorite) {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $pull: { favoriteItems: { itemId: itemId } },
      },
      { new: true },
    );
    return res.status(200).json({
      success: true,
      message: 'Item removed from favorites',
      user: updatedUser,
    });
  }
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      $push: { favoriteItems: { itemId: itemId } },
    },
    { new: true },
  );
  if (!updatedUser) {
    return res.status(404).json({ message: 'Failed to update user' });
  }
  res.status(200).json({
    success: true,
    message: 'Item added to favorites',
    user: updatedUser,
  });
};

exports.getFavoriteItems = async (req, res) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res
      .status(401)
      .json({ success: false, message: 'unauthorized access!' });
  }
  const token = authHeader.split(' ')[1];
  if (!token)
    return res.status(403).json({ success: false, message: 'Token missing' });
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const userId = decoded.userId;
  if (!userId) {
    return res
      .status(400)
      .json({ success: false, message: 'User ID is required!' });
  }
  const tempUser = await User.findById(userId).populate('favoriteItems.itemId');
  if (!tempUser) {
    return res.status(404).json({ success: false, message: 'User not found!' });
  }
  if (tempUser.favoriteItems.length === 0) {
    return res
      .status(200)
      .json({
        success: true,
        message: 'No favorite items found',
        favoriteItems: [],
      });
  }
  return res.status(200).json({
    success: true,
    message: 'Favorite items fetched successfully',
    favoriteItems: tempUser.favoriteItems,
  });
};

exports.removeFavoriteItem = async (req, res) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res
      .status(401)
      .json({ success: false, message: 'unauthorized access!' });
  }
  const token = authHeader.split(' ')[1];
  if (!token)
    return res.status(403).json({ success: false, message: 'Token missing' });
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const userId = decoded.userId;
  if (!userId) {
    return res
      .status(400)
      .json({ success: false, message: 'User ID is required!' });
  }
  const tempUser = await User.findById(userId);
  if (!tempUser) {
    return res.status(404).json({ success: false, message: 'User not found!' });
  }
  const { itemId } = req.body;
  if (!itemId) {
    return res.status(400).json({ message: 'Item ID is required' });
  }
  const auctionItem = await AuctionItem.findById(itemId);
  if (!auctionItem) {
    return res.status(404).json({ message: 'Auction item not found' });
  }
  const isAlreadyFavorite = tempUser.favoriteItems.find(
    (item) => item.itemId.toString() === itemId,
  );
  if (!isAlreadyFavorite) {
    return res.status(400).json({ message: 'Item not in favorites' });
  }
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      $pull: { favoriteItems: { itemId: itemId } },
    },
    { new: true },
  );
  if (!updatedUser) {
    return res.status(404).json({ message: 'Failed to update user' });
  }
  res.status(200).json({
    success: true,
    message: 'Item removed from favorites',
    user: updatedUser,
  });
};

exports.updateLocation = async (req, res) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res
      .status(401)
      .json({ success: false, message: 'unauthorized access!' });
  }
  const token = authHeader.split(' ')[1];
  if (!token)
    return res.status(403).json({ success: false, message: 'Token missing' });
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const userId = decoded.userId;
  if (!userId) {
    return res
      .status(400)
      .json({ success: false, message: 'User ID is required!' });
  }
  const tempUser = await User.findById(userId);
  if (!tempUser) {
    return res.status(404).json({ success: false, message: 'User not found!' });
  }
  const { xAxis, yAxis } = req.body.location;
  if (!xAxis || !yAxis) {
    return res
      .status(400)
      .json({ message: 'Location coordinates are required' });
  }
  if (isNaN(xAxis) || isNaN(yAxis)) {
    return res.status(400).json({ message: 'Invalid location coordinates' });
  }
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      location: {
        xAxis: xAxis,
        yAxis: yAxis,
      },
    },
    { new: true },
  );
  if (!updatedUser) {
    return res.status(404).json({ message: 'Failed to update user' });
  }
  return res.status(200).json({
    success: true,
    message: 'Location updated successfully',
    user: updatedUser,
  });
};
