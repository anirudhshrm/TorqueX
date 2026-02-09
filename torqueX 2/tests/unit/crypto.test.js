/**
 * Unit Tests for Crypto Utilities
 */

const crypto = require('../../src/utils/crypto');

describe('Crypto Utils', () => {
  describe('hashPassword', () => {
    it('should hash a password and return hash and salt', async () => {
      const password = 'testPassword123';
      const result = await crypto.hashPassword(password);

      expect(result).toHaveProperty('hash');
      expect(result).toHaveProperty('salt');
      expect(result.hash).toBeTruthy();
      expect(result.salt).toBeTruthy();
      expect(typeof result.hash).toBe('string');
      expect(typeof result.salt).toBe('string');
    });

    it('should generate different salts for same password', async () => {
      const password = 'testPassword123';
      const result1 = await crypto.hashPassword(password);
      const result2 = await crypto.hashPassword(password);

      expect(result1.salt).not.toBe(result2.salt);
      expect(result1.hash).not.toBe(result2.hash);
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const password = 'testPassword123';
      const { hash, salt } = await crypto.hashPassword(password);

      const isValid = await crypto.verifyPassword(password, hash, salt);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'testPassword123';
      const { hash, salt } = await crypto.hashPassword(password);

      const isValid = await crypto.verifyPassword('wrongPassword', hash, salt);
      expect(isValid).toBe(false);
    });

    it('should reject password with wrong salt', async () => {
      const password = 'testPassword123';
      const { hash } = await crypto.hashPassword(password);
      const { salt: wrongSalt } = await crypto.hashPassword('another');

      const isValid = await crypto.verifyPassword(password, hash, wrongSalt);
      expect(isValid).toBe(false);
    });
  });

  describe('encrypt and decrypt', () => {
    it('should encrypt and decrypt data correctly', () => {
      const data = 'Sensitive Information';
      const { encrypted, iv, authTag } = crypto.encrypt(data);
      
      expect(encrypted).toBeTruthy();
      expect(iv).toBeTruthy();
      expect(authTag).toBeTruthy();
      
      const decrypted = crypto.decrypt(encrypted, iv, authTag);
      expect(decrypted).toBe(data);
    });

    it('should produce different encrypted values for same data', () => {
      const data = 'Sensitive Information';
      const result1 = crypto.encrypt(data);
      const result2 = crypto.encrypt(data);

      // Different IVs should produce different encrypted values
      expect(result1.encrypted).not.toBe(result2.encrypted);
      expect(result1.iv).not.toBe(result2.iv);
    });

    it('should return null for empty input', () => {
      const result = crypto.encrypt('');
      expect(result).toBe(null);
    });

    it('should handle special characters', () => {
      const data = 'Test!@#$%^&*()_+-={}[]|:";\'<>?,./';
      const { encrypted, iv, authTag } = crypto.encrypt(data);
      
      const decrypted = crypto.decrypt(encrypted, iv, authTag);
      expect(decrypted).toBe(data);
    });
  });

  describe('generateChecksum', () => {
    it('should generate checksum consistently', () => {
      const data = 'test data';
      const checksum1 = crypto.generateChecksum(data);
      const checksum2 = crypto.generateChecksum(data);

      expect(checksum1).toBe(checksum2);
      expect(typeof checksum1).toBe('string');
    });

    it('should produce different checksums for different data', () => {
      const checksum1 = crypto.generateChecksum('data1');
      const checksum2 = crypto.generateChecksum('data2');

      expect(checksum1).not.toBe(checksum2);
    });

    it('should verify checksums correctly', () => {
      const data = 'test data';
      const checksum = crypto.generateChecksum(data);
      
      expect(crypto.verifyChecksum(data, checksum)).toBe(true);
      expect(crypto.verifyChecksum('wrong data', checksum)).toBe(false);
    });
  });
});
