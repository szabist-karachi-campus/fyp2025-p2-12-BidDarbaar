const mongoose = require('mongoose');
const auctionHouse = require('../models/auctionHouse');
const jwt = require('jsonwebtoken');
const cloudinary = require('../helper/imageUpload');
const AuctionHouse = require('../models/auctionHouse');
// const AuctionHouseUser = require('../models/auctionHouseUser');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const {
  generateOTP,
  generateEmailTemplate,
  generateWelcomeEmailAdminTemplate,
  mailtransport,
  generatePasswordResetTemplate,
  generateResetPasswordSuccessfullyEmailTemplate,
} = require('../utils/nodeMailer');
const auctionHouseVerificationToken = require('../models/auctionHouseVerificationToken');
const auctionItem = require('../models/auctionItem');
const auctionCategories = require('../models/auctionCategories.js');
const bcrypt = require('bcryptjs');
const AuctionHouseWallet = require('../models/auctionWallet');
const SuperAdmin = require('../models/superAdmin/superAdmin');
const expiresIn = '1d';
const WaitingList = require('../models/waitingList');
const Order = require('../models/delivery/Order');
const Transaction = require('../models/transactionSchema.js');
const Ad = require('../models/adSchema');
const Click = require('../models/clickSchema');

exports.createAuctionHouse = async (req, res) => {
  try {
    const {
      name,
      ntn,
      email,
      location,
      phoneNumber,
      password,
      confirmPassword,
    } = req.body;
    console.log('location:', location);

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    const [isEmailInUse, isNtnInUse, isPhoneNumberInUse] = await Promise.all([
      auctionHouse.AuctionHouse.isThisEmailInUse(email),
      auctionHouse.AuctionHouse.isThisNtnInUse(ntn),
      auctionHouse.AuctionHouse.isThisPhoneNumberInUse(phoneNumber),
    ]);
    const [isWaitingEmailInUse, isWaitingNtnInUse, isWaitingPhoneNumberInUse] = await Promise.all([
      WaitingList.isThisEmailInUse(email),
      WaitingList.isThisNtnInUse(ntn),
      WaitingList.isThisPhoneNumberInUse(phoneNumber),
    ]);

    if (!isEmailInUse)
      return res.status(400).json({ message: 'Email already in use' });
    if (!isNtnInUse)
      return res.status(400).json({ message: 'NTN already in use' });
    if (!isPhoneNumberInUse)
      return res.status(400).json({ message: 'Phone Number already in use' });
    if (!isWaitingEmailInUse)
      return res.status(400).json({ message: 'Email already in waiting list' });
    if (!isWaitingNtnInUse)
      return res.status(400).json({ message: 'NTN already in waiting list' });
    if (!isWaitingPhoneNumberInUse)
      return res.status(400).json({ message: 'Phone Number already in waiting lisy' });

    const newWaitingAuctionHouse = new WaitingList({
      name,
      ntn,
      email,
      location,
      phoneNumber,
      password,
    })
    await newWaitingAuctionHouse.save();
    const OTP = generateAndSendOTP(email, 'verify');

    await mailtransport().sendMail({
      from: 'bidDarbaar@email.com',
      to: email,
      subject: 'Verify your email account',
      html: generateEmailTemplate(OTP),
    });

    return res.status(201).json({
      success: true,
      message: 'Auction house created and OTP sent to your email',
      auctionHouse: newWaitingAuctionHouse,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
const generateAndSendOTP = async (email, type) => {
  let user;
  let emailNormalized = email.toLowerCase();
  user = await AuctionHouse.AuctionHouse.findOne({ email: emailNormalized });
  if(!user){
    user=await WaitingList.findOne({ email: emailNormalized });
  }
  console.log(email);
  if (!user) {
    user = await AuctionHouse.AuctionHouseUser.findOne({ email });
    if (!user) {
      throw new Error('User not found!');
    }
  }
  const isVerificationToken = await auctionHouseVerificationToken.findOne({
    owner: email,
  });
  if (isVerificationToken) {
    await auctionHouseVerificationToken.deleteOne({ owner: email });
  }
  const OTP = generateOTP();
  const verificationToken = new auctionHouseVerificationToken({
    owner: email,
    token: OTP,
  });
  await verificationToken.save();

  const emailSubject =
    type === 'reset' ? 'Reset your password' : 'Verify your email account';
  const emailTemplate =
    type === 'reset'
      ? generatePasswordResetTemplate(OTP, user.name, '')
      : generateEmailTemplate(OTP);

  await mailtransport().sendMail({
    from: 'bidDarbaar@email.com',
    to: user.email,
    subject: emailSubject,
    html: emailTemplate,
  });

  return user;
};

exports.auctionHouseSignIn = async (req, res) => {
  const { email, password, deviceToken } = req.body;

  try {
    const normalizedEmail = email.toLowerCase();

     
    let tempAuctionHouse = await auctionHouse.AuctionHouse.findOne({
      email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') },
    });
    if(!tempAuctionHouse){

      tempAuctionHouse = await WaitingList.findOne({
       email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') },
     });
     if(tempAuctionHouse){
        return res.status(400).json({
          success: false,
          message: 'You are already in waiting list, please wait for approval',
        });
     }
    }
    if (!tempAuctionHouse) {
      let tempAuctionHouseUser = await auctionHouse.AuctionHouseUser.findOne({
        email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') },
      });
      if (!tempAuctionHouseUser) {
        let tempSuperAdmin = await SuperAdmin.findOne({
          email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') },
        });
        if (!tempSuperAdmin) {
          return res.status(404).json({
            success: false,
            message: 'Auction House or User not found!',
          });
        } else {
          const isMatch = await tempSuperAdmin.comparePassword(password);
          if (!isMatch)
            return res
              .status(400)
              .json({ success: false, message: 'Invalid password' });
          const token = jwt.sign(
            { adminId: tempSuperAdmin._id },
            process.env.JWT_SECRET,
            {
              expiresIn: expiresIn,
            },
          );
          if (deviceToken) {
            const updatedUser = await SuperAdmin.findByIdAndUpdate(
              tempSuperAdmin._id,
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
            superAdmin: tempSuperAdmin,
            message: 'User signed in!',
            token,
            expiresAt: expiresIn,
          });
        }

        return res.status(404).json({
          success: false,
          message: 'Auction House or User not found!',
        });
      }
      const isMatch = await tempAuctionHouseUser.comparePassword(password);
      if (!isMatch)
        return res
          .status(401)
          .json({ success: false, message: 'Invalid password' });

      const token = jwt.sign(
        { auctionHouseId: tempAuctionHouseUser._id },
        process.env.JWT_SECRET,
        { expiresIn: '1d' },
      );
      if (deviceToken) {
        const updatedTempAuctionHouseUser =
          await auctionHouse.AuctionHouseUser.findByIdAndUpdate(
            tempAuctionHouseUser._id,
            { deviceToken: deviceToken },
            { new: true, runValidators: true },
          );
      }

      return res.json({
        success: true,
        auctionHouseUser: tempAuctionHouseUser,
        message: 'Auction house  signed in!',
        token,
        expiresAt: '1d',
      });
    }
    const isMatch = await tempAuctionHouse.comparePassword(password);
    if (!isMatch)
      return res
        .status(401)
        .json({ success: false, message: 'Invalid password' });

    const token = jwt.sign(
      { auctionHouseId: tempAuctionHouse._id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' },
    );

    if (deviceToken) {
      const updatedTempAuctionHouse =
        await auctionHouse.AuctionHouse.findByIdAndUpdate(
          tempAuctionHouse._id,
          { deviceToken: deviceToken },
          { new: true, runValidators: true },
        );
    }
    res.json({
      success: true,
      auctionHouse: tempAuctionHouse,
      message: 'Auction house signed in!',
      token,
      expiresAt: '1d',
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: 'Internal server error', error: error.message });
  }
};

exports.auctionHouseUserSignIn = async (req, res) => {
  const { email, password } = req.body;

  try {
    const tempAuctionHouse = await auctionHouse.AuctionHouse.findOne({ email });

    if (!tempAuctionHouse) {
      const tempAuctionHouseUser = await auctionHouse.AuctionHouseUser.findOne({
        email,
      });

      if (!tempAuctionHouseUser) {
        return res.status(404).json({
          success: false,
          message: 'Auction House or User not found!',
        });
      }

      const isMatch = await tempAuctionHouseUser.comparePassword(password);
      if (!isMatch) {
        return res
          .status(401)
          .json({ success: false, message: 'Invalid password' });
      }

      const token = jwt.sign(
        { auctionHouseId: tempAuctionHouseUser._id },
        process.env.JWT_SECRET,
        { expiresIn: '1d' },
      );

      return res.json({
        success: true,
        auctionHouseUser: tempAuctionHouseUser,
        message: 'Auction house user signed in!',
        token,
        expiresAt: '1d',
      });
    }

    const isMatch = await tempAuctionHouse.comparePassword(password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: 'Invalid password' });
    }

    const token = jwt.sign(
      { auctionHouseId: tempAuctionHouse._id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' },
    );

    res.json({
      success: true,
      auctionHouse: tempAuctionHouse,
      message: 'Auction house signed in!',
      token,
      expiresAt: '1d',
    });
  } catch (error) {
    console.error(error); 
    res
      .status(500)
      .json({ message: 'Internal server error', error: error.message });
  }
};

exports.verifyOTP = async (req, res, next) => {
  try {
    const { email, otp, type } = req.body;
    const emailNormalized = email.toLowerCase().trim();

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    if (!otp) {
      return res.status(400).json({ message: 'OTP is required' });
    }

    const verificationToken = await auctionHouseVerificationToken.findOne({
      owner: emailNormalized,
    });
    if (!verificationToken) {
      return res
        .status(400)
        .json({ message: 'OTP has expired or does not exist' });
    }

    const isValid = await bcrypt.compare(otp, verificationToken.token);
    if (!isValid) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    let user;
    let userType;
    user = await AuctionHouse.AuctionHouse.findOne({ email: emailNormalized });
    userType = 'auctionHouse';
    if(!user){
      user =await WaitingList.findOne({ email: emailNormalized });
      if(user){
        const newUser = await WaitingList.findByIdAndUpdate(user.id,  
          { verified: true },
          { new: true },
        );
                user = newUser;

      }
    }
    if (!user) {
      user = await AuctionHouse.AuctionHouseUser.findOne({
        email: emailNormalized,
      });
      userType = 'auctionHouseUser';
      
    }

    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    if (type === 'reset') {
    } else {
      if (userType === 'auctionHouse') {
        const newUser = await AuctionHouse.AuctionHouse.findByIdAndUpdate(
          user._id,
          { verified: true },
          { new: true },
        );
        user = newUser;
      } else {
        const newUser = await AuctionHouse.AuctionHouseUser.findByIdAndUpdate(
          user._id,
          { verified: true },
          { new: true },
        );
        user = newUser;
      }
    }

    await auctionHouseVerificationToken.deleteOne({ owner: email });
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

exports.isauctionHouseVerificationTokenValid = async (req, res) => {
  const { token, email } = req.body;
  if (!token || !email)
    return res.status(400).json({ message: 'Invalid request!' });
  const auctionHouse = await auctionHouse.findOne({ email });
  if (!auctionHouse)
    return res.status(400).json({ message: 'Auction House User not found!' });

  const auctionHouseVerificationToken =
    await auctionHouseVerificationToken.findOne({ owner: email });

  if (!auctionHouseVerificationToken)
    return res.status(400).json({ message: 'Reset Token not found!' });

  const isValid = await auctionHouseVerificationToken.compareToken(token);
  if (!isValid) {
    return res.status(400).json({ message: 'Token is invalid!' });
  }

  res.json({
    success: true,
    message: 'Verification code verified Successfully',
    auctionHouse: auctionHouse,
  });
};

exports.createAuctionHouseUser = async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader)
      return res
        .status(401)
        .json({ success: false, message: 'Authorization header required' });

    const token = authHeader.split(' ')[1];
    if (!token)
      return res.status(403).json({ success: false, message: 'Token missing' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded); 

    const decodedAuctionHouseId = decoded.auctionHouseId;
    if (!decodedAuctionHouseId) {
      return res
        .status(400)
        .json({ success: false, message: 'Auction House ID is required!' });
    }
    const auctionHouseId = req.headers['auctionhouseid'];
    const tempAuctionHouse =
      await auctionHouse.AuctionHouse.findById(auctionHouseId);
    console.log('Temp Auction House:', tempAuctionHouse); 

    let id;
    if (tempAuctionHouse) {
      if (tempAuctionHouse.accountStatus === 'suspended') {
        return res.status(403).json({
          success: false,
          message: 'Your account is suspended, please contact support',
        });
      }
      id = tempAuctionHouse._id;
    } else {
      const auctionHouseUser =
        await auctionHouse.AuctionHouseUser.findById(auctionHouseId).populate(
          'auctionHouseId',
        );
      console.log('Auction House User:', auctionHouseUser); 

      if (!auctionHouseUser) {
        return res
          .status(404)
          .json({ message: 'Auction House or User not found' });
      }
      if (auctionHouseUser.auctionHouseId.accountStatus === 'suspended') {
        return res.status(403).json({
          success: false,
          message: 'Your account is suspended, please contact support',
        });
      }
      if (auctionHouseUser.jobTitle !== 'admin') {
        console.log('Job Title:', auctionHouseUser.jobTitle); 
        return res.status(403).json({
          success: false,
          message: 'You do not have privileges to create an auction house user',
        });
      }
      id = auctionHouseUser.auctionHouseId;
    }

    const { name, email, phoneNumber, password, confirmPassword, jobTitle } =
      req.body;

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    const [isEmailInUse, isPhoneNumberInUse] = await Promise.all([
      auctionHouse.AuctionHouseUser.isThisEmailInUse(email),
      auctionHouse.AuctionHouseUser.isThisPhoneNumberInUse(phoneNumber),
    ]);

    if (!isEmailInUse)
      return res.status(400).json({ message: 'Email already in use' });

    if (!isPhoneNumberInUse)
      return res.status(400).json({ message: 'Phone Number already in use' });

    const newAuctionHouseUser = new auctionHouse.AuctionHouseUser({
      name,
      email,
      phoneNumber,
      password,
      jobTitle,
      auctionHouseId: id,
    });

    await newAuctionHouseUser.save();
    console.log('New Auction House User:', newAuctionHouseUser); 

    const OTP = generateAndSendOTP(email, 'verify');
    res
      .status(201)
      .json({ success: true, message: 'User created successfully' });
  } catch (error) {
    console.error(error);
    if (error.name === 'JsonWebTokenError') {
      return res
        .status(401)
        .json({ success: false, message: 'Invalid or expired token' });
    }
    res
      .status(500)
      .json({ message: 'Internal server error', error: error.message });
  }
};

exports.uploadAuctionHouseProfilePic = async (req, res) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res
      .status(401)
      .json({ success: false, message: 'Unauthorized access!' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(403).json({ success: false, message: 'Token missing' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const auctionHouseId = decoded.auctionHouseId;

    if (!auctionHouseId) {
      return res
        .status(400)
        .json({ success: false, message: 'Auction House ID is required!' });
    }

    const tempAuctionHouse =
      await auctionHouse.AuctionHouse.findById(auctionHouseId);
    let tempAuctionHouseUser;

    if (!tempAuctionHouse) {
      tempAuctionHouseUser =
        await auctionHouse.AuctionHouseUser.findById(auctionHouseId);
      if (!tempAuctionHouseUser) {
        return res
          .status(404)
          .json({ message: 'Auction House or User not found' });
      }
    }

    const result = await cloudinary.cloudinary.uploader.upload(req.file.path, {
      public_id: `${auctionHouseId}_profile`,
    });

    if (tempAuctionHouse) {
      await auctionHouse.AuctionHouse.findByIdAndUpdate(
        auctionHouseId,
        { avatar: result.secure_url },
        { new: true },
      );
    } else if (tempAuctionHouseUser) {
      await auctionHouse.AuctionHouseUser.findByIdAndUpdate(
        auctionHouseId,
        { avatar: result.secure_url },
        { new: true },
      );
    }

    return res.status(201).json({
      success: true,
      message: 'Your profile picture has been updated!',
    });
  } catch (error) {
    console.error('Error while uploading profile image:', error.message);
    return res
      .status(500)
      .json({ success: false, message: 'Server error, try after some time' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { password, email } = req.body;
    normalizeEmail = email.toLowerCase();
    let id;
    let ownerType;
    const auctionHouse = await AuctionHouse.AuctionHouse.findOne({
      email: email,
    });
    let user;
    if (auctionHouse) {
      id = auctionHouse._id;
      ownerType = 'auctionHouse';
      user = auctionHouse;
    } else {
      const auctionHouseUser = await AuctionHouse.AuctionHouseUser.findOne({
        email,
      });
      if (!auctionHouseUser) {
        return res
          .status(404)
          .json({ message: 'Auction House or User not found' });
      }
      id = auctionHouseUser.auctionHouseId;
      ownerType = 'auctionHouseUser';
      user = auctionHouseUser;
    }
    let isSamePassword;
    if (ownerType === 'auctionHouse') {
      isSamePassword = await user.comparePassword(password);
    } else {
      isSamePassword = await user.comparePassword(password);
    }
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

    await auctionHouseVerificationToken.findOneAndDelete({ owner: id });

    const { name } = user;
    const { firstName, lastName } = name.split(' ');
    mailtransport().sendMail({
      from: 'security@email.com',
      to: user.email,
      subject: 'Password resetted successfully',
      html: generateResetPasswordSuccessfullyEmailTemplate(name, ''),
    });

    res.json({ success: true, message: 'Password Reset Successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while processing the request',
      error: error.message,
    });
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
    console.log(error);
    if (error.message === 'User not found!') {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
};
exports.uploadAuctionItemPic = async (req, res) => {
  const authHeader = req.headers['authorization'];
  const itemId = req.headers['itemid']; 
  console.log('file', req.files);
  console.log('authorization', req.headers['authorization']);
  console.log('itemid', req.headers['itemid']);
  if (!authHeader) {
    return res
      .status(401)
      .json({ success: false, message: 'Unauthorized access!' });
  }

  if (!itemId) {
    return res
      .status(400)
      .json({ success: false, message: 'Auction Item ID is required!' });
  }

  const token = authHeader.split(' ')[1];
  if (!token)
    return res.status(403).json({ success: false, message: 'Token missing' });

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return res.status(403).json({ success: false, message: 'Invalid token' });
  }

  const auctionHouseId = decoded.auctionHouseId;
  if (!auctionHouseId) {
    return res
      .status(400)
      .json({ success: false, message: 'Auction House ID is required!' });
  }

  let tempAuctionHouse =
    await auctionHouse.AuctionHouse.findById(auctionHouseId);
  if (!tempAuctionHouse) {
    const tempAuctionHouseUser =
      await auctionHouse.AuctionHouseUser.findById(auctionHouseId);
    if (!tempAuctionHouseUser) {
      return res.status(404).json({ message: 'Auction House not found' });
    }

    tempAuctionHouse = await auctionHouse.AuctionHouse.findById(
      tempAuctionHouseUser.auctionHouseId,
    );
  }

  try {
    console.log('uploading started');
    const uploadPromises = req.files.map(async (file) => {
      const result = await cloudinary.cloudinary.uploader.upload(file.path, {
        public_id: `${itemId}_auction_item_${new Date().getTime()}`,
        folder: 'auction_items',
      });
      return result.secure_url;
    });
    console.log('uploading ended');
    const imageUrls = await Promise.all(uploadPromises);

    const updatedAuctionItem = await auctionItem.findByIdAndUpdate(
      itemId,
      { $push: { avatar: { $each: imageUrls } } }, 
      { new: true },
    );

    if (!updatedAuctionItem) {
      return res
        .status(404)
        .json({ success: false, message: 'Auction item not found!' });
    }

    res.status(201).json({
      success: true,
      message: 'Auction item pictures have been updated!',
      imageUrls, 
      auctionItem: updatedAuctionItem, 
    });
  } catch (error) {
    console.error('Error while uploading auction item images:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error, please try again later',
    });
  }
};
exports.createAuctionItem = async (req, res) => {
  try {
    const {
      title,
      description,
      startingBid,
      categories,
      BiddingStartTime,
      BiddingDate,
      BiddingEndTime,
    } = req.body;
    const authHeader = req.headers['authorization'];

    if (!authHeader)
      return res
        .status(401)
        .json({ success: false, message: 'Authorization header required' });

    const token = authHeader.split(' ')[1];
    if (!token)
      return res.status(403).json({ success: false, message: 'Token missing' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const auctionHouseId = decoded.auctionHouseId;

    if (!auctionHouseId) {
      return res
        .status(400)
        .json({ success: false, message: 'Auction House ID is required!' });
    }

    const tempAuctionHouse =
      await auctionHouse.AuctionHouse.findById(auctionHouseId);
    let tempAuctionHouseUser;

    if (!tempAuctionHouse) {
      tempAuctionHouseUser =
        await auctionHouse.AuctionHouseUser.findById(auctionHouseId).populate(
          'auctionHouseId',
        );
      if (!tempAuctionHouseUser) {
        return res.status(404).json({ message: 'Auction House not found' });
      }
      if (tempAuctionHouseUser.auctionHouseId.accountStatus === 'suspended') {
        return res.status(403).json({
          success: false,
          message: 'Your account is suspended, please contact support',
        });
      }
    }
    if (tempAuctionHouse.accountStatus === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Your account is suspended, please contact support',
      });
    }

    if (
      !Array.isArray(categories) ||
      categories.some((id) => !mongoose.Types.ObjectId.isValid(id))
    ) {
      return res
        .status(400)
        .json({ message: 'Invalid category ID(s) provided.' });
    }

    let categoriesId;
    try {
      categoriesId = await Promise.all(
        categories.map(async (category) => {
          const categoryFound = await auctionCategories.findById(category);
          if (!categoryFound) {
            throw new Error(`Category not found: ${category}`);
          }
          return categoryFound._id; 
        }),
      );
    } catch (error) {
      return res.status(404).json({ message: error.message });
    }
    let newAuctionItem;
    if (tempAuctionHouse) {
      newAuctionItem = new auctionItem({
        title,
        categories: categoriesId,
        description,
        startingBid,
        auctionHouseId: tempAuctionHouse._id,
        createdBy: auctionHouseId,
        BiddingStartTime,
        BiddingDate,
        BiddingEndTime,
      });
    } else if (tempAuctionHouseUser) {
      newAuctionItem = new auctionItem({
        title,
        categories: categoriesId,
        description,
        startingBid,
        auctionHouseId: tempAuctionHouseUser.auctionHouseId,
        createdBy: tempAuctionHouseUser._id,
        BiddingStartTime,
        BiddingDate,
        BiddingEndTime,
      });
    }

    const savedAuctionItem = await newAuctionItem.save();

    try {
      await Promise.all(
        categoriesId.map(async (categoryId) => {
          const updatedCategory = await auctionCategories.findByIdAndUpdate(
            categoryId,
            { $addToSet: { items: savedAuctionItem._id } },
            { new: true, runValidators: true },
          );

          if (!updatedCategory) {
            throw new Error(`Category not found: ${categoryId}`);
          }
        }),
      );

      const auctionHouseToUpdate = tempAuctionHouse
        ? tempAuctionHouse
        : tempAuctionHouseUser;

      await auctionHouse.AuctionHouse.findByIdAndUpdate(
        auctionHouseToUpdate.auctionHouseId || auctionHouseToUpdate._id,
        { $addToSet: { listings: savedAuctionItem._id } },
        { new: true, runValidators: true },
      );

      res.status(201).json({
        success: true,
        message: 'Your Auction House item has been uploaded!',
        auctionItem: savedAuctionItem,
      });
    } catch (error) {
      console.error(
        'Error updating categories or auction house:',
        error.message,
      );
      return res.status(500).json({ message: error.message });
    }
  } catch (error) {
    console.error('Error:', error.message);
    res
      .status(500)
      .json({ message: 'Internal server error', error: error.message });
  }
};

exports.updateAuctionItem = async (req, res) => {
  const { itemId } = req.params;
  const updateData = req.body;

  try {
    let user;
    let type;
    if (req.auctionHouse) {
      user = req.auctionHouse;
      type = 'auctionHouse';
    } else {
      user = req.auctionHouseUser;
      type = 'auctionHouseUser';
    }

    if (type === 'auctionHouseUser') {
      if (user.jobTitle !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Only admins can update auction items.',
        });
      }
      const auctionHouse = await auctionHouse.AuctionHouse.findById(
        user.auctionHouseId,
      );
      if (!auctionHouse) {
        return res.status(404).json({ message: 'Auction House not found!' });
      }
      if (auctionHouse.accountStatus === 'suspended') {
        return res.status(403).json({
          success: false,
          message: 'Your account is suspended, please contact support',
        });
      }
    }
    if (user.accountStatus === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Your account is suspended, please contact support',
      });
    }
    const oldItem = await auctionItem.findById(itemId);
    if (!oldItem) {
      return res.status(404).json({ message: 'Auction Item not found!' });
    }

    const oldCategories = oldItem.categories || [];
    const newCategories = updateData.categories || [];

    const updatedItem = await auctionItem.findByIdAndUpdate(
      itemId,
      updateData,
      { new: true },
    );
    if (!updatedItem) {
      return res.status(404).json({ message: 'Auction Item not found!' });
    }

    const removedCategories = oldCategories.filter(
      (category) => !newCategories.includes(category),
    );
    const addedCategories = newCategories.filter(
      (category) => !oldCategories.includes(category),
    );

    if (removedCategories.length > 0) {
      await Promise.all(
        removedCategories.map(async (categoryId) => {
          await auctionCategories.findByIdAndUpdate(
            categoryId,
            { $pull: { items: itemId } }, 
            { new: true },
          );
        }),
      );
    }

    if (addedCategories.length > 0) {
      await Promise.all(
        addedCategories.map(async (categoryId) => {
          await auctionCategories.findByIdAndUpdate(
            categoryId,
            { $addToSet: { items: itemId } }, 
            { new: true },
          );
        }),
      );
    }

    res.json({
      success: true,
      message: 'Item updated successfully, and categories updated.',
      auctionItem: updatedItem,
    });
  } catch (error) {
    console.error('Error:', error.message);
    res
      .status(500)
      .json({ message: 'Internal server error', error: error.message });
  }
};
exports.deleteAuctionItem = async (req, res) => {
  const { itemId } = req.params;

  try {
    let user;
    let type;
    if (req.auctionHouse) {
      user = req.auctionHouse;
      type = 'auctionHouse';
    } else {
      user = req.auctionHouseUser;
      type = 'auctionHouseUser';
    }

    if (type === 'auctionHouseUser') {
      if (user.jobTitle !== 'admin' && user.jobTitle !== 'lister') {
        return res.status(403).json({
          success: false,
          message:
            'Access denied. Only admins and lister can delete auction items.',
        });
      }
    }

    const auctionItemToDelete = await auctionItem.findById(itemId);
    if (!auctionItemToDelete) {
      return res.status(404).json({ message: 'Auction Item not found!' });
    }

    if (
      auctionItemToDelete.categories &&
      auctionItemToDelete.categories.length > 0
    ) {
      await Promise.all(
        auctionItemToDelete.categories.map(async (categoryId) => {
          await auctionCategories.findByIdAndUpdate(
            categoryId,
            { $pull: { items: itemId } }, 
            { new: true },
          );
        }),
      );
    }

    const deletedItem = await auctionItem.findByIdAndDelete(itemId);

    if (!deletedItem) {
      return res.status(404).json({ message: 'Auction Item not found!' });
    }

    res.json({
      success: true,
      message:
        'Item deleted successfully and removed from associated categories.',
    });
  } catch (error) {
    console.error('Error deleting Auction item:', error.message);
    res
      .status(500)
      .json({ message: 'Internal server error', error: error.message });
  }
};
exports.fetchAuctionItems = async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader.split(' ')[1];
  console.log('new new:', token);
  if (!token)
    return res.status(403).json({ success: false, message: 'Token missing' });

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const auctionHouseId = decoded.auctionHouseId;

  if (!auctionHouseId) {
    return res
      .status(400)
      .json({ message: 'Invalid token or auction house ID missing' });
  }

  let id;

  try {
    const auctionHouse =
      await AuctionHouse.AuctionHouse.findById(auctionHouseId);
    if (auctionHouse) {
      id = auctionHouse._id;
    } else {
      const auctionHouseUser =
        await AuctionHouse.AuctionHouseUser.findById(auctionHouseId);
      if (auctionHouseUser) {
        id = auctionHouseUser.auctionHouseId;
      } else {
        return res
          .status(404)
          .json({ message: 'Auction House or Auction House User not found!' });
      }
    }

    console.log('ID:', id);
    const auctionItems = await auctionItem.find({ createdBy: id });

    return res.status(200).json({ auctionItems });
  } catch (error) {
    console.log('Error fetching auction items:', error.message);
    return res
      .status(500)
      .json({ message: 'Failed to fetch auction items', error: error.message });
  }
};
exports.fetchAuctionItem = async (req, res) => {
  const itemId = req.headers['itemid'];
  const authHeader = req.headers['authorization'];
  const token = authHeader.split(' ')[1];
  try {
    const auctionItems = await auctionItem.findById(itemId).populate('currentBidder');
    if (!auctionItems) {
      return res.status(404).json({ message: 'Auction Item not found!' });
    }
    if (!token) {
      return res.status(500).json({
        message: 'Failed to fetch auction items',
        error: error.message,
      });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const auctionHouseId = decoded.auctionHouseId;
    const tempAuctionHouse =
      await AuctionHouse.AuctionHouse.findById(auctionHouseId);
    let auctionHouseUser;
    if (!tempAuctionHouse) {
      auctionHouseUser =
        await AuctionHouse.AuctionHouseUser.findById(auctionHouseId);
      if (!auctionHouseUser) {
        return res.status(404).json({ message: 'Auction House not found!' });
      }
    }
    if (tempAuctionHouse) {
      if (auctionItems.createdBy == auctionHouseId) {
        return res.status(200).json({ auctionItems });
      }
    } else {
      if (
        auctionItems.createdBy == auctionHouseUser.auctionHouseId.toString()
      ) {
        console.log('Auction House User ID:',auctionItems);
        return res.status(200).json({ auctionItems });
      }
    }
    return res.status(401).json({ message: 'Unauthorized access!' });
  } catch (error) {
    return res
      .status(500)
      .json({ message: 'Failed to fetch auction items', error: error.message });
  }
};

exports.getAuctionHouseProfile = async (req, res) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res
      .status(401)
      .json({ success: false, message: 'unauthorized access!' });
  }
  const token = authHeader.split(' ')[1];
  try {
    if (!token)
      return res.status(403).json({ success: false, message: 'Token missing' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const auctionHouseId = decoded.auctionHouseId;
    if (!auctionHouseId) {
      return res
        .status(400)
        .json({ success: false, message: 'Auction House ID is required!' });
    }
    const tempUser = await auctionHouse.AuctionHouse.findById(auctionHouseId);
    if (!tempUser) {
      const tempAuctionHouseUser =
        await auctionHouse.AuctionHouseUser.findById(auctionHouseId);
      if (tempAuctionHouseUser) {
        return res.json({ success: true, user: tempAuctionHouseUser });
      }
      return res
        .status(404)
        .json({ success: false, message: 'Auction House not found!' });
    }

    return res.json({ success: true, user: tempUser });
  } catch (error) {
    return res
      .status(401)
      .json({ success: false, message: 'Invalid token', error: error.message });
  }
};

exports.editAuctionHouseProfile = async (req, res) => {
  const authHeader = req.headers['authorization'];
  const { name, phoneNumber, ntn } = req.body; 
  let verified = true;
  if (!authHeader) {
    return res
      .status(401)
      .json({ success: false, message: 'Unauthorized access!' });
  }

  const token = authHeader.split(' ')[1];
  if (!token)
    return res.status(403).json({ success: false, message: 'Token missing' });

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const auctionHouseId = decoded.auctionHouseId;

  if (!auctionHouseId) {
    return res
      .status(400)
      .json({ success: false, message: 'Auction House ID is required!' });
  }

  const tempUser = await auctionHouse.AuctionHouse.findById(auctionHouseId);

  if (!tempUser) {
    return res.status(404).json({ success: false, message: 'User not found!' });
  }

  if (
    phoneNumber === tempUser.phoneNumber &&
    tempUser.name === name &&
    tempUser.ntn === ntn
  ) {
    return res.status(400).json({ message: 'No changes made' });
  }


  if (phoneNumber !== tempUser.phoneNumber) {
    const phoneCheck =
      await auctionHouse.AuctionHouse.isThisPhoneNumberInUse(phoneNumber);
    if (!phoneCheck) {
      return res.status(400).json({ message: 'Phone number already in use' });
    }
  }

  if (ntn !== tempUser.ntn) {
    const ntnCheck = await auctionHouse.AuctionHouse.isThisNtnInUse(ntn);
    if (!ntnCheck) {
      return res.status(400).json({ message: 'NTN already in use' });
    }
  }
  try {
    const updatedUserId = await auctionHouse.AuctionHouse.findByIdAndUpdate(
      auctionHouseId,
      {
        name: name,
        phoneNumber: phoneNumber,
        ntn: ntn,
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
    console.error('Update Error:', error);
    res
      .status(500)
      .json({ success: false, message: 'Server error, try after some time' });
  }
};

exports.getAuctionHouseUsers = async (req, res) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader)
    return res
      .status(401)
      .json({ success: false, message: 'Authorization header required' });

  const token = authHeader.split(' ')[1];
  if (!token)
    return res.status(403).json({ success: false, message: 'Token missing' });
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const decodedAuctionHouseId = decoded.auctionHouseId;
  if (!decodedAuctionHouseId)
    return res
      .status(400)
      .json({ success: false, message: 'Auction House ID is required!' });

  const auctionHouseId = req.headers['auctionhouseid'];
  const tempAuctionHouse =
    await auctionHouse.AuctionHouse.findById(auctionHouseId);

  if (!tempAuctionHouse)
    return res.status(404).json({ message: 'Auction House or User not found' });

  const auctionHouseUsers = await auctionHouse.AuctionHouseUser.find({
    auctionHouseId: tempAuctionHouse._id,
  });
  return res.status(200).json({ users: auctionHouseUsers });
};

exports.deleteAuctionHouseUser = async (req, res) => {
  try {
    const auth = req.headers['authorization'];
    const auctionHouseId = req.headers['auctionhouseid'];
    const userEmail = req.headers['email'];

    console.log('Headers:', req.headers); 
    console.log('Extracted userEmail:', userEmail); 

    if (!auth) {
      return res
        .status(401)
        .json({ success: false, message: 'Unauthorized access!' });
    }
    const token = auth.split(' ')[1];
    if (!token) {
      return res.status(403).json({ success: false, message: 'Token missing' });
    }
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError.message);
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
        error: jwtError.message,
      });
    }
    const decodedAuctionHouseId = decoded.auctionHouseId;
    if (!decodedAuctionHouseId) {
      return res.status(400).json({
        success: false,
        message: 'Auction House ID is required!',
      });
    }
    let tempAuctionHouse;
    let tempAuctionHouseUser;

    tempAuctionHouse = await auctionHouse.AuctionHouse.findById(auctionHouseId);

    if (!tempAuctionHouse) {
      tempAuctionHouseUser =
        await auctionHouse.AuctionHouseUser.findById(auctionHouseId);

      if (!tempAuctionHouseUser) {
        return res.status(404).json({
          success: false,
          message: 'Auction House or User not found',
        });
      }
      if (tempAuctionHouseUser.jobTitle !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Only admins can delete users.',
        });
      }
    }
    const userToDelete = await auctionHouse.AuctionHouseUser.findOne({
      email: userEmail,
    });

    console.log('User to delete:', userToDelete); 

    if (!userToDelete) {
      return res.status(404).json({
        success: false,
        message: 'User to be deleted not found',
      });
    }

    if (
      userToDelete.auctionHouseId.toString() !==
      (
        tempAuctionHouse?._id || tempAuctionHouseUser?.auctionHouseId
      )?.toString()
    ) {
      return res.status(403).json({
        success: false,
        message:
          'Unauthorized access. The user does not belong to this auction house.',
      });
    }
    await auctionHouse.AuctionHouseUser.findOneAndDelete({ email: userEmail });

    console.log('User deleted:', userEmail); 

    return res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting auction house user:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};



