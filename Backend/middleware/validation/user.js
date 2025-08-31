const { check, validationResult } = require('express-validator');

exports.validateUserSignUp = [
  check('firstName')
    .trim()
    .not()
    .isEmpty()
    .withMessage('First Name is required!')
    .isString()
    .withMessage('Valid Name is required!')
    .isLength({ min: 3, max: 64 })
    .withMessage('Name must be between 3 and 64 characters!'),
  check('lastName')
    .trim()
    .not()
    .isEmpty()
    .withMessage('Last Name is required!')
    .isString()
    .withMessage('Valid Name is required!')
    .isLength({ min: 3, max: 64 })
    .withMessage('Name must be between 3 and 64 characters!'),
  check('email')
    .normalizeEmail()
    .isEmail()
    .withMessage('Invalid email')
    .not()
    .isEmpty()
    .withMessage('Email is required!'),
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
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords must match!');
      }
      return true;
    }),
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
];

exports.validateUserSignIn = [
  check('email')
    .trim()
    .isEmail()
    .withMessage('Email / Password required')
    .normalizeEmail(),
  check('password').trim().notEmpty().withMessage('Email / Password required'),
];

exports.userValidation = (req, res, next) => {
  const result = validationResult(req).array();
  if (!result.length) return next();
  const error = result[0].msg;
  res.status(400).json({ success: false, message: error });
};

exports.editUserProfileValidation = [
  check('firstName')
    .trim()
    .not()
    .isEmpty()
    .withMessage('First Name is required!'),
  check('lastName')
    .trim()
    .not()
    .isEmpty()
    .withMessage('Last Name is required!'),
  check('email').trim().isEmail().normalizeEmail(),
  check('phoneNumber')
    .trim()
    .isLength({ min: 11, max: 11 })
    .withMessage('Phone number should be exactly 11 characters!'),
];
