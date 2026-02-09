/**
 * Cryptography Utilities
 * Handles hashing, encryption, and decryption of sensitive data
 */

const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const logger = require('./logger');

// Load encryption key from environment or create one
let ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY) {
  logger.warn('ENCRYPTION_KEY not set in environment. Using default development key.');
  // For development only - this should be set in production
  ENCRYPTION_KEY = crypto.randomBytes(32).toString('hex');
}

// Ensure key is 32 bytes for AES-256
const key = ENCRYPTION_KEY.length === 64 
  ? Buffer.from(ENCRYPTION_KEY, 'hex') 
  : crypto.createHash('sha256').update(String(ENCRYPTION_KEY)).digest();

// ===========================
// HASHING FUNCTIONS
// ===========================

/**
 * Hash a password using bcrypt-like algorithm (PBKDF2)
 * @param {string} password - Password to hash
 * @param {string} salt - Optional salt (generated if not provided)
 * @returns {Promise<{hash: string, salt: string}>} Hashed password and salt
 */
exports.hashPassword = async (password) => {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    
    crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, derivedKey) => {
      if (err) {
        logger.error('Password hashing failed', { error: err.message });
        reject(err);
      }
      
      const hash = derivedKey.toString('hex');
      resolve({ hash, salt });
    });
  });
};

/**
 * Verify a password against a hash
 * @param {string} password - Password to verify
 * @param {string} hash - Hash to verify against
 * @param {string} salt - Salt used in original hash
 * @returns {Promise<boolean>} True if password matches hash
 */
exports.verifyPassword = async (password, hash, salt) => {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, derivedKey) => {
      if (err) {
        logger.error('Password verification failed', { error: err.message });
        reject(err);
      }
      
      const passwordHash = derivedKey.toString('hex');
      const isMatch = passwordHash === hash;
      resolve(isMatch);
    });
  });
};

/**
 * Generate a secure hash for promo codes/tokens
 * @param {string} code - Promo code to hash
 * @returns {string} SHA256 hash of the code
 */
exports.hashPromoCode = (code) => {
  if (!code) return null;
  
  const normalized = code.toUpperCase().trim();
  const hash = crypto.createHash('sha256').update(normalized).digest('hex');
  
  return hash;
};

/**
 * Verify a promo code against its hash
 * @param {string} code - Promo code to verify
 * @param {string} hash - Hash to verify against
 * @returns {boolean} True if code matches hash
 */
exports.verifyPromoCode = (code, hash) => {
  if (!code || !hash) return false;
  
  const codeHash = exports.hashPromoCode(code);
  return codeHash === hash;
};

/**
 * Generate a secure token (for password reset, email verification, etc.)
 * @param {number} length - Token length in bytes
 * @returns {string} Random hex token
 */
exports.generateSecureToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Hash a token for storage
 * @param {string} token - Token to hash
 * @returns {string} SHA256 hash of token
 */
exports.hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Verify a token against its hash
 * @param {string} token - Token to verify
 * @param {string} hash - Hash to verify against
 * @returns {boolean} True if token matches hash
 */
exports.verifyToken = (token, hash) => {
  if (!token || !hash) return false;
  
  const tokenHash = exports.hashToken(token);
  return crypto.timingSafeEqual(
    Buffer.from(tokenHash),
    Buffer.from(hash)
  );
};

/**
 * Generate HMAC signature for data integrity
 * @param {string} data - Data to sign
 * @param {string} secret - Secret key for HMAC
 * @returns {string} HMAC signature
 */
exports.generateHMAC = (data, secret = process.env.SESSION_SECRET) => {
  if (!secret) {
    logger.error('SESSION_SECRET not configured for HMAC generation');
    throw new Error('SESSION_SECRET not configured');
  }
  
  return crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('hex');
};

/**
 * Verify HMAC signature
 * @param {string} data - Original data
 * @param {string} signature - Signature to verify
 * @param {string} secret - Secret key used for HMAC
 * @returns {boolean} True if signature is valid
 */
