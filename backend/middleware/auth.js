import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized, no token provided',
        });
      }

      // Verify token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'spend_a_friend_super_secure_jwt_secret_dev_2026_xyz!@#'
      );

      // Find user by id, exclude password
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'The user belonging to this token no longer exists',
        });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('Auth middleware error:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token is invalid or expired',
      });
    }
  } else {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token provided in Authorization header',
    });
  }
};
