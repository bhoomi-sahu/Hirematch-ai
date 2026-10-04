const morgan = require('morgan');
const config = require('../config/env');

// Formatted request logging
const requestLogger = morgan(config.env === 'development' ? 'dev' : 'combined');

module.exports = requestLogger;