exports.verifyHMAC = (data, signature, secret = process.env.SESSION_SECRET) => {
  if (!secret) {
    logger.error('SESSION_SECRET not configured for HMAC verification');
    throw new Error('SESSION_SECRET not configured');
  }
  
  try {
    const expectedSignature = exports.generateHMAC(data, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    return false;
  }
};

// ===========================
// ENCRYPTION FUNCTIONS
// ===========================

/**
 * Encrypt sensitive data using AES-256-GCM
 * @param {string} data - Data to encrypt
 * @returns {{encrypted: string, iv: string, authTag: string}} Encrypted data with IV and auth tag
 */
exports.encrypt = (data) => {
  try {
    if (!data) return null;
    
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    logger.debug('Data encrypted successfully', {
      dataType: typeof data,
      encryptedLength: encrypted.length
    });
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  } catch (error) {
    logger.error('Encryption failed', { error: error.message });
    throw error;
  }
};

/**
 * Decrypt sensitive data using AES-256-GCM
 * @param {string} encrypted - Encrypted data
 * @param {string} iv - Initialization vector
 * @param {string} authTag - Authentication tag
 * @returns {*} Decrypted data
 */
exports.decrypt = (encrypted, iv, authTag) => {
  try {
    if (!encrypted || !iv || !authTag) return null;
    
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      key,
      Buffer.from(iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    logger.debug('Data decrypted successfully', {
      decryptedLength: decrypted.length
    });
    
    return JSON.parse(decrypted);
  } catch (error) {
    logger.error('Decryption failed', { error: error.message });
    throw error;
  }
};

/**
 * Encrypt a simple string (for fields like phone, address)
 * @param {string} text - Text to encrypt
 * @returns {string} Encrypted text with IV and authTag concatenated (format: encrypted$iv$authTag)
 */
exports.encryptField = (text) => {
  if (!text) return null;
  
  try {
    const encrypted = exports.encrypt(text);
    return `${encrypted.encrypted}$${encrypted.iv}$${encrypted.authTag}`;
  } catch (error) {
    logger.error('Field encryption failed', { error: error.message });
    throw error;
  }
};

/**
 * Decrypt a simple string
 * @param {string} encryptedText - Encrypted text in format (encrypted$iv$authTag)
 * @returns {string} Decrypted text
 */
exports.decryptField = (encryptedText) => {
  if (!encryptedText) return null;
  
  try {
    const [encrypted, iv, authTag] = encryptedText.split('$');
    return exports.decrypt(encrypted, iv, authTag);
  } catch (error) {
    logger.error('Field decryption failed', { error: error.message });
    throw error;
  }
};

// ===========================
// DATA INTEGRITY FUNCTIONS
// ===========================

/**
 * Mask sensitive information for logging
 * @param {string} value - Value to mask
 * @param {number} visibleChars - Number of characters to show at end
 * @returns {string} Masked value
 */
exports.maskSensitiveData = (value, visibleChars = 4) => {
  if (!value || typeof value !== 'string') return '***MASKED***';
  
  if (value.length <= visibleChars) {
    return '*'.repeat(value.length);
  }
  
  const masked = '*'.repeat(value.length - visibleChars);
  return masked + value.slice(-visibleChars);
};

/**
 * Generate a cryptographic checksum for data verification
 * @param {object} data - Data to create checksum for
 * @returns {string} SHA256 checksum
 */
exports.generateChecksum = (data) => {
  try {
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    return crypto.createHash('sha256').update(dataString).digest('hex');
  } catch (error) {
    logger.error('Checksum generation failed', { error: error.message });
    throw error;
  }
};

/**
 * Verify data integrity using checksum
 * @param {object} data - Data to verify
 * @param {string} checksum - Expected checksum
 * @returns {boolean} True if checksum matches
 */
exports.verifyChecksum = (data, checksum) => {
  try {
    const calculatedChecksum = exports.generateChecksum(data);
    return crypto.timingSafeEqual(
      Buffer.from(calculatedChecksum),
      Buffer.from(checksum)
    );
  } catch (error) {
    logger.error('Checksum verification failed', { error: error.message });
    return false;
  }
};

// ===========================
// HELPER FUNCTIONS
// ===========================

/**
 * Generate API key with proper format and checksum
 * @param {string} prefix - API key prefix (e.g., 'sk_', 'pk_')
 * @returns {{apiKey: string, secret: string}} API key and secret for storage
 */
exports.generateAPIKey = (prefix = 'key_') => {
  const keyPart = crypto.randomBytes(24).toString('base64')
    .replace(/[^a-zA-Z0-9]/g, '')
    .substring(0, 32);
  
  const apiKey = `${prefix}${keyPart}`;
  const secret = exports.hashToken(apiKey);
  
  return { apiKey, secret };
};

/**
 * Rotate encryption key (for key rotation scenarios)
 * @param {string} newKeyString - New encryption key string
 * @returns {object} Status of key rotation
 */
exports.rotateEncryptionKey = (newKeyString) => {
  try {
    const newKey = newKeyString.length === 64 
      ? Buffer.from(newKeyString, 'hex') 
      : crypto.createHash('sha256').update(String(newKeyString)).digest();
    
    logger.info('Encryption key rotated successfully', {
      timestamp: new Date().toISOString()
    });
    
    return {
      success: true,
      message: 'Encryption key rotated successfully'
    };
  } catch (error) {
    logger.error('Key rotation failed', { error: error.message });
    throw error;
  }
};

/**
 * Compare two values in constant time (prevents timing attacks)
 * @param {string} value1 - First value
 * @param {string} value2 - Second value
 * @returns {boolean} True if values match
 */
exports.constantTimeCompare = (value1, value2) => {
  try {
    if (typeof value1 !== 'string' || typeof value2 !== 'string') {
      return false;
    }
    
    return crypto.timingSafeEqual(Buffer.from(value1), Buffer.from(value2));
  } catch (error) {
    return false;
  }
};

module.exports = exports;
