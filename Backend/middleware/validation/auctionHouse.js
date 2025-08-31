const { check, validationResult } = require('express-validator');

exports.validateAuctionHouseSignUp = [
  check('name')
    .trim()
    .not()
    .isEmpty()
    .withMessage('Name is required!')
    .isString()
    .withMessage('Valid Name is required!')
    .isLength({ min: 3, max: 64 })
    .withMessage('Name must be between 3 and 64 characters!'),
  check('ntn')
    .trim()
    .not()
    .isEmpty()
    .withMessage('NTN is required!')
    .isString()
    .withMessage('Valid NTN is required!')
    .isLength({ min: 3, max: 64 })
    .withMessage('NTN must be between 3 and 64 characters!'),
  check('email').normalizeEmail().isEmail().withMessage('Invalid email'),
  check('location.xAxis')
    .not()
    .isEmpty()
    .withMessage('Location xAxis is required!')
    .isString()
    .withMessage('Valid xAxis is required!'),
  check('location.yAxis')
    .not()
    .isEmpty()
    .withMessage('Location yAxis is required!')
    .isString()
    .withMessage('Valid yAxis is required!'),
  check('phoneNumber')
    .trim()
    .not()
    .isEmpty()
    .withMessage('Phone Number is required!')
    .isString()
    .withMessage('Valid Phone Number is required!')
    .isLength({ min: 11, max: 11 })
    .withMessage('Phone number should be exactly 11 characters!'),
  check('password')
    .trim()
    .not()
    .isEmpty()
    .withMessage('Password is required!')
    .isLength({ min: 8, max: 20 })
    .withMessage('Password must be between 8 and 20 characters!'),
  check('confirmPassword')
    .trim()
    .not()
    .isEmpty()
    .withMessage('Confirm password is required!')
    .isLength({ min: 8, max: 20 })
    .withMessage('Confirm password must be between 8 and 20 characters!')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords must match!');
      }
      return true;
    }),
];
exports.validateAuctionItem = [
  check('title')
    .trim()
    .not()
    .isEmpty()
    .withMessage('Title is required!')
    .isString()
    .withMessage('Valid Title is required!')
    .isLength({ min: 3, max: 64 })
    .withMessage('Title must be between 3 and 64 characters!'),
  check('description')
    .trim()
    .not()
    .isEmpty()
    .withMessage('Description is required!')
    .isString()
    .withMessage('Valid Description is required!')
    .isLength({ min: 3, max: 64 })
    .withMessage('Description must be between 3 and 64 characters!'),

  check('startingBid')
    .trim()
    .not()
    .isEmpty()
    .withMessage('starting Bid is required!')
    .isString()
    .withMessage('Valid Price is required!')
    .isLength({ min: 3, max: 64 })
    .withMessage('startin Bid must be between 3 and 64 characters!'),
];

exports.validateAuctionHouseSignIn = [
  check('email').trim().isEmail().withMessage('Email / Password required'),
  check('password').trim().notEmpty().withMessage('Email / Password required'),
];
exports.validateAuctionHouseUserSignIn = [
  check('email').trim().isEmail().withMessage('Email / Password required'),
  check('password').trim().notEmpty().withMessage('Email / Password required'),
];

exports.validateAuctionHouseUserSignUp = [
  check('name')
    .trim()
    .not()
    .isEmpty()
    .withMessage('Name is required!')
    .isString()
    .withMessage('Valid Name is required!')
    .isLength({ min: 3, max: 64 })
    .withMessage('Name must be between 3 and 64 characters!'),

  check('email').normalizeEmail().isEmail().withMessage('Invalid email'),

  check('phoneNumber')
    .trim()
    .not()
    .isEmpty()
    .withMessage('Phone Number is required!')
    .isString()
    .withMessage('Valid Phone Number is required!')
    .isLength({ min: 11, max: 11 })
    .withMessage('Phone number should be exactly 11 characters!'),

  check('password')
    .trim()
    .not()
    .isEmpty()
    .withMessage('Password is required!')
    .isLength({ min: 8, max: 20 })
    .withMessage('Password must be between 8 and 20 characters!'),
  check('confirmPassword')
    .trim()
    .not()
    .isEmpty()
    .withMessage('Confirm password is required!')
    .isLength({ min: 8, max: 20 })
    .withMessage('Confirm password must be between 8 and 20 characters!')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords must match!');
      }
      return true;
    }),

  check('jobTitle')
    .not()
    .isEmpty()
    .withMessage('Job Title is required!')
    .isIn(['sales', 'lister', 'admin'])
    .withMessage(
      'Job Title must be one of the following: sales, lister, manager, or admin',
    ),

  check('auctionHouseId')
    .not()
    .isEmpty()
    .withMessage('Auction House ID is required!')
    .isMongoId()
    .withMessage('Auction House ID must be a valid MongoDB ObjectId'),
];

exports.auctionHouseValidation = (req, res, next) => {
  const result = validationResult(req).array();
  if (!result.length) return next();
  const error = result[0].msg;
  res.json({ success: false, message: error });
};

exports.auctionHouseUserValidation = (req, res, next) => {
  const result = validationResult(req).array();
  if (!result.length) return next();
  const error = result[0].msg;
  res.json({ success: false, message: error + ' in auction house user' });
};
