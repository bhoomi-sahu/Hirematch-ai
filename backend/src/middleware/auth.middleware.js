const jwt = require('jsonwebtoken');
const { User } = require('../models');
const ApiError = require('../utils/ApiError');
const config = require('../config/env');

/**
 * Middleware to verify JWT and authenticate user
 */
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(
      ApiError.unauthorized('Access denied. No authentication token provided.')
    );
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);

    const user = await User.findById(decoded.id);
    if (!user) {
      return next(
        ApiError.unauthorized('User belonging to this token no longer exists.')
      );
    }

    if (user.isActive === false) {
      return next(ApiError.forbidden('This account has been suspended. Please contact support.'));
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(ApiError.unauthorized('Token expired. Please login again.'));
    }
    return next(ApiError.unauthorized('Invalid authentication token.'));
  }
};

/**
 * Optional Authentication: Attaches user if token is present and valid, but doesn't fail if absent
 */
const optionalProtect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    const user = await User.findById(decoded.id);
    if (user) {
      req.user = user;
    }
    next();
  } catch (err) {
    // Continue without user
    next();
  }
};

/**
 * Middleware to enforce role-based access control
 * @param  {...string} roles Allowed roles ('candidate', 'recruiter', 'admin')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `Role '${req.user.role}' is not authorized to access this resource`
        )
      );
    }

    next();
  };
};

module.exports = {
  protect,
  optionalProtect,
  authorize,
};
