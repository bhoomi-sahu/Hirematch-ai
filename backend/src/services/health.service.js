const mongoose = require('mongoose');
const config = require('../config/env');

class HealthService {
  getHealthStatus() {
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };

    const dbState = states[mongoose.connection.readyState] || 'unknown';
    const isDbConnected = mongoose.connection.readyState === 1;

    const memoryUsage = process.memoryUsage();
    const formattedMemory = {
      rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
    };

    return {
      status: isDbConnected ? 'healthy' : 'degraded',
      service: 'HireMatch AI Backend API',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      environment: config.env,
      database: {
        status: dbState,
        host: mongoose.connection.host || 'N/A',
        name: mongoose.connection.name || 'N/A',
        port: mongoose.connection.port || 'N/A',
      },
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        memory: formattedMemory,
      },
    };
  }
}

module.exports = new HealthService();
