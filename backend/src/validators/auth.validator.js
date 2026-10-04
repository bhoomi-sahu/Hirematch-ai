const ApiError = require('../utils/ApiError');

const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;

const validateRegister = (req, res, next) => {
  const {
    name,
    email,
    password,
    role = 'candidate',
    companyName,
    adminAccessCode,
  } = req.body;
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push('Name is required');
  }

  if (!email || !emailRegex.test(email.trim())) {
    errors.push('A valid email address is required');
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }

  const validRoles = ['candidate', 'recruiter', 'admin'];
  if (!validRoles.includes(role)) {
    errors.push(`Role must be one of: ${validRoles.join(', ')}`);
  }

  if (role === 'recruiter') {
    if (!companyName || typeof companyName !== 'string' || companyName.trim().length < 2) {
      errors.push('Company name is required for recruiter accounts');
    }
  }

  if (role === 'admin') {
    const expectedCode = (process.env.ADMIN_REGISTRATION_CODE || 'JOBMATCH_ADMIN_2026').trim();
    if (!adminAccessCode || String(adminAccessCode).trim() !== expectedCode) {
      errors.push('A valid admin access code is required');
    }
  }

  if (errors.length > 0) {
    return next(new ApiError(400, errors[0], errors));
  }

  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email || !emailRegex.test(email.trim())) {
    errors.push('Please provide a valid email address');
  }

  if (!password) {
    errors.push('Password is required');
  }

  if (errors.length > 0) {
    return next(new ApiError(400, errors[0], errors));
  }

  next();
};

module.exports = {
  validateRegister,
  validateLogin,
};
