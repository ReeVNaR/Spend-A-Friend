import express from 'express';
import jwt from 'jsonwebtoken';
import { body } from 'express-validator';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';

const router = express.Router();

/**
 * Helper to generate JWT token for a user
 */
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'spend_a_friend_super_secure_jwt_secret_dev_2026_xyz!@#',
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
    body('defaultCurrency')
      .optional()
      .isIn(['INR', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD'])
      .withMessage('Invalid default currency'),
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const { name, email, password, defaultCurrency, avatar } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'An account with this email already exists',
        });
      }

      // Create new user (password is automatically hashed by pre-save hook)
      const userData = {
        name,
        email,
        password,
      };

      if (defaultCurrency) userData.defaultCurrency = defaultCurrency.toUpperCase();
      if (avatar) userData.avatar = avatar;

      const user = await User.create(userData);

      const token = generateToken(user._id);

      return res.status(201).json({
        success: true,
        message: 'User registered successfully',
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          defaultCurrency: user.defaultCurrency,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const { email, password } = req.body;

      // Find user and explicitly select password field
      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
      }

      // Check password
      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
      }

      const token = generateToken(user._id);

      return res.status(200).json({
        success: true,
        message: 'Logged in successfully',
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          defaultCurrency: user.defaultCurrency,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   GET /api/auth/me
// @desc    Get current logged in user profile
// @access  Protected
router.get('/me', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/auth/me
// @desc    Update current user profile
// @access  Protected
router.put(
  '/me',
  protect,
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('defaultCurrency')
      .optional()
      .isIn(['INR', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD'])
      .withMessage('Invalid default currency'),
    body('avatar').optional().trim(),
    body('currentPassword').optional(),
    body('newPassword')
      .optional()
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters long'),
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const user = await User.findById(req.user._id).select('+password');
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      const { name, avatar, defaultCurrency, currentPassword, newPassword } = req.body;

      if (name) user.name = name;
      if (avatar) user.avatar = avatar;
      if (defaultCurrency) user.defaultCurrency = defaultCurrency.toUpperCase();

      // Password update handling
      if (newPassword) {
        if (!currentPassword) {
          return res.status(400).json({
            success: false,
            message: 'Current password is required to set a new password',
          });
        }

        const isMatch = await user.matchPassword(currentPassword);
        if (!isMatch) {
          return res.status(400).json({
            success: false,
            message: 'Current password is incorrect',
          });
        }

        user.password = newPassword;
      }

      await user.save();

      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          defaultCurrency: user.defaultCurrency,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
