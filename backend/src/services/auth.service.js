const jwt = require('jsonwebtoken');
const { User } = require('../models');
const ApiError = require('../utils/ApiError');
const config = require('../config/env');

class AuthService {
  /**
   * Generate JWT Token
   */
  generateToken(user) {
    return jwt.sign(
      {
        id: user._id,
        role: user.role,
        email: user.email,
      },
      config.jwt.secret,
      {
        expiresIn: config.jwt.expiresIn,
      }
    );
  }

  /**
   * Register a new user
   */
  async registerUser({ name, email, password, role = 'candidate', companyName, adminAccessCode }) {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedRole = role || 'candidate';

    // Check for existing user
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      throw ApiError.badRequest('An account with this email already exists');
    }

    if (normalizedRole === 'recruiter') {
      if (!companyName || String(companyName).trim().length < 2) {
        throw ApiError.badRequest('Company name is required for recruiter accounts');
      }
    }

    if (normalizedRole === 'admin') {
      const expectedCode = (process.env.ADMIN_REGISTRATION_CODE || 'JOBMATCH_ADMIN_2026').trim();
      if (!adminAccessCode || String(adminAccessCode).trim() !== expectedCode) {
        throw ApiError.badRequest('A valid admin access code is required');
      }
    }

    const userPayload = {
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: normalizedRole,
    };

    if (normalizedRole === 'recruiter' && companyName) {
      userPayload.companyName = String(companyName).trim();
    }

    if (normalizedRole === 'admin' && adminAccessCode) {
      userPayload.adminAccessCode = String(adminAccessCode).trim();
    }

    const user = await User.create(userPayload);

    const token = this.generateToken(user);

    return {
      user: user.toJSON(),
      token,
    };
  }

  /**
   * Login user
   */
  async loginUser({ email, password }) {
    const normalizedEmail = email.trim().toLowerCase();

    // Find user with explicit password selection
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    if (user.isActive === false) {
      throw ApiError.forbidden('This account has been suspended. Please contact support.');
    }

    const token = this.generateToken(user);

    return {
      user: user.toJSON(),
      token,
    };
  }

  /**
   * Retrieve current user profile
   */
  async getCurrentUser(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    return user.toJSON();
  }
}

module.exports = new AuthService();
