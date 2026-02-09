/**
 * Unit Tests for Validators
 */

const validators = require('../../src/utils/validators');

describe('Validators', () => {
  describe('isValidEmail', () => {
    it('should validate correct email addresses', () => {
      expect(validators.isValidEmail('test@example.com')).toBe(true);
      expect(validators.isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(validators.isValidEmail('user+tag@example.com')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(validators.isValidEmail('invalid')).toBe(false);
      expect(validators.isValidEmail('invalid@')).toBe(false);
      expect(validators.isValidEmail('@example.com')).toBe(false);
      expect(validators.isValidEmail('user@')).toBe(false);
      expect(validators.isValidEmail('')).toBe(false);
    });
  });

  describe('isValidPhone', () => {
    it('should validate correct phone numbers', () => {
      expect(validators.isValidPhone('1234567890')).toBe(true);
      expect(validators.isValidPhone('123-456-7890')).toBe(true);
      expect(validators.isValidPhone('(123) 456-7890')).toBe(true);
      expect(validators.isValidPhone('+1 123 456 7890')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(validators.isValidPhone('123')).toBe(false);
      expect(validators.isValidPhone('abcdefghij')).toBe(false);
      expect(validators.isValidPhone('')).toBe(false);
    });
  });

  describe('sanitizeInput', () => {
    it('should remove dangerous HTML tags', () => {
      const input = '<script>alert("xss")</script>Hello';
      const sanitized = validators.sanitizeInput(input);
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('Hello');
    });

    it('should handle safe HTML tags', () => {
      const input = '<p>Hello World</p>';
      const sanitized = validators.sanitizeInput(input);
      expect(sanitized).toBeTruthy();
    });

    it('should handle empty strings', () => {
      const sanitized = validators.sanitizeInput('');
      expect(sanitized).toBe('');
    });
  });

  describe('isValidDate', () => {
    it('should validate correct dates', () => {
      expect(validators.isValidDate('2025-01-01')).toBe(true);
      expect(validators.isValidDate(new Date())).toBe(true);
    });

    it('should reject invalid dates', () => {
      expect(validators.isValidDate('invalid')).toBe(false);
      expect(validators.isValidDate('2025-13-01')).toBe(false);
      expect(validators.isValidDate('')).toBe(false);
    });
  });

  describe('isValidPrice', () => {
    it('should validate correct prices', () => {
      expect(validators.isValidPrice(100)).toBe(true);
      expect(validators.isValidPrice(99.99)).toBe(true);
      expect(validators.isValidPrice('50.00')).toBe(true);
    });

    it('should reject invalid prices', () => {
      expect(validators.isValidPrice(-10)).toBe(false);
      expect(validators.isValidPrice(0)).toBe(false);
      expect(validators.isValidPrice('invalid')).toBe(false);
      expect(validators.isValidPrice('')).toBe(false);
    });
  });
});
