/**
 * Logger Utility
 * Provides logging functionality with different levels
 */

const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Log levels
const levels = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
};

// Get current log file path
const getLogFilePath = () => {
  const date = new Date();
  const filename = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}.log`;
  return path.join(logsDir, filename);
};

// Format log message
const formatLog = (level, message, data = null) => {
  const timestamp = new Date().toISOString();
  let logMessage = `[${timestamp}] [${level}] ${message}`;
  
  if (data) {
    logMessage += `\n${JSON.stringify(data, null, 2)}`;
  }
  
  return logMessage;
};

// Write to log file
const writeToFile = (logMessage) => {
  try {
    const logFile = getLogFilePath();
    fs.appendFileSync(logFile, logMessage + '\n\n');
  } catch (error) {
    console.error('Error writing to log file:', error);
  }
};

// Log function
const log = (level, message, data = null) => {
  const logMessage = formatLog(level, message, data);
  
  // Always write to file
  writeToFile(logMessage);
  
  // Console output based on environment
  if (process.env.NODE_ENV === 'development') {
    switch (level) {
      case levels.ERROR:
        console.error(`\x1b[31m${logMessage}\x1b[0m`); // Red
        break;
      case levels.WARN:
        console.warn(`\x1b[33m${logMessage}\x1b[0m`); // Yellow
        break;
      case levels.INFO:
        console.log(`\x1b[36m${logMessage}\x1b[0m`); // Cyan
        break;
      case levels.DEBUG:
        console.log(`\x1b[35m${logMessage}\x1b[0m`); // Magenta
        break;
      default:
        console.log(logMessage);
    }
  } else {
    // Production: only log errors and warnings to console
    if (level === levels.ERROR || level === levels.WARN) {
      console.log(logMessage);
    }
  }
};

// Export logger functions
module.exports = {
  error: (message, data) => log(levels.ERROR, message, data),
  warn: (message, data) => log(levels.WARN, message, data),
  info: (message, data) => log(levels.INFO, message, data),
  debug: (message, data) => log(levels.DEBUG, message, data),
  
  // Specific logging functions
  logBookingCreated: (bookingId, userId, vehicleId) => {
    module.exports.info('Booking created', {
      bookingId,
      userId,
      vehicleId
    });
  },
  
  logPaymentProcessed: (bookingId, amount, status) => {
    module.exports.info('Payment processed', {
      bookingId,
      amount,
      status
    });
  },
  
  logPaymentFailed: (bookingId, error) => {
    module.exports.error('Payment failed', {
      bookingId,
      error: error.message
    });
  },
  
  logUserAuthenticated: (userId, email) => {
    module.exports.info('User authenticated', {
      userId,
      email
    });
  },
  
  logAdminAction: (adminId, action, targetId) => {
    module.exports.info('Admin action performed', {
      adminId,
      action,
      targetId
    });
  },
  
  logError: (functionName, error) => {
    module.exports.error(`Error in ${functionName}`, {
      message: error.message,
      stack: error.stack
    });
  },
  
  // Get log file contents
  getLogFile: (filename) => {
    try {
      const logFile = path.join(logsDir, filename);
      if (fs.existsSync(logFile)) {
        return fs.readFileSync(logFile, 'utf-8');
      }
      return null;
    } catch (error) {
      module.exports.error('Error reading log file', error);
      return null;
    }
  },
  
  // List all log files
  listLogFiles: () => {
    try {
      const files = fs.readdirSync(logsDir).filter(f => f.endsWith('.log'));
      return files.sort().reverse(); // Most recent first
    } catch (error) {
      module.exports.error('Error listing log files', error);
      return [];
    }
  },
  
  // Clear old logs (older than days)
  clearOldLogs: (daysOld = 7) => {
    try {
      const files = fs.readdirSync(logsDir);
      const now = Date.now();
      const cutoff = now - (daysOld * 24 * 60 * 60 * 1000);
      
      files.forEach(file => {
        const filePath = path.join(logsDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtimeMs < cutoff) {
          fs.unlinkSync(filePath);
          module.exports.info(`Deleted old log file: ${file}`);
        }
      });
    } catch (error) {
      module.exports.error('Error clearing old logs', error);
    }
  }
};