exports.getAuctionHouseAnalytics = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    let auctionHouseId = decoded.auctionHouseId;
    if (!auctionHouseId) return res.status(400).json({ success: false, message: 'Auction House ID required' });
    let tempAuctionHouse;
    tempAuctionHouse = await auctionHouse.AuctionHouse.findById(auctionHouseId);
    if (!tempAuctionHouse) {
      const tempAuctionHouseUser = await auctionHouse.AuctionHouseUser.findById(auctionHouseId);
      if (!tempAuctionHouseUser) {
        return res.status(404).json({ success: false, message: 'Auction House or User not found' });
      }
      if(tempAuctionHouseUser.jobTitle!=="admin"||tempAuctionHouseUser.jobTitle!=="sales"){
        return res.status(403).json({
          success: false,
          message: 'You do not have privileges to access the dashboard',
        });
      }
      auctionHouseId = tempAuctionHouseUser.auctionHouseId;
    }
    const auctionItems = await auctionItem.find({ auctionHouseId: auctionHouseId });
    let totalRevenue = 0;
    let totalItemsDelievered=0
    let totalItemSold=0;
    let orderCancelled=0;
    let successRate=0;
    const totalItems = auctionItems.length;
    const totalOrders = await Order.countDocuments({ auctionItem: { $in: auctionItems.map(item => item._id) } });
    const ads= await Ad.find({advertiserId:auctionHouseId})
    let activeAds=0;
    let adClicks=0;
    let adSpent=0;
    for (const ad of ads) {
      if(ad.isActive){
        const adTransactions = await Transaction.find({ adId: ad._id });
        adSpent += adTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
        adClicks += ad.clicks;
        activeAds++;
      }
    }
    for (const item of auctionItems) {
      if(item.status==="completed"){
        const order= await Order.findOne({ auctionItem: item.id });
        if(order){
        totalItemSold++;

        }
       if (order && order.status === "delivered") {
          totalRevenue += item.currentBid;
          totalItemsDelievered++;
       
        }
        if(order && order.status==="cancelled"){
          orderCancelled++;
        }

      }
      }
      successRate = totalItemSold > 0 ? (totalItemsDelievered / totalOrders) * 100 : 0;

    return res.status(200).json({
      success: true,
      message: 'Dashboard data fetched successfully',
      data:{
        totalItems,
        totalRevenue,
        totalItemsDelievered,
        totalItemSold,
        orderCancelled,
        successRate,
        activeAds,
        adClicks,
        adSpent,
      }
      
    
    });
  } catch (error) {
    console.error('Dashboard Error:', error.message);
    return res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};